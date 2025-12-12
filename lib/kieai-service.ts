/**
 * KIE.AI Veo 3 Video Generation Service
 * Documentation: https://docs.kie.ai/veo3-api/generate-veo-3-video
 */

interface KieAIGenerateParams {
  prompt: string
  imageUrls?: string[] // 1-2 image URLs for image-to-video
  model?: "veo3" | "veo3_fast"
  generationType?: "TEXT_2_VIDEO" | "FIRST_AND_LAST_FRAMES_2_VIDEO" | "REFERENCE_2_VIDEO"
  aspectRatio?: "16:9" | "9:16" | "Auto"
  seeds?: number // 10000-99999
  enableTranslation?: boolean
  watermark?: string
}

interface KieAIGenerateResponse {
  code: number
  msg: string
  data: {
    taskId: string
  }
}

interface KieAIStatusResponse {
  code: number
  msg: string
  data: {
    taskId: string
    status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED"
    resultUrls?: string[]
    errorMessage?: string
  }
}

export class KieAIService {
  private apiKey: string
  private baseUrl = "https://api.kie.ai/api/v1"

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("KIE.AI API key is required")
    }
    this.apiKey = apiKey
  }

  /**
   * Upload image to get a URL for kie.ai
   * Since kie.ai needs URLs, we need to convert base64 to a hosted URL
   * For now, we'll skip image modes if using kie.ai fallback
   */
  private async uploadImage(base64Image: string, mimeType: string): Promise<string | null> {
    // TODO: Implement image hosting or use a service like imgur, cloudinary, etc.
    // For now, return null to indicate image upload is not supported
    console.warn("Image upload not implemented for kie.ai - skipping image modes")
    return null
  }

  /**
   * Generate video using KIE.AI API
   */
  async generateVideo(params: KieAIGenerateParams): Promise<string> {
    const response = await fetch(`${this.baseUrl}/veo/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt: params.prompt,
        model: params.model || "veo3_fast",
        generationType: params.generationType || "TEXT_2_VIDEO",
        aspectRatio: params.aspectRatio || "16:9",
        enableTranslation: params.enableTranslation !== false,
        ...(params.imageUrls && { imageUrls: params.imageUrls }),
        ...(params.seeds && { seeds: params.seeds }),
        ...(params.watermark && { watermark: params.watermark }),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`KIE.AI API error: ${response.status} - ${errorText}`)
    }

    const result: KieAIGenerateResponse = await response.json()

    if (result.code !== 200) {
      throw new Error(`KIE.AI generation failed: ${result.msg}`)
    }

    return result.data.taskId
  }

  /**
   * Check video generation status
   */
  async checkStatus(taskId: string): Promise<KieAIStatusResponse["data"]> {
    const response = await fetch(`${this.baseUrl}/veo/task/${taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`KIE.AI status check error: ${response.status} - ${errorText}`)
    }

    const result: KieAIStatusResponse = await response.json()

    if (result.code !== 200) {
      throw new Error(`KIE.AI status check failed: ${result.msg}`)
    }

    return result.data
  }

  /**
   * Generate video and poll until complete
   * This mirrors the veo-studio pattern
   */
  async generateVideoWithPolling(
    params: KieAIGenerateParams,
    options: {
      maxAttempts?: number
      pollingInterval?: number
      onProgress?: (attempt: number, maxAttempts: number) => void
    } = {}
  ): Promise<{ videoUrl: string; taskId: string }> {
    const maxAttempts = options.maxAttempts || 60 // 10 minutes with 10s intervals
    const pollingInterval = options.pollingInterval || 10000 // 10 seconds

    console.log("Starting KIE.AI video generation...")
    const taskId = await this.generateVideo(params)
    console.log("KIE.AI task created:", taskId)

    let attempts = 0
    while (attempts < maxAttempts) {
      attempts++
      console.log(`KIE.AI polling... (attempt ${attempts}/${maxAttempts})`)

      if (options.onProgress) {
        options.onProgress(attempts, maxAttempts)
      }

      await new Promise((resolve) => setTimeout(resolve, pollingInterval))

      const status = await this.checkStatus(taskId)

      if (status.status === "SUCCESS") {
        if (!status.resultUrls || status.resultUrls.length === 0) {
          throw new Error("KIE.AI generation succeeded but no video URL returned")
        }

        console.log("KIE.AI video generation complete:", status.resultUrls[0])
        return {
          videoUrl: status.resultUrls[0],
          taskId: taskId,
        }
      }

      if (status.status === "FAILED") {
        throw new Error(`KIE.AI generation failed: ${status.errorMessage || "Unknown error"}`)
      }

      // Status is PENDING or PROCESSING, continue polling
    }

    throw new Error("KIE.AI video generation timeout")
  }

  /**
   * Download video from KIE.AI URL and convert to base64
   */
  async downloadVideoAsBase64(videoUrl: string): Promise<string> {
    console.log("Downloading video from KIE.AI:", videoUrl)

    const response = await fetch(videoUrl)

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`)
    }

    const videoBlob = await response.blob()
    console.log("Video downloaded, size:", videoBlob.size, "bytes")

    // Convert to base64
    const arrayBuffer = await videoBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Video = buffer.toString("base64")
    const videoDataUrl = `data:${videoBlob.type || "video/mp4"};base64,${base64Video}`

    return videoDataUrl
  }
}

/**
 * Map our mode names to KIE.AI generation types
 */
export function mapModeToKieAIGenerationType(
  mode: string
): "TEXT_2_VIDEO" | "FIRST_AND_LAST_FRAMES_2_VIDEO" | "REFERENCE_2_VIDEO" {
  switch (mode) {
    case "Text to Video":
      return "TEXT_2_VIDEO"
    case "Frames to Video":
      return "FIRST_AND_LAST_FRAMES_2_VIDEO"
    case "References to Video":
      return "REFERENCE_2_VIDEO"
    default:
      return "TEXT_2_VIDEO"
  }
}

/**
 * Map our model names to KIE.AI models
 */
export function mapModelToKieAI(model: string): "veo3" | "veo3_fast" {
  if (model.includes("fast")) {
    return "veo3_fast"
  }
  return "veo3"
}
