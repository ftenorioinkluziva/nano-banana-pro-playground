import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const MAX_PROMPT_LENGTH = 10000
const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

// Kie API endpoints
const KIE_API_BASE = "https://api.kie.ai/api/v1/jobs"
const CREATE_TASK_ENDPOINT = `${KIE_API_BASE}/createTask`
const QUERY_STATUS_ENDPOINT = `${KIE_API_BASE}/recordInfo`
const FILE_UPLOAD_ENDPOINT = "https://kieai.redpandaai.co/api/file-base64-upload"

interface GenerateImageResponse {
  id: string // Unique generation ID
  url: string
  urls?: string[]
  prompt: string
  mode: "text-to-image" | "image-editing"
  taskId?: string
  aspectRatio?: string
  resolution?: string
  outputFormat?: string
}

interface ErrorResponse {
  error: string
  message?: string
  details?: string
}

interface KieCreateTaskResponse {
  code: number
  message?: string
  data?: {
    taskId: string
  }
}

interface KieStatusResponse {
  code: number
  msg?: string
  message?: string
  data?: {
    taskId: string
    model: string
    state: "waiting" | "success" | "fail"
    param: string
    resultJson: string // JSON string that needs to be parsed
    failCode: string | null
    failMsg: string | null
    costTime: number | null
    completeTime: number | null
    createTime: number
  }
}

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

