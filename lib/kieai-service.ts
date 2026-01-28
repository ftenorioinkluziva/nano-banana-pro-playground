/**
 * KIE.AI Veo 3 Video Generation Service
 * Documentation: https://docs.kie.ai/veo3-api/generate-veo-3-video
 */

import { fetchWithRetry } from "./fetch-with-retry"

export interface KieAIGenerateParams {
  prompt: string
  imageUrls?: string[] // 1-2 image URLs for image-to-video
  model?: "veo3" | "veo3_fast"
  generationType?: "TEXT_2_VIDEO" | "FIRST_AND_LAST_FRAMES_2_VIDEO" | "REFERENCE_2_VIDEO"
  aspectRatio?: "16:9" | "9:16" | "Auto"
  seeds?: number // 10000-99999
  enableTranslation?: boolean
  watermark?: string
}

export interface KieAIExtendParams {
  taskId: string // Original video generation task ID
  prompt: string
  seeds?: number // 10000-99999
  watermark?: string
  callBackUrl?: string
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
    paramJson: string
    completeTime: string | null
    response: {
      taskId: string
      resultUrls: string[]
      originUrls: string[]
      resolution: string
    } | null
    successFlag: 0 | 1 | 2 | 3 // 0: Processing, 1: Success, 2: Failed, 3: Created but failed
    errorCode: string | null
    errorMessage: string
    createTime: string
    fallbackFlag: boolean
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
    const response = await fetchWithRetry(`${this.baseUrl}/veo/generate`, {
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
   * Extend video using KIE.AI API
   */
  async extendVideo(params: KieAIExtendParams): Promise<string> {
    const response = await fetchWithRetry(`${this.baseUrl}/veo/extend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        taskId: params.taskId,
        prompt: params.prompt,
        ...(params.seeds && { seeds: params.seeds }),
        ...(params.watermark && { watermark: params.watermark }),
        ...(params.callBackUrl && { callBackUrl: params.callBackUrl }),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`KIE.AI extend video error: ${response.status} - ${errorText}`)
    }

    const result: KieAIGenerateResponse = await response.json()

    if (result.code !== 200) {
      throw new Error(`KIE.AI extend video failed: ${result.msg}`)
    }

    return result.data.taskId
  }

  /**
   * Check video generation status
   */
  async checkStatus(taskId: string): Promise<KieAIStatusResponse["data"]> {
    const response = await fetchWithRetry(`${this.baseUrl}/veo/record-info?taskId=${taskId}`, {
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

      // successFlag: 0 = Processing, 1 = Success, 2 = Failed, 3 = Created but failed
      if (status.successFlag === 1) {
        if (!status.response || !status.response.resultUrls || status.response.resultUrls.length === 0) {
          throw new Error("KIE.AI generation succeeded but no video URL returned")
        }

        console.log("KIE.AI video generation complete:", status.response.resultUrls[0])
        return {
          videoUrl: status.response.resultUrls[0],
          taskId: taskId,
        }
      }

      if (status.successFlag === 2 || status.successFlag === 3) {
        throw new Error(`KIE.AI generation failed: ${status.errorMessage || "Unknown error"}`)
      }

      // successFlag is 0, continue polling
    }

    throw new Error("KIE.AI video generation timeout")
  }

  /**
   * Extend video and poll until complete
   */
  async extendVideoWithPolling(
    params: KieAIExtendParams,
    options: {
      maxAttempts?: number
      pollingInterval?: number
      onProgress?: (attempt: number, maxAttempts: number) => void
    } = {}
  ): Promise<{ videoUrl: string; taskId: string }> {
    const maxAttempts = options.maxAttempts || 60 // 10 minutes with 10s intervals
    const pollingInterval = options.pollingInterval || 10000 // 10 seconds

    console.log("Starting KIE.AI video extension...")
    const taskId = await this.extendVideo(params)
    console.log("KIE.AI extend task created:", taskId)

    let attempts = 0
    while (attempts < maxAttempts) {
      attempts++
      console.log(`KIE.AI polling extend task... (attempt ${attempts}/${maxAttempts})`)

      if (options.onProgress) {
        options.onProgress(attempts, maxAttempts)
      }

      await new Promise((resolve) => setTimeout(resolve, pollingInterval))

      const status = await this.checkStatus(taskId)

      // successFlag: 0 = Processing, 1 = Success, 2 = Failed, 3 = Created but failed
      if (status.successFlag === 1) {
        if (!status.response || !status.response.resultUrls || status.response.resultUrls.length === 0) {
          throw new Error("KIE.AI video extension succeeded but no video URL returned")
        }

        console.log("KIE.AI video extension complete:", status.response.resultUrls[0])
        return {
          videoUrl: status.response.resultUrls[0],
          taskId: taskId,
        }
      }

      if (status.successFlag === 2 || status.successFlag === 3) {
        throw new Error(`KIE.AI video extension failed: ${status.errorMessage || "Unknown error"}`)
      }

      // successFlag is 0, continue polling
    }

    throw new Error("KIE.AI video extension timeout")
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

  // ============================================
  // Wan 2.6 Model Methods
  // ============================================

  /**
   * Generate video using Wan 2.6 models via KIE.AI API
   * Supports: wan/2-6-text-to-video, wan/2-6-image-to-video, wan/2-6-video-to-video
   */
  async generateWithWan26(params: {
    model: string // "wan/2-6-text-to-video" | "wan/2-6-image-to-video" | "wan/2-6-video-to-video"
    prompt: string
    negative_prompt?: string
    aspect_ratio?: string
    duration?: string // "5", "10", "15" (text/image-to-video) or "5", "10" (video-to-video)
    resolution?: string // "720p" | "1080p"
    image_urls?: string[] // For image-to-video
    video_urls?: string[] // For video-to-video
    callBackUrl?: string
    seed?: number
    use_audio?: boolean // Default true
    storyboard?: { prompt: string; duration?: string; img_url?: string }[]
  }): Promise<string> {
    const input: Record<string, any> = {
      prompt: params.prompt,
      use_audio: params.use_audio !== false // Default to true if not specified
    }

    if (params.negative_prompt) {
      input.negative_prompt = params.negative_prompt
    }

    if (params.aspect_ratio) {
      input.aspect_ratio = params.aspect_ratio
    }

    if (params.seed) {
      input.seed = params.seed
    }

    // Add image_urls or video_urls based on model
    if (params.image_urls && params.image_urls.length > 0) {
      input.image_urls = params.image_urls
    }
    if (params.video_urls && params.video_urls.length > 0) {
      input.video_urls = params.video_urls
    }

    // Add storyboard if present
    if (params.storyboard) {
      input.storyboard = params.storyboard
    }

    const requestBody: Record<string, any> = {
      model: params.model,
      input,
    }

    // Customize parameters based on model family
    if (params.model.includes("sora")) {
      // Sora uses n_frames and size
      if (params.duration) {
        // duration "10" -> n_frames 10
        // duration "10s" -> n_frames 10
        const frames = parseInt(params.duration.replace(/\D/g, ''))
        requestBody.n_frames = isNaN(frames) ? 10 : frames
      }

      if (params.model.includes("storyboard")) {
        // Storyboard specific logic if needed
        // Ensure n_frames covers the whole storyboard or is per scene?
        // Usually API handles total duration based on scenes or explicit n_frames.
        // Leaving n_frames as is.
      }

      if (params.resolution) {
        // Map resolution to size
        // "720p" -> "1280x720" ? Or "Standard"?
        // Config uses "standard", "high". Route might default to "720p".
        // Let's map common values to be safe
        if (params.resolution.toLowerCase() === "standard" || params.resolution === "720p") {
          requestBody.size = "1280x720"
        } else if (params.resolution.toLowerCase() === "high" || params.resolution === "1080p") {
          requestBody.size = "1920x1080"
        } else {
          requestBody.size = params.resolution // Pass through if already in WxH format
        }
      }

      // Sora aspect ratio handling if needed, usually 'size' covers it, but API might accept aspect_ratio too.
      // Keeping input.aspect_ratio as well.

    } else {
      // Wan and others use duration/resolution directly
      if (params.duration) {
        requestBody.duration = params.duration
      }
      if (params.resolution) {
        requestBody.resolution = params.resolution
      }
    }

    if (params.callBackUrl) {
      requestBody.callBackUrl = params.callBackUrl
    }

    // Quick fix: If model is sora storyboard, ensure we don't send conflicting generic params if they are strict
    // But mostly input is what matters.

    console.log("Job request:", JSON.stringify(requestBody, null, 2))

    const response = await fetchWithRetry(`${this.baseUrl}/jobs/createTask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Wan 2.6 API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    if (!result.taskId) {
      throw new Error(`Wan 2.6 generation failed: ${result.failMsg || "No task ID returned"}`)
    }

    return result.taskId
  }

  /**
   * Check Wan 2.6 task status
   */
  async checkWan26Status(taskId: string): Promise<{
    state: "waiting" | "success" | "fail"
    resultUrls?: string[]
    failMsg?: string
    failCode?: string
  }> {
    const response = await fetchWithRetry(`${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Wan 2.6 status check error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    return {
      state: result.state || "waiting",
      resultUrls: result.resultJson?.resultUrls || [],
      failMsg: result.failMsg,
      failCode: result.failCode,
    }
  }

  /**
   * Generate video with Wan 2.6 and poll until complete
   */
  async generateWithWan26AndPoll(
    params: {
      model: string
      prompt: string
      negative_prompt?: string
      aspect_ratio?: string
      duration?: string
      resolution?: string
      image_urls?: string[]
      video_urls?: string[]
      seed?: number
      storyboard?: { prompt: string; duration?: string; img_url?: string }[]
    },
    options: {
      maxAttempts?: number
      pollingInterval?: number
      onProgress?: (attempt: number, maxAttempts: number) => void
    } = {}
  ): Promise<{ videoUrl: string; taskId: string }> {
    const maxAttempts = options.maxAttempts || 120 // 20 minutes with 10s intervals
    const pollingInterval = options.pollingInterval || 10000 // 10 seconds

    console.log(`Starting Wan 2.6 video generation with model: ${params.model}...`)
    const taskId = await this.generateWithWan26(params)
    console.log("Wan 2.6 task created:", taskId)

    let attempts = 0
    while (attempts < maxAttempts) {
      attempts++
      console.log(`Wan 2.6 polling... (attempt ${attempts}/${maxAttempts})`)

      if (options.onProgress) {
        options.onProgress(attempts, maxAttempts)
      }

      await new Promise((resolve) => setTimeout(resolve, pollingInterval))

      const status = await this.checkWan26Status(taskId)

      if (status.state === "success") {
        if (!status.resultUrls || status.resultUrls.length === 0) {
          throw new Error("Wan 2.6 generation succeeded but no video URL returned")
        }

        console.log("Wan 2.6 video generation complete:", status.resultUrls[0])
        return {
          videoUrl: status.resultUrls[0],
          taskId: taskId,
        }
      }

      if (status.state === "fail") {
        throw new Error(
          `Wan 2.6 generation failed: ${status.failMsg || "Unknown error"} (Code: ${status.failCode || "unknown"})`
        )
      }

      // state is "waiting", continue polling
    }

    throw new Error("Wan 2.6 video generation timeout")
  }

  // ============================================
  // Upscale Methods (1080p & 4K)
  // ============================================

  /**
   * Request 1080p Upscale
   */
  async get1080pVideo(params: { taskId: string; index?: number; callBackUrl?: string }): Promise<string> {
    const response = await fetchWithRetry(`${this.baseUrl}/veo/get-1080p-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        taskId: params.taskId,
        index: params.index || 0,
        ...(params.callBackUrl && { callBackUrl: params.callBackUrl }),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`KIE.AI 1080p upscale error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    if (result.code !== 200) {
      throw new Error(`KIE.AI 1080p upscale failed: ${result.msg}`)
    }

    return result.data.taskId
  }

  /**
   * Request 4K Upscale
   */
  async get4kVideo(params: { taskId: string; index?: number; callBackUrl?: string }): Promise<string> {
    const response = await fetchWithRetry(`${this.baseUrl}/veo/get-4k-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        taskId: params.taskId,
        index: params.index || 0,
        ...(params.callBackUrl && { callBackUrl: params.callBackUrl }),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`KIE.AI 4K upscale error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    if (result.code !== 200) {
      throw new Error(`KIE.AI 4K upscale failed: ${result.msg}`)
    }

    return result.data.taskId
  }



  /**
   * Request 1080p Upscale and Poll
   */
  async get1080pVideoWithPolling(
    taskId: string,
    options: { maxAttempts?: number; pollingInterval?: number, onProgress?: (attempt: number) => void } = {}
  ): Promise<{ videoUrl: string; taskId: string }> {
    const newTaskId = await this.get1080pVideo({ taskId })
    return this.pollTask(newTaskId, "1080p upscale", options)
  }

  /**
   * Request 4K Upscale and Poll
   */
  async get4kVideoWithPolling(
    taskId: string,
    options: { maxAttempts?: number; pollingInterval?: number, onProgress?: (attempt: number) => void } = {}
  ): Promise<{ videoUrl: string; taskId: string }> {
    const newTaskId = await this.get4kVideo({ taskId })
    return this.pollTask(newTaskId, "4K upscale", options)
  }

  /**
   * Generic polling helper
   */
  private async pollTask(
    taskId: string,
    actionName: string,
    options: { maxAttempts?: number; pollingInterval?: number; onProgress?: (attempt: number) => void } = {}
  ): Promise<{ videoUrl: string; taskId: string }> {
    const maxAttempts = options.maxAttempts || 60
    const pollingInterval = options.pollingInterval || 5000

    console.log(`Starting KIE.AI ${actionName} polling for task ${taskId}...`)

    let attempts = 0
    while (attempts < maxAttempts) {
      attempts++
      if (options.onProgress) options.onProgress(attempts)

      await new Promise((resolve) => setTimeout(resolve, pollingInterval))
      const status = await this.checkStatus(taskId)

      if (status.successFlag === 1) {
        if (!status.response?.resultUrls?.[0]) throw new Error(`KIE.AI ${actionName} succeeded but no URL returned`)
        return { videoUrl: status.response.resultUrls[0], taskId }
      }
      if (status.successFlag === 2 || status.successFlag === 3) {
        throw new Error(`KIE.AI ${actionName} failed: ${status.errorMessage}`)
      }
    }
    throw new Error(`KIE.AI ${actionName} timeout`)
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
