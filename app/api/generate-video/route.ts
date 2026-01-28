import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { KieAIService, mapModeToKieAIGenerationType, mapModelToKieAI } from "@/lib/kieai-service"
import { getGenerationTypeConfig } from "@/lib/video-models-config"
import type { VideoModelId, GenerationTypeId } from "@/types/video"
import { checkCredits, deductCredits } from "@/lib/credits"

export const dynamic = "force-dynamic"

export const maxDuration = 600 // 10 minutes timeout for long video generations

const MAX_PROMPT_LENGTH = 2000
const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB
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

interface GenerateVideoResponse {
  videoUrl: string
  videoUri: string
  taskId: string
  prompt: string
  resolution: string
  aspectRatio: string
  duration: number
  model: string
  mode: string
}

interface ErrorResponse {
  error: string
  message?: string
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
 * Convert file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString("base64")
  return `data:${file.type};base64,${base64}`
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    // Require authentication
    const { user } = await requireAuth()

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

    // Parse form data first to determine model and cost
    const formData = await request.formData()

    // New parametrized fields
    const modelId = formData.get("modelId") as VideoModelId | null
    const generationTypeId = formData.get("generationTypeId") as GenerationTypeId | null

    // Legacy fields
    const legacyMode = formData.get("mode") as string
    const legacyModel = formData.get("model") as string

    // Core parameters
    const prompt = formData.get("prompt") as string
    const resolution = (formData.get("resolution") as string) || "720p"
    const aspectRatio = formData.get("aspectRatio") as string
    const duration = formData.get("duration") as string

    // Determine the model to calculate cost
    const selectedModel = modelId || legacyModel

    // Import cost calculator
    const { getVideoCost } = await import("@/lib/usage-costs")

    // Normalize generation type for cost calculation
    let costGenType = generationTypeId
    if (!costGenType && legacyMode) {
      // Simple normalization for legacy strings "Text to Video" -> "text-to-video"
      costGenType = legacyMode.toLowerCase().replace(/\s+/g, '-') as any
    }

    const VIDEO_COST = await getVideoCost(selectedModel || undefined, {
      type: costGenType || undefined,
      resolution: resolution, // e.g. "720p", "1080p", "4k" - must match config keys if specific price exists
      duration: duration
    })

    // Check credits
    const { checkCredits } = await import("@/lib/credits")
    const { db } = await import("@/db")
    const { user: userTable, generations } = await import("@/db/schema")
    const { eq } = await import("drizzle-orm")

    const userRecord = await db.query.user.findFirst({
      where: eq(userTable.id, user.id),
      columns: { credits: true },
    })

    const currentCredits = userRecord?.credits || 0