// Helper function to upload a base64 image to Kie's file upload API
async function uploadBase64Image(base64Data: string, apiKey: string): Promise<string> {
  const response = await fetch(FILE_UPLOAD_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      base64Data,
      uploadPath: "images/temp",
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

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.KIEAI_API_KEY

    if (!apiKey) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Configuration error",
          details: "No Kie API key configured. Please add KIEAI_API_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const prompt = formData.get("prompt") as string
    const aspectRatio = (formData.get("aspectRatio") as string) || "1:1"
    const resolution = (formData.get("resolution") as string) || "1K"
    const outputFormat = (formData.get("outputFormat") as string) || "PNG"

    // Validate prompt
    if (!prompt?.trim()) {
      return NextResponse.json<ErrorResponse>({ error: "Prompt is required" }, { status: 400 })
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json<ErrorResponse>(
        { error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.` },
        { status: 400 },
      )
    }

    // Aspect ratio is already in the correct format (e.g., "1:1", "16:9")
    const kieAspectRatio = aspectRatio || "1:1"

    // Handle image inputs (if any)
    const imageInputUrls: string[] = []

    // Check for image files
    const image1 = formData.get("image1") as File | null
    const image2 = formData.get("image2") as File | null

    // Check for image URLs
    const image1Url = formData.get("image1Url") as string | null
    const image2Url = formData.get("image2Url") as string | null

    // Convert image file to base64
    const convertFileToBase64 = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString("base64")
      return `data:${file.type};base64,${base64}`
    }

    // Convert image URL to base64
    const convertUrlToBase64 = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString("base64")
        const contentType = response.headers.get("content-type") || "image/jpeg"
        return `data:${contentType};base64,${base64}`
      } catch (error) {
        console.error("Error fetching image from URL:", error)
        throw new Error(`Failed to fetch image from URL: ${url}`)
      }
    }

    // Process images - upload to Kie and get URLs
    if (image1) {
      if (image1.size > MAX_FILE_SIZE) {
        return NextResponse.json<ErrorResponse>(
          { error: `Image 1 too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.` },
          { status: 400 },
        )
      }
      const base64Data = await convertFileToBase64(image1)
      const uploadedUrl = await uploadBase64Image(base64Data, apiKey)
      imageInputUrls.push(uploadedUrl)
    } else if (image1Url) {
      // If user provided a URL, upload it to Kie first
      const base64Data = await convertUrlToBase64(image1Url)
      const uploadedUrl = await uploadBase64Image(base64Data, apiKey)
      imageInputUrls.push(uploadedUrl)
    }

    if (image2) {
      if (image2.size > MAX_FILE_SIZE) {
        return NextResponse.json<ErrorResponse>(
          { error: `Image 2 too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.` },
          { status: 400 },
        )
      }
      const base64Data = await convertFileToBase64(image2)
      const uploadedUrl = await uploadBase64Image(base64Data, apiKey)
      imageInputUrls.push(uploadedUrl)
    } else if (image2Url) {
      // If user provided a URL, upload it to Kie first
      const base64Data = await convertUrlToBase64(image2Url)
      const uploadedUrl = await uploadBase64Image(base64Data, apiKey)
      imageInputUrls.push(uploadedUrl)
    }

    // Prepare Kie API request - parameters must be inside "input" object
    const inputParams: any = {
      prompt: prompt,
      aspect_ratio: kieAspectRatio,
      resolution: resolution,
      output_format: outputFormat.toLowerCase(), // Kie API requires lowercase
    }

    // Add image inputs if any
    if (imageInputUrls.length > 0) {
      inputParams.image_input = imageInputUrls
    }

    const kieRequestBody = {
      model: "nano-banana-pro",
      input: inputParams,
    }

    console.log("Creating Kie task with params:", {
      model: kieRequestBody.model,
      promptLength: prompt.length,
      aspect_ratio: inputParams.aspect_ratio,
      resolution: inputParams.resolution,
      output_format: inputParams.output_format,
      imageInputCount: imageInputUrls.length,
      imageUrls: imageInputUrls,
    })

    console.log("Full request body:", JSON.stringify(kieRequestBody, null, 2).substring(0, 500))

    // Step 1: Create task
    const createTaskResponse = await fetch(CREATE_TASK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(kieRequestBody),
    })

    if (!createTaskResponse.ok) {
      const errorData = await createTaskResponse.json().catch(() => ({}))

      console.error("Kie API error:", {
        status: createTaskResponse.status,
        statusText: createTaskResponse.statusText,
        errorData,
      })

      if (createTaskResponse.status === 429) {
        return NextResponse.json<ErrorResponse>(
          { error: "Rate limit exceeded", details: "Too many requests. Please try again later." },
          { status: 429 },
        )
      }

      if (createTaskResponse.status === 402) {
        return NextResponse.json<ErrorResponse>(
          { error: "Insufficient balance", details: "Your account balance is insufficient." },
          { status: 402 },
        )
      }

      const errorMessage = errorData.message || errorData.error || createTaskResponse.statusText
      throw new Error(`Failed to create task: ${errorMessage}`)
    }

    const createTaskData: KieCreateTaskResponse = await createTaskResponse.json()

    console.log("Kie API response:", {
      code: createTaskData.code,
      message: createTaskData.message,
      hasTaskId: !!createTaskData.data?.taskId,
      fullResponse: JSON.stringify(createTaskData),
    })

    if (createTaskData.code !== 200 || !createTaskData.data?.taskId) {
      const errorMsg = (createTaskData as any).msg || createTaskData.message || "Unknown error"
      throw new Error(`Failed to create task: ${errorMsg}`)
    }

    const taskId = createTaskData.data.taskId
    console.log("Task created successfully:", taskId)

    // Step 2: Poll for status
    const maxPollingAttempts = 180 // 180 attempts * 2 seconds = 6 minutes max
    const pollingInterval = 2000 // 2 seconds

    for (let attempt = 0; attempt < maxPollingAttempts; attempt++) {
      // Wait before polling
      await new Promise((resolve) => setTimeout(resolve, pollingInterval))

      const statusResponse = await fetch(`${QUERY_STATUS_ENDPOINT}?taskId=${taskId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!statusResponse.ok) {
        console.error("Failed to query status:", statusResponse.statusText)
        continue
      }

      const statusData: KieStatusResponse = await statusResponse.json()

      if (statusData.code !== 200) {
        console.error("Status query returned error:", statusData.msg || statusData.message)
        continue
      }

      const state = statusData.data?.state

      if (state === "success") {
        // Parse the resultJson string
        const resultJsonStr = statusData.data?.resultJson

        if (!resultJsonStr) {
          throw new Error("No result data returned")
        }

        let resultData: any
        try {
          resultData = JSON.parse(resultJsonStr)
        } catch (error) {
          console.error("Failed to parse resultJson:", resultJsonStr)
          throw new Error("Failed to parse result data")
        }

        const resultUrls = resultData.resultUrls as string[] | undefined

        if (!resultUrls || resultUrls.length === 0) {
          console.error("Task succeeded but no URLs found. resultData:", resultData)
          throw new Error("No images generated")
        }

        console.log("Task completed successfully. Generated images:", resultUrls.length)

        // Determine generation mode based on whether images were provided
        const mode: "text-to-image" | "image-editing" = imageInputUrls.length > 0 ? "image-editing" : "text-to-image"

        // Generate unique ID for this generation
        const generationId = crypto.randomUUID()

        return NextResponse.json<GenerateImageResponse>({
          id: generationId,
          url: resultUrls[0],
          urls: resultUrls,
          prompt: prompt,
          mode: mode,
          taskId: taskId,
          aspectRatio: aspectRatio,
          resolution: resolution,
          outputFormat: outputFormat,
        })
      }

      if (state === "fail") {
        const errorMessage = statusData.data?.failMsg || "Task failed"
        throw new Error(errorMessage)
      }

      // State is "waiting", continue polling
      console.log(`Polling attempt ${attempt + 1}/${maxPollingAttempts} - State: ${state}`)
    }

    // Timeout
    throw new Error("Image generation timed out. Please try again.")
  } catch (error) {
    console.error("Error in image generation:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Generation failed",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
