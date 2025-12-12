import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI, Video } from "@google/genai"
import { KieAIService, mapModeToKieAIGenerationType, mapModelToKieAI } from "@/lib/kieai-service"

export const dynamic = "force-dynamic"
export const maxDuration = 600 // 10 minutes timeout for long video generations

const MAX_PROMPT_LENGTH = 2000

interface GenerateVideoResponse {
  videoUrl: string
  videoUri: string
  prompt: string
  resolution: string
  aspectRatio: string
  duration: number
  model: string
  mode: string
  provider?: "google" | "kieai" // Track which provider was used
}

interface ErrorResponse {
  error: string
  message?: string
  details?: string
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return buffer.toString("base64")
}

/**
 * Generate video using KIE.AI
 */
async function generateWithKieAI(
  prompt: string,
  mode: string,
  aspectRatio: string,
  model: string
): Promise<{ videoUrl: string; videoUri: string }> {
  const kieApiKey = process.env.KIEAI_API_KEY

  if (!kieApiKey) {
    throw new Error("KIE.AI API key not configured. Please add KIEAI_API_KEY to environment variables.")
  }

  console.log("Using KIE.AI provider...")
  const kieService = new KieAIService(kieApiKey)

  const generationType = mapModeToKieAIGenerationType(mode)
  const kieModel = mapModelToKieAI(model)

  // Generate and poll for completion
  const result = await kieService.generateVideoWithPolling({
    prompt,
    generationType,
    aspectRatio: aspectRatio as "16:9" | "9:16" | "Auto",
    model: kieModel,
  })

  // Download video and convert to base64
  const videoDataUrl = await kieService.downloadVideoAsBase64(result.videoUrl)

  return {
    videoUrl: videoDataUrl,
    videoUri: result.videoUrl, // Original KIE.AI URL
  }
}

/**
 * Generate video using Google Veo
 */
async function generateWithGoogle(
  formData: FormData,
  prompt: string,
  mode: string,
  resolution: string,
  aspectRatio: string,
  modelId: string,
  isLooping: boolean
): Promise<{ videoUrl: string; videoUri: string }> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    throw new Error("Google API key not configured")
  }

  console.log("Using Google Veo provider...")
  const ai = new GoogleGenAI({ apiKey })

  // Build the generation config
  const config: any = {
    numberOfVideos: 1,
    resolution: resolution,
  }

  // Only add aspect ratio if NOT extending a video
  if (mode !== "Extend Video") {
    config.aspectRatio = aspectRatio
  }

  const generateVideoPayload: any = {
    model: modelId,
    config: config,
  }

  // Only add prompt if it exists
  if (prompt && prompt.trim()) {
    generateVideoPayload.prompt = prompt
  }

  // Handle different generation modes
  if (mode === "Frames to Video") {
    const startFrame = formData.get("startFrame") as File
    if (!startFrame) {
      throw new Error("Start frame is required for Frames to Video mode")
    }

    const startFrameBase64 = await fileToBase64(startFrame)
    generateVideoPayload.image = {
      imageBytes: startFrameBase64,
      mimeType: startFrame.type,
    }

    const finalEndFrame = isLooping ? startFrame : (formData.get("endFrame") as File)
    if (finalEndFrame) {
      const endFrameBase64 = isLooping ? startFrameBase64 : await fileToBase64(finalEndFrame)
      config.lastFrame = {
        imageBytes: endFrameBase64,
        mimeType: finalEndFrame.type,
      }
    }
  } else if (mode === "References to Video") {
    const referenceImagesPayload: any[] = []

    // Get all reference images
    let refIndex = 0
    while (formData.has(`referenceImage${refIndex}`)) {
      const refImage = formData.get(`referenceImage${refIndex}`) as File
      if (refImage) {
        const base64 = await fileToBase64(refImage)
        referenceImagesPayload.push({
          image: {
            imageBytes: base64,
            mimeType: refImage.type,
          },
          referenceType: "ASSET",
        })
      }
      refIndex++
    }

    // Get style image if provided
    const styleImage = formData.get("styleImage") as File
    if (styleImage) {
      const base64 = await fileToBase64(styleImage)
      referenceImagesPayload.push({
        image: {
          imageBytes: base64,
          mimeType: styleImage.type,
        },
        referenceType: "STYLE",
      })
    }

    if (referenceImagesPayload.length === 0) {
      throw new Error("At least one reference image is required for References to Video mode")
    }

    config.referenceImages = referenceImagesPayload
  } else if (mode === "Extend Video") {
    throw new Error("Extend Video mode not yet implemented")
  }

  console.log("Calling Google Veo API...")

  // Call the video generation API and start polling
  let operation = await ai.models.generateVideos(generateVideoPayload)
  console.log("Video generation operation started:", operation.name)

  if (!operation || !operation.name) {
    throw new Error("Failed to start video generation")
  }

  // POLLING LOOP
  console.log("Starting polling loop...")
  let pollCount = 0
  const maxPolls = 60 // 10 minutes maximum (60 * 10s = 600s)

  while (!operation.done) {
    pollCount++
    if (pollCount > maxPolls) {
      throw new Error("Video generation timeout - took longer than 10 minutes")
    }

    console.log(`Polling... (attempt ${pollCount}/${maxPolls})`)
    await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds
    operation = await ai.operations.getVideosOperation({ operation: operation })
  }

  console.log("Video generation complete!")

  // Extract video URL from response
  if (!operation.response) {
    throw new Error("Operation completed but no response received")
  }

  const videos = operation.response.generatedVideos
  if (!videos || videos.length === 0) {
    throw new Error("Operation completed but no videos in response")
  }

  const firstVideo = videos[0]
  if (!firstVideo?.video?.uri) {
    throw new Error("Generated video is missing URI")
  }

  const videoUri = decodeURIComponent(firstVideo.video.uri)
  console.log("Video URI:", videoUri)

  // Fetch the actual video file
  console.log("Fetching video from URI...")
  const videoResponse = await fetch(`${videoUri}&key=${apiKey}`)

  if (!videoResponse.ok) {
    throw new Error(`Failed to fetch video: HTTP ${videoResponse.status}: ${videoResponse.statusText}`)
  }

  const videoBlob = await videoResponse.blob()
  console.log("Video fetched successfully, size:", videoBlob.size, "bytes")

  // Convert blob to base64 for response
  const arrayBuffer = await videoBlob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64Video = buffer.toString("base64")
  const videoDataUrl = `data:${videoBlob.type};base64,${base64Video}`

  return {
    videoUrl: videoDataUrl,
    videoUri: videoUri,
  }
}