    if (currentCredits < VIDEO_COST) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Insufficient credits",
          details: `You have ${currentCredits} credits, but this generation costs ${VIDEO_COST} credits.`
        },
        { status: 402 }
      )
    }

    // Determine if using new parametrized approach or legacy
    const isParametrized = Boolean(modelId && generationTypeId)

    console.log("Request type:", isParametrized ? "Parametrized" : "Legacy")
    console.log("Model ID:", selectedModel)
    console.log("Generation Type ID:", generationTypeId || legacyMode)
    console.log("Prompt:", prompt)
    console.log("Resolution:", resolution)
    console.log("Duration:", duration)

    // Initialize KIE.AI service
    const kieService = new KieAIService(kieApiKey)

    let result: { videoUrl: string; taskId: string }
    let effectiveMode = isParametrized ? generationTypeId! : legacyMode

    // Process images from form data (for new parametrized approach)
    const uploadedImageUrls: string[] = []
    const uploadedVideoUrls: string[] = []

    if (isParametrized) {
      // Get generation type config to know what files to expect
      const genTypeConfig = getGenerationTypeConfig(modelId!, generationTypeId!)

      // Handle images (if required by generation type)
      if (genTypeConfig?.inputs.images) {
        let imgIndex = 0
        while (formData.has(`image${imgIndex}`)) {
          const imgFile = formData.get(`image${imgIndex}`) as File | null
          if (imgFile) {
            console.log(`Uploading image ${imgIndex}...`)
            const base64Data = await fileToBase64(imgFile)
            const uploadedUrl = await uploadBase64Image(base64Data, kieApiKey)
            uploadedImageUrls.push(uploadedUrl)
            console.log(`Image ${imgIndex} uploaded:`, uploadedUrl)
          }
          imgIndex++
        }
      }

      // Handle videos (if required by generation type)
      if (genTypeConfig?.inputs.videos) {
        let vidIndex = 0
        while (formData.has(`video${vidIndex}`)) {
          const vidFile = formData.get(`video${vidIndex}`) as File | null
          if (vidFile) {
            console.log(`Uploading video ${vidIndex}...`)
            const base64Data = await fileToBase64(vidFile)
            const uploadedUrl = await uploadBase64Image(base64Data, kieApiKey)
            uploadedVideoUrls.push(uploadedUrl)
            console.log(`Video ${vidIndex} uploaded:`, uploadedUrl)
          }
          vidIndex++
        }
      }
    } else {
      // Legacy image upload logic
      if (legacyMode === "Frames to Video") {
        const startFrame = formData.get("startFrame") as File | null
        const endFrame = formData.get("endFrame") as File | null

        if (startFrame) {
          const base64Data = await fileToBase64(startFrame)
          const uploadedUrl = await uploadBase64Image(base64Data, kieApiKey)
          uploadedImageUrls.push(uploadedUrl)
        }

        if (endFrame) {
          const base64Data = await fileToBase64(endFrame)
          const uploadedUrl = await uploadBase64Image(base64Data, kieApiKey)
          uploadedImageUrls.push(uploadedUrl)
        }
      }

      if (legacyMode === "References to Video") {
        let refIndex = 0
        while (formData.has(`referenceImage${refIndex}`)) {
          const refImage = formData.get(`referenceImage${refIndex}`) as File | null
          if (refImage) {
            const base64Data = await fileToBase64(refImage)
            const uploadedUrl = await uploadBase64Image(base64Data, kieApiKey)
            uploadedImageUrls.push(uploadedUrl)
          }
          refIndex++
        }

        const styleImage = formData.get("styleImage") as File | null
        if (styleImage) {
          const base64Data = await fileToBase64(styleImage)
          const uploadedUrl = await uploadBase64Image(base64Data, kieApiKey)
          uploadedImageUrls.push(uploadedUrl)
        }
      }
    }

    console.log("Total images uploaded:", uploadedImageUrls.length)
    console.log("Total videos uploaded:", uploadedVideoUrls.length)

    // Route to appropriate generation method based on model
    if (isParametrized && (modelId === "wan-2-6" || modelId === "sora-2-pro")) {
      // Use Wan 2.6 / Sora 2 Pro API (same endpoint structure)
      const genTypeConfig = getGenerationTypeConfig(modelId, generationTypeId!)
      if (!genTypeConfig) {
        throw new Error(`Invalid generation type: ${generationTypeId}`)
      }

      const modelForWan = genTypeConfig.apiModel
      const uploadedVideoUrl = uploadedVideoUrls.length > 0 ? uploadedVideoUrls[0] : undefined

      result = await kieService.generateWithWan26AndPoll(
        {
          model: modelForWan,
          prompt: prompt,
          negative_prompt: (formData.get("negativePrompt") as string) || undefined,
          aspect_ratio: aspectRatio || "16:9",
          duration: duration || "5",
          resolution: resolution || "720p",
          image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
          video_urls: uploadedVideoUrl ? [uploadedVideoUrl] : undefined,
        },
        {
          onProgress: (attempt, max) => {
            console.log(`Wan 2.6 polling ${attempt}/${max}`)
          }
        }
      )
    } else if (isParametrized && (modelId === "veo" || modelId === "veo-fast")) {
      // Use Veo API (new parametrized approach)
      const genTypeConfig = getGenerationTypeConfig(modelId, generationTypeId!)
      if (!genTypeConfig) {
        throw new Error(`Invalid generation type: ${generationTypeId}`)
      }

      const generationType = generationTypeId === "text-to-video" ? "TEXT_2_VIDEO" :
        generationTypeId === "frames-to-video" ? "FIRST_AND_LAST_FRAMES_2_VIDEO" :
          generationTypeId === "references-to-video" ? "REFERENCE_2_VIDEO" : "TEXT_2_VIDEO"

      result = await kieService.generateVideoWithPolling({
        prompt,
        generationType,
        aspectRatio: aspectRatio as "16:9" | "9:16" | "Auto",
        model: genTypeConfig.apiModel as "veo3" | "veo3_fast",
        imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      })
    } else if (legacyMode === "Extend Video") {
      // Legacy Extend Video mode
      const originalTaskId = formData.get("originalTaskId") as string

      if (!originalTaskId) {
        return NextResponse.json<ErrorResponse>(
          { error: "Original task ID is required for Extend Video mode" },
          { status: 400 }
        )
      }

      result = await kieService.extendVideoWithPolling({
        taskId: originalTaskId,
        prompt,
      })
    } else {
      // Legacy Veo generation
      const generationType = mapModeToKieAIGenerationType(legacyMode)
      const kieModel = mapModelToKieAI(legacyModel)

      result = await kieService.generateVideoWithPolling({
        prompt,
        generationType,
        aspectRatio: aspectRatio as "16:9" | "9:16" | "Auto",
        model: kieModel,
        imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      })
    }

    // Download video and convert to base64
    const videoDataUrl = await kieService.downloadVideoAsBase64(result.videoUrl)

    // Return the complete video with all metadata
    const response = NextResponse.json<GenerateVideoResponse>({
      videoUrl: videoDataUrl,
      videoUri: result.videoUrl,
      taskId: result.taskId,
      prompt: prompt,
      resolution: resolution,
      aspectRatio: aspectRatio || "16:9",
      duration: parseInt(duration?.replace("s", "") || "6"),
      model: isParametrized ? modelId! : legacyModel,
      mode: effectiveMode,
    })

    // Deduct credits
    await deductCredits(user.id, VIDEO_COST, `Video Generation: ${isParametrized ? modelId : legacyModel}`)

    // Save to history
    try {
      let dbMode = "Text to Video"
      if (effectiveMode === "text-to-video") dbMode = "Text to Video"
      else if (effectiveMode === "frames-to-video") dbMode = "Frames to Video"
      else if (effectiveMode === "references-to-video") dbMode = "References to Video"
      else if (effectiveMode === "extend-video") dbMode = "Extend Video"
      else if (["Text to Video", "Frames to Video", "References to Video", "Extend Video"].includes(effectiveMode)) {
        dbMode = effectiveMode
      }

      // Map duration to allowed enum values (4s, 6s, 8s) or default to 6s
      let dbDuration = "6s"
      const durVal = duration?.replace("s", "")
      if (durVal === "4") dbDuration = "4s"
      else if (durVal === "8") dbDuration = "8s"
      else if (durVal === "5") dbDuration = "6s" // Map 5s (Wan) to 6s to satisfy Enum
      else if (durVal === "10") dbDuration = "8s" // Map long to 8s max enum

      await db.insert(generations).values({
        id: crypto.randomUUID(),
        userId: user.id,
        prompt: prompt || "",
        mode: dbMode as any,
        type: "VIDEO",
        status: "complete",
        videoUrl: result.videoUrl,
        resolution: (resolution as any) || "720p",
        aspectRatio: (aspectRatio as any) || "16:9",
        duration: dbDuration,
        model: isParametrized ? modelId : legacyModel,
        taskId: result.taskId,
        description: `Video Generation: ${isParametrized ? modelId : legacyModel}`,
        cost: VIDEO_COST,
      })
    } catch (historyError) {
      console.error("Failed to save video history:", historyError)
    }

    return response

  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error in generate-video route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to generate video",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
