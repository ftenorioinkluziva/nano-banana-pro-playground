import { type NextRequest, NextResponse } from "next/server"
import { KieAIService } from "@/lib/kieai-service"
import type { ScriptOutput } from "@/lib/agents/script-generator"

export const dynamic = "force-dynamic"
export const maxDuration = 600 // 10 minutes for video generation

const FILE_UPLOAD_ENDPOINT = "https://kieai.redpandaai.co/api/file-base64-upload"

interface KieFileUploadResponse {
  success: boolean
  code: number
  msg: string
  data?: {
    fileName: string
    filePath: string
    downloadUrl: string
    fileSize: number
    mimeType: string
    uploadedAt: string
  }
}

interface ErrorResponse {
  error: string
  details?: string
}

/**
 * Upload a base64 image to Kie's file upload API
 */
async function uploadBase64Image(base64Data: string, apiKey: string): Promise<string> {
  const response = await fetch(FILE_UPLOAD_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      base64Data,
      uploadPath: "videos/images",
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Failed to upload image: ${errorData.msg || response.statusText}`)
  }

  const uploadResult: KieFileUploadResponse = await response.json()

  if (!uploadResult.success || !uploadResult.data?.downloadUrl) {
    throw new Error(`File upload failed: ${uploadResult.msg || "Unknown error"}`)
  }

  return uploadResult.data.downloadUrl
}

/**
 * POST /api/scripts/[id]/scenes/[sceneId]/generate-video
 * Generates a video for a specific scene in a UGC script
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  try {
    const { id: scriptId, sceneId } = await params

    // Validate parameters
    if (!scriptId || !sceneId) {
      return NextResponse.json<ErrorResponse>(
        { error: "Missing scriptId or sceneId" },
        { status: 400 }
      )
    }

    // Check API key
    const kieApiKey = process.env.KIEAI_API_KEY
    if (!kieApiKey) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Configuration error",
          details: "KIE.AI API key not configured. Please add KIEAI_API_KEY to environment variables.",
        },
        { status: 500 }
      )
    }

    // Initialize database connection
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    // Fetch script from database
    const scripts = await sql`
      SELECT id, script_json, persona_image_base64, product_name
      FROM scripts
      WHERE id = ${scriptId}
    `

    if (!scripts || scripts.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: "Script not found" },
        { status: 404 }
      )
    }

    const script = scripts[0]
    const scriptData = script.script_json as ScriptOutput

    // Extract specific scene
    const scene = scriptData.scenes.find(s => s.scene_id === parseInt(sceneId))

    if (!scene) {
      return NextResponse.json<ErrorResponse>(
        { error: `Scene ${sceneId} not found in script` },
        { status: 404 }
      )
    }

    // Validate video_prompt_en
    if (!scene.video_prompt_en || scene.video_prompt_en.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: "Scene has empty video_prompt_en. Please regenerate the script." },
        { status: 400 }
      )
    }

    // Check if video already exists or is generating
    const existingVideos = await sql`
      SELECT * FROM scene_videos
      WHERE script_id = ${scriptId} AND scene_id = ${parseInt(sceneId)}
        AND status IN ('complete', 'generating')
    `

    if (existingVideos.length > 0) {
      return NextResponse.json({
        success: true,
        sceneVideo: existingVideos[0],
        message: "Video already exists or is currently generating"
      })
    }

    // Upload persona image as start and end frames
    console.log("Uploading persona image as start/end frames...")

    let startFrameUrl: string
    let endFrameUrl: string

    try {
      // Upload the same persona image for both start and end frames
      startFrameUrl = await uploadBase64Image(script.persona_image_base64, kieApiKey)
      endFrameUrl = startFrameUrl // Use same image for both frames

      console.log("Persona image uploaded successfully:", startFrameUrl)
    } catch (uploadError) {
      console.error("Error uploading persona image:", uploadError)
      return NextResponse.json<ErrorResponse>(
        {
          error: "Failed to upload persona image",
          details: uploadError instanceof Error ? uploadError.message : "Unknown error"
        },
        { status: 500 }
      )
    }

    // Determine generation parameters
    const videoParams = {
      prompt: scene.video_prompt_en,
      model: "veo3_fast" as const, // Fast model for quick generation
      aspectRatio: "9:16" as const, // Vertical for UGC selfie
      resolution: "720p" as const, // Standard resolution
      duration: `${scene.duration_seconds}s` as const, // From scene duration
      mode: "FIRST_AND_LAST_FRAMES_2_VIDEO" as const, // Frames to Video mode
      imageUrls: [startFrameUrl, endFrameUrl] // Start and end frames
    }

    // Validate prompt length
    if (videoParams.prompt.length > 2000) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Video prompt too long (max 2000 characters)",
          details: `Current length: ${videoParams.prompt.length} characters`
        },
        { status: 400 }
      )
    }

    // Create initial database record
    const sceneVideoId = crypto.randomUUID()

    await sql`
      INSERT INTO scene_videos (
        id, script_id, scene_id,
        prompt_used, model, aspect_ratio, resolution, duration, mode,
        status
      ) VALUES (
        ${sceneVideoId}, ${scriptId}, ${parseInt(sceneId)},
        ${videoParams.prompt}, ${videoParams.model}, ${videoParams.aspectRatio},
        ${videoParams.resolution}, ${videoParams.duration}, ${videoParams.mode},
        'generating'
      )
    `

    // Generate video via KieAI with frames
    try {
      // Initialize KieAI service
      const kieService = new KieAIService(kieApiKey)

      const result = await kieService.generateVideoWithPolling({
        prompt: videoParams.prompt,
        model: videoParams.model,
        aspectRatio: videoParams.aspectRatio,
        resolution: videoParams.resolution,
        duration: videoParams.duration,
        mode: videoParams.mode,
        imageUrls: videoParams.imageUrls // Pass start and end frames
      }, {
        maxAttempts: 60, // 10 minutes (10s * 60)
        pollInterval: 10000 // 10 seconds
      })

      // Download video as base64
      const videoBase64 = await kieService.downloadVideoAsBase64(result.videoUrl)

      // Update database with successful result
      await sql`
        UPDATE scene_videos
        SET
          video_url = ${result.videoUrl},
          video_base64 = ${videoBase64},
          task_id = ${result.taskId},
          status = 'complete',
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${sceneVideoId}
      `

      return NextResponse.json({
        success: true,
        sceneVideo: {
          id: sceneVideoId,
          script_id: scriptId,
          scene_id: parseInt(sceneId),
          video_url: result.videoUrl,
          video_base64: videoBase64,
          status: "complete" as const,
          task_id: result.taskId,
          prompt_used: videoParams.prompt,
          model: videoParams.model,
          aspect_ratio: videoParams.aspectRatio,
          resolution: videoParams.resolution,
          duration: videoParams.duration,
          mode: videoParams.mode,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }
      })

    } catch (error) {
      // Update database with error
      const errorMessage = error instanceof Error ? error.message : "Unknown error during video generation"

      await sql`
        UPDATE scene_videos
        SET
          status = 'error',
          error_message = ${errorMessage},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${sceneVideoId}
      `

      console.error(`Video generation error for scene ${sceneId}:`, error)

      return NextResponse.json({
        success: false,
        error: errorMessage,
        sceneVideo: {
          id: sceneVideoId,
          script_id: scriptId,
          scene_id: parseInt(sceneId),
          status: "error" as const,
          error_message: errorMessage
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Error in generate-video route:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to generate video for scene",
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