export async function POST(request: NextRequest) {
  try {
    const videoProvider = process.env.VIDEO_PROVIDER || "auto" // "google", "kieai", or "auto"

    // Parse form data
    const formData = await request.formData()
    const prompt = formData.get("prompt") as string
    const mode = formData.get("mode") as string
    const resolution = formData.get("resolution") as string || "720p"
    const aspectRatio = formData.get("aspectRatio") as string || "16:9"
    const duration = (formData.get("duration") as string) || "6s"
    const modelId = (formData.get("model") as string) || "veo-3.1-fast-generate-preview"
    const isLooping = formData.get("isLooping") === "true"

    // Validations
    if (!mode) {
      return NextResponse.json<ErrorResponse>(
        { error: "Mode is required" },
        { status: 400 }
      )
    }

    if (mode === "Text to Video" && !prompt?.trim()) {
      return NextResponse.json<ErrorResponse>(
        { error: "Prompt is required for Text to Video mode" },
        { status: 400 }
      )
    }

    if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json<ErrorResponse>(
        { error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.` },
        { status: 400 }
      )
    }

    const validDurations = ["4s", "6s", "8s"]
    if (!validDurations.includes(duration)) {
      return NextResponse.json<ErrorResponse>(
        { error: `Invalid duration. Must be one of: ${validDurations.join(", ")}` },
        { status: 400 }
      )
    }

    if (resolution === "1080p" && duration !== "8s") {
      return NextResponse.json<ErrorResponse>(
        { error: "1080p resolution only supports 8 seconds duration" },
        { status: 400 }
      )
    }

    console.log("Submitting video generation request...")
    console.log("Prompt:", prompt)
    console.log("Mode:", mode)
    console.log("Provider preference:", videoProvider)

    let videoUrl: string
    let videoUri: string
    let usedProvider: "google" | "kieai"

    // Try Google first if auto or google
    if (videoProvider === "auto" || videoProvider === "google") {
      try {
        const result = await generateWithGoogle(formData, prompt, mode, resolution, aspectRatio, modelId, isLooping)
        videoUrl = result.videoUrl
        videoUri = result.videoUri
        usedProvider = "google"
      } catch (googleError: any) {
        console.error("Google Veo error:", googleError)

        // Check if it's a quota error (429)
        const isQuotaError =
          googleError.message?.includes("429") ||
          googleError.message?.includes("quota") ||
          googleError.message?.includes("RESOURCE_EXHAUSTED")

        // If quota error and provider is auto, fallback to KIE.AI
        if (isQuotaError && videoProvider === "auto") {
          console.log("Google quota exceeded, falling back to KIE.AI...")

          // Only TEXT_TO_VIDEO is supported for KIE.AI fallback (no image modes yet)
          if (mode !== "Text to Video") {
            return NextResponse.json<ErrorResponse>(
              {
                error: "Google quota exceeded",
                details: `Image-based modes are not supported in KIE.AI fallback. Please try again later or use Text to Video mode.`,
              },
              { status: 429 }
            )
          }

          try {
            const kieResult = await generateWithKieAI(prompt, mode, aspectRatio, modelId)
            videoUrl = kieResult.videoUrl
            videoUri = kieResult.videoUri
            usedProvider = "kieai"
          } catch (kieError: any) {
            console.error("KIE.AI fallback also failed:", kieError)
            return NextResponse.json<ErrorResponse>(
              {
                error: "Both video providers failed",
                details: `Google: ${googleError.message}. KIE.AI: ${kieError.message}`,
              },
              { status: 500 }
            )
          }
        } else {
          // Not a quota error or provider is specifically "google", throw error
          throw googleError
        }
      }
    } else if (videoProvider === "kieai") {
      // Use KIE.AI directly
      if (mode !== "Text to Video") {
        return NextResponse.json<ErrorResponse>(
          {
            error: "KIE.AI only supports Text to Video mode",
            details: "Image-based modes (Frames to Video, References to Video) are not yet supported with KIE.AI provider.",
          },
          { status: 400 }
        )
      }

      const result = await generateWithKieAI(prompt, mode, aspectRatio, modelId)
      videoUrl = result.videoUrl
      videoUri = result.videoUri
      usedProvider = "kieai"
    } else {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Invalid VIDEO_PROVIDER",
          details: 'Must be "google", "kieai", or "auto"',
        },
        { status: 500 }
      )
    }

    // Return the complete video with all metadata
    return NextResponse.json<GenerateVideoResponse>({
      videoUrl: videoUrl!,
      videoUri: videoUri!,
      prompt: prompt || "",
      resolution: resolution,
      aspectRatio: aspectRatio,
      duration: parseInt(duration.replace("s", "")),
      model: modelId,
      mode: mode,
      provider: usedProvider!,
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
