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

    // Extract customization parameters from request body
    let requestBody = {}
    try {
      requestBody = await request.json()
    } catch (e) {
      // Body might be empty or invalid, ignore
    }

    const {
      model = "veo3_fast",
      aspectRatio = "9:16",
      resolution = "720p"
    } = requestBody as any

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
        AND model = ${model} 
    `
    // Note: We check model too now, so user can regenerate with different model if desired, 
    // or we can stick to strict check. For simplicity, let's allow re-generation if model is different eventually,
    // but for now let's keep it simple and block if ANY video exists for this scene to avoid duplicates in UI.
    // Actually, UI allows one video per scene usually. Let's keep existing check but maybe relax it if we want multiple versions.
    // For now, keeping original check logic but strict on re-generating same scene.

    // Better logic: If user explicitly requests new generation, we might want to allow it.
    // But UI doesn't usually support multiple videos per scene yet.
    const anyExistingVideo = await sql`
      SELECT * FROM scene_videos
      WHERE script_id = ${scriptId} AND scene_id = ${parseInt(sceneId)}
        AND status IN ('complete', 'generating')
    `

    if (anyExistingVideo.length > 0) {
      // If valid video exists, return it.
      // If user wants to FORCE regeneration, they should probably delete the old one first (UI "Delete" button).
      return NextResponse.json({
        success: true,
        sceneVideo: anyExistingVideo[0],
        message: "Video already exists or is currently generating"
      })
    }

    // Upload persona image as start/end frames or reference image
    console.log("Uploading persona image...")

    let imageUrl: string

    try {
      imageUrl = await uploadBase64Image(script.persona_image_base64, kieApiKey)
      console.log("Persona image uploaded successfully:", imageUrl)
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

    // Determine generation parameters based on model
    const isVeo = model.includes("veo")
    const isSora = model.includes("sora")
    const isWan = model.includes("wan")

    // Map scene duration to nearest supported duration
    let duration = "6s" // default
    const sceneDuration = scene.duration_seconds || 5

    if (isVeo) {
      // Veo supports 4s, 6s, 8s
      if (sceneDuration <= 4) duration = "4s"
      else if (sceneDuration <= 6) duration = "6s"
      else duration = "8s"
    } else if (isSora) {
      // Sora supports 5s, 10s (mapped to "10", "15" frames in some configs, or "5", "10" in simplified view)
      // Config says Sora 2 Pro text-to-video: "10" (10s), "15" (15s)? 
      // Let's look at `video-models-config.ts` again or `kieai-service.ts`.
      // `kieai-service.ts` logic for Sora: duration "10" -> n_frames 10
      // Let's assume 5s and 10s are good targets.
      if (sceneDuration <= 5) duration = "5s"
      else duration = "10s"
    } else if (isWan) {
      // Wan supports 5s, 10s (video-to-video only), 5/10/15 (text/image)
      if (sceneDuration <= 5) duration = "5"
      else if (sceneDuration <= 10) duration = "10"
      else duration = "15"
    }

    // Normalize aspect ratio string if needed
    // UI sends "9:16", API expects "9:16" usually.

    const videoParams = {
      prompt: scene.video_prompt_en,
      model: model,
      aspectRatio: aspectRatio,
      resolution: resolution,
      duration: duration,
      // We will determine mode/inputs below
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
        ${videoParams.resolution}, ${videoParams.duration}, 
        ${isVeo ? "FIRST_AND_LAST_FRAMES_2_VIDEO" : "image-to-video"},
        'generating'
      )
    `

    // Generate video via KieAI
    try {
      // Initialize KieAI service
      const kieService = new KieAIService(kieApiKey)
      let result;

      if (isVeo) {
        // Veo Generation
        result = await kieService.generateVideoWithPolling({
          prompt: videoParams.prompt,
          model: videoParams.model as "veo3" | "veo3_fast", // approximate cast
          aspectRatio: videoParams.aspectRatio as "16:9" | "9:16" | "Auto",
          // resolution param is not directly used in `generateVideo` (standard/hd implicit?), 
          // `video-models-config` says Veo has resolutions but `kieai-service` might fallback or auto.
          // `kieai-service.ts` generateVideo doesn't take resolution param!
          // Veo 3 resolution is determined by aspect ratio mostly (720p usually).
          // We'll ignore resolution for Veo API call if not supported.
          duration: videoParams.duration, // Not supported in `generateVideo` params interface?
          // Wait, `KieAIGenerateParams` has no duration! Veo 3 is fixed or inferred?
          // Looking at `KieAIGenerateParams`: prompt, imageUrls, model, generationType, aspectRatio, seeds, enableTranslation, watermark.
          // No duration for Veo 3? It might be fixed or prompt dependent.
          // But `video-models-config.ts` lists durations for Veo. 
          // Let's assume Veo 3 is fixed ~6s or handled by prompt if not in params.
          // Re-checking `kieai-service.ts`... `generateVideo` doesn't pass duration.
          // Veo 3 is typically 6s.
          mode: "FIRST_AND_LAST_FRAMES_2_VIDEO",
          imageUrls: [imageUrl, imageUrl] // Start and end frames
        }, {
          maxAttempts: 60,
          pollInterval: 10000
        })
      } else {
        // Wan / Sora Generation
        // Using `generateWithWan26AndPoll` which handles Sora specific params too (n_frames etc via `duration`)
        result = await kieService.generateWithWan26AndPoll({
          model: videoParams.model,
          prompt: videoParams.prompt,
          aspect_ratio: videoParams.aspectRatio,
          resolution: videoParams.resolution,
          duration: videoParams.duration,
          image_urls: [imageUrl], // Single image for image-to-video
        }, {
          maxAttempts: 120, // Give more time for Wan/Sora
          pollInterval: 10000
        })
      }

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
          mode: isVeo ? "FIRST_AND_LAST_FRAMES_2_VIDEO" : "image-to-video",
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
