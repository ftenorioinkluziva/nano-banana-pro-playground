import { NextRequest, NextResponse } from "next/server"
import { KieAIService, mapModeToKieAIGenerationType, mapModelToKieAI } from "@/lib/kieai-service"

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

    // Parse form data
    const formData = await request.formData()
    const prompt = formData.get("prompt") as string
    const mode = formData.get("mode") as string
    const resolution = formData.get("resolution") as string || "720p"
    const aspectRatio = formData.get("aspectRatio") as string || "16:9"
    const duration = (formData.get("duration") as string) || "6s"
    const modelId = (formData.get("model") as string) || "veo3_fast"

    // Validations
    if (!mode) {
      return NextResponse.json<ErrorResponse>(
        { error: "Mode is required" },
        { status: 400 }
      )
    }

    if (!prompt?.trim()) {
      return NextResponse.json<ErrorResponse>(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json<ErrorResponse>(
        { error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.` },
        { status: 400 }
      )
    }

    console.log("Submitting video generation request to KIE.AI...")
    console.log("Prompt:", prompt)
    console.log("Mode:", mode)
    console.log("Model:", modelId)
    console.log("Aspect Ratio:", aspectRatio)

    // Handle image uploads if present
    const imageUrls: string[] = []

    // For "Frames to Video" mode
    if (mode === "Frames to Video") {
      const startFrame = formData.get("startFrame") as File | null
      const endFrame = formData.get("endFrame") as File | null

      if (startFrame) {
        console.log("Uploading start frame...")
        const base64Data = await fileToBase64(startFrame)
        const uploadedUrl = await uploadBase64Image(base64Data, kieApiKey)
        imageUrls.push(uploadedUrl)
        console.log("Start frame uploaded:", uploadedUrl)
      }

      if (endFrame) {
        console.log("Uploading end frame...")
        const base64Data = await fileToBase64(endFrame)
        const uploadedUrl = await uploadBase64Image(base64Data, kieApiKey)
        imageUrls.push(uploadedUrl)
        console.log("End frame uploaded:", uploadedUrl)
      }
    }

    // For "References to Video" mode
    if (mode === "References to Video") {
      // Get all reference images
      let refIndex = 0
      while (formData.has(`referenceImage${refIndex}`)) {
        const refImage = formData.get(`referenceImage${refIndex}`) as File | null
        if (refImage) {
          console.log(`Uploading reference image ${refIndex}...`)
          const base64Data = await fileToBase64(refImage)
          const uploadedUrl = await uploadBase64Image(base64Data, kieApiKey)
          imageUrls.push(uploadedUrl)
          console.log(`Reference image ${refIndex} uploaded:`, uploadedUrl)
        }
        refIndex++
      }

      // Get style image if provided
      const styleImage = formData.get("styleImage") as File | null
      if (styleImage) {
        console.log("Uploading style image...")
        const base64Data = await fileToBase64(styleImage)
        const uploadedUrl = await uploadBase64Image(base64Data, kieApiKey)
        imageUrls.push(uploadedUrl)
        console.log("Style image uploaded:", uploadedUrl)
      }
    }

    console.log("Total images uploaded:", imageUrls.length)

    // Initialize KIE.AI service
    const kieService = new KieAIService(kieApiKey)

    let result: { videoUrl: string; taskId: string }

    // Handle "Extend Video" mode differently
    if (mode === "Extend Video") {
      const originalTaskId = formData.get("originalTaskId") as string

      if (!originalTaskId) {
        return NextResponse.json<ErrorResponse>(
          { error: "Original task ID is required for Extend Video mode" },
          { status: 400 }
        )
      }

      console.log("Extending video with taskId:", originalTaskId)

      // Extend video and poll for completion
      result = await kieService.extendVideoWithPolling({
        taskId: originalTaskId,
        prompt,
      })
    } else {
      // Regular video generation
      const generationType = mapModeToKieAIGenerationType(mode)
      const kieModel = mapModelToKieAI(modelId)

      // Generate video and poll for completion
      result = await kieService.generateVideoWithPolling({
        prompt,
        generationType,
        aspectRatio: aspectRatio as "16:9" | "9:16" | "Auto",
        model: kieModel,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      })
    }

    // Download video and convert to base64
    const videoDataUrl = await kieService.downloadVideoAsBase64(result.videoUrl)

    // Return the complete video with all metadata
    return NextResponse.json<GenerateVideoResponse>({
      videoUrl: videoDataUrl,
      videoUri: result.videoUrl,
      taskId: result.taskId,
      prompt: prompt,
      resolution: resolution,
      aspectRatio: aspectRatio,
      duration: parseInt(duration.replace("s", "")),
      model: modelId,
      mode: mode,
    })

  } catch (error) {
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
