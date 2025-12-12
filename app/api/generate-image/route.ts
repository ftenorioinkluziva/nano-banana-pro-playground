import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export const dynamic = "force-dynamic"

const MAX_PROMPT_LENGTH = 5000
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

interface GenerateImageResponse {
  url: string
  urls?: string[]
  prompt: string
  description?: string
}

interface ErrorResponse {
  error: string
  message?: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Configuration error",
          details: "No Google API key configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const mode = formData.get("mode") as string
    const prompt = formData.get("prompt") as string
    const aspectRatio = formData.get("aspectRatio") as string
    const modelId = (formData.get("model") as string) || "gemini-2.5-flash-image"
    const numberOfImagesStr = formData.get("numberOfImages") as string
    const numberOfImages = Math.min(parseInt(numberOfImagesStr || "1", 10) || 1, 4)

    if (!mode) {
      return NextResponse.json<ErrorResponse>({ error: "Mode is required" }, { status: 400 })
    }

    if (!prompt?.trim()) {
      return NextResponse.json<ErrorResponse>({ error: "Prompt is required" }, { status: 400 })
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json<ErrorResponse>(
        { error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.` },
        { status: 400 },
      )
    }

    const geminiAspectRatioMap: Record<string, string> = {
      portrait: "9:16",
      landscape: "16:9",
      wide: "21:9",
      "4:3": "4:3",
      "3:4": "3:4",
      "3:2": "3:2",
      "2:3": "2:3",
      "5:4": "5:4",
      "4:5": "4:5",
      square: "1:1",
    }

    const geminiAspectRatio = geminiAspectRatioMap[aspectRatio] || "1:1"

    const model = google(modelId, {
      apiKey: apiKey,
    })

    if (mode === "text-to-image") {
      const imageGenerationPrompt = `Generate a high-quality image based on this description: ${prompt}. The image should be visually appealing and match the description as closely as possible.`

      try {
        const result = await generateText({
          model,
          prompt: imageGenerationPrompt,
          providerOptions: {
            google: {
              responseModalities: ["IMAGE"],
              imageConfig: {
                aspectRatio: geminiAspectRatio,
              },
            },
          },
        })

        console.log("Generation result:", {
          hasFiles: !!result.files,
          filesLength: result.files?.length,
          fileTypes: result.files?.map((f) => f.mediaType),
          textLength: result.text?.length,
        })

        const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/")) || []

        if (imageFiles.length === 0) {
          console.error("No image files found in result")
          return NextResponse.json<ErrorResponse>(
            { error: "No image generated", details: "The model did not return any images" },
            { status: 500 },
          )
        }

        const generatedImages = imageFiles.slice(0, numberOfImages).map((file) => `data:${file.mediaType};base64,${file.base64}`)
        const firstImage = generatedImages[0]

        return NextResponse.json<GenerateImageResponse>({
          url: firstImage,
          urls: generatedImages,
          prompt: prompt,
          description: result.text || "",
        })
      } catch (error) {
        console.error("Error in text-to-image generation:", error)
        throw error
      }
    } else if (mode === "image-editing") {
      const image1 = formData.get("image1") as File
      const image2 = formData.get("image2") as File
      const image1Url = formData.get("image1Url") as string
      const image2Url = formData.get("image2Url") as string

      const hasImage1 = !!image1 || !!image1Url
      const hasImage2 = !!image2 || !!image2Url

      if (!hasImage1) {
        return NextResponse.json<ErrorResponse>(
          { error: "At least one image is required for editing mode" },
          { status: 400 },
        )
      }

      if (image1) {
        if (image1.size > MAX_FILE_SIZE) {
          return NextResponse.json<ErrorResponse>(
            { error: `Image 1 too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.` },
            { status: 400 },
          )
        }
        if (!ALLOWED_IMAGE_TYPES.includes(image1.type)) {
          return NextResponse.json<ErrorResponse>(
            { error: "Image 1 has invalid format. Allowed: JPEG, PNG, WebP, GIF" },
            { status: 400 },
          )
        }
      }

      if (image2) {
        if (image2.size > MAX_FILE_SIZE) {
          return NextResponse.json<ErrorResponse>(
            { error: `Image 2 too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.` },
            { status: 400 },
          )
        }
        if (!ALLOWED_IMAGE_TYPES.includes(image2.type)) {
          return NextResponse.json<ErrorResponse>(
            { error: "Image 2 has invalid format. Allowed: JPEG, PNG, WebP, GIF" },
            { status: 400 },
          )
        }
      }

      const convertToDataUrl = async (source: File | string): Promise<string> => {
        if (typeof source === "string") {
          // Check if it's a URL (starts with http/https)
          if (source.startsWith("http://") || source.startsWith("https://")) {
            try {
              const response = await fetch(source)
              const arrayBuffer = await response.arrayBuffer()
              const buffer = Buffer.from(arrayBuffer)
              const base64 = buffer.toString("base64")
              const contentType = response.headers.get("content-type") || "image/jpeg"
              return `data:${contentType};base64,${base64}`
            } catch (error) {
              console.error("Error fetching URL image:", error)
              throw new Error(`Failed to fetch image from URL: ${source}`)
            }
          } else {
            // Already a data URL
            return source
          }
        } else {
          const arrayBuffer = await source.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const base64 = buffer.toString("base64")
          return `data:${source.type};base64,${base64}`
        }
      }

      try {
        const image1DataUrl = await convertToDataUrl(image1 || image1Url)
        const image2DataUrl = hasImage2 ? await convertToDataUrl(image2 || image2Url) : null

        const editingPrompt = hasImage2
          ? `${prompt}. Use these images as visual references and combine them creatively.`
          : `${prompt}. Use this image as a visual reference and apply the requested modifications.`

        console.log("Image editing request:", {
          hasImage1,
          hasImage2,
          promptLength: editingPrompt.length,
          numberOfImages,
          image1IsUrl: image1Url ? true : false,
          image2IsUrl: image2Url ? true : false,
          mode: "image-editing-with-visual-reference",
        })

        // Direct approach: Use images as visual references in the generation prompt
        // This is more effective than analyzing and regenerating
        try {
          const generationMessages: Array<{
            role: "user" | "assistant"
            content: Array<{ type: "text" | "image"; text?: string; image?: string }>
          }> = [
            {
              role: "user",
              content: [
                { type: "image", image: image1DataUrl },
                ...(image2DataUrl ? [{ type: "image", image: image2DataUrl }] : []),
                {
                  type: "text",
                  text: editingPrompt,
                },
              ],
            },
          ]

          console.log("Generation request with visual references:", {
            imageCount: hasImage2 ? 2 : 1,
            promptLength: editingPrompt.length,
          })

          const result = await generateText({
            model,
            // @ts-ignore
            messages: generationMessages,
            providerOptions: {
              google: {
                responseModalities: ["IMAGE"],
                imageConfig: {
                  aspectRatio: geminiAspectRatio,
                },
              },
            },
          })

        console.log("Image editing result:", {
          hasFiles: !!result.files,
          filesLength: result.files?.length,
          fileTypes: result.files?.map((f) => f.mediaType),
          textLength: result.text?.length,
        })

        const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/")) || []

        if (imageFiles.length === 0) {
          console.error("No image files found in editing result")
          return NextResponse.json<ErrorResponse>(
            { error: "No image generated", details: "The model did not return any images" },
            { status: 500 },
          )
        }

        const generatedImages = imageFiles.slice(0, numberOfImages).map((file) => `data:${file.mediaType};base64,${file.base64}`)
        const firstImage = generatedImages[0]

        return NextResponse.json<GenerateImageResponse>({
          url: firstImage,
          urls: generatedImages,
          prompt: editingPrompt,
          description: result.text || "Image generated using visual references",
        })
        } catch (error) {
          console.error("Error in image-editing generation:", error)
          throw error
        }
      } catch (error) {
        console.error("Error in image-editing mode:", error)
        throw error
      }
    } else {
      return NextResponse.json<ErrorResponse>(
        { error: "Invalid mode", details: "Mode must be 'text-to-image' or 'image-editing'" },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error in generate-image route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to generate image",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
