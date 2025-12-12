import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

const MAX_PROMPT_LENGTH = 5000
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

interface EnhancePromptResponse {
  enhanced: string
  imageAnalysis?: string[]
}

interface ErrorResponse {
  error: string
  details?: string
}

async function analyzeImage(imageSource: File | string): Promise<string> {
  try {
    const convertToDataUrl = async (source: File | string): Promise<string> => {
      if (typeof source === "string") {
        const response = await fetch(source)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString("base64")
        const contentType = response.headers.get("content-type") || "image/jpeg"
        return `data:${contentType};base64,${base64}`
      } else {
        const arrayBuffer = await source.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString("base64")
        return `data:${source.type};base64,${base64}`
      }
    }

    const imageDataUrl = await convertToDataUrl(imageSource)

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: imageDataUrl,
            },
            {
              type: "text",
              text: "Analyze this image and provide a concise description of its main elements, composition, setting, and visual characteristics. Keep it brief (1-2 sentences). Focus on: what is in the image, the setting/environment, lighting, colors, and any notable visual elements.",
            },
          ],
        },
      ],
    })

    return text.trim()
  } catch (error) {
    console.error("Error analyzing image:", error)
    return "Unable to analyze image"
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get("prompt") as string
    const image1 = formData.get("image1") as File | null
    const image2 = formData.get("image2") as File | null
    const image1Url = formData.get("image1Url") as string | null
    const image2Url = formData.get("image2Url") as string | null

    if (!prompt?.trim()) {
      return NextResponse.json<ErrorResponse>(
        { error: "Prompt is required" },
        { status: 400 },
      )
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json<ErrorResponse>(
        { error: `Prompt is too long (maximum ${MAX_PROMPT_LENGTH} characters)` },
        { status: 400 },
      )
    }

    // Analyze images if present
    const imageAnalyses: string[] = []
    const hasImages = (image1 || image1Url) || (image2 || image2Url)

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

      const analysis = await analyzeImage(image1)
      imageAnalyses.push(analysis)
    }

    if (image1Url) {
      const analysis = await analyzeImage(image1Url)
      imageAnalyses.push(analysis)
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

      const analysis = await analyzeImage(image2)
      imageAnalyses.push(analysis)
    }

    if (image2Url) {
      const analysis = await analyzeImage(image2Url)
      imageAnalyses.push(analysis)
    }

    // Build context from image analyses
    let imageContext = ""
    if (imageAnalyses.length > 0) {
      imageContext = `\n\nCONTEXT FROM INPUT IMAGES:\n${imageAnalyses.map((analysis, i) => `Image ${i + 1}: ${analysis}`).join("\n")}\n\nThe user wants to edit/combine these images with the following direction:`
    }

    const systemPrompt = `You are an expert AI image generation prompt engineer specialized in image editing and combination. Your task is to enhance and optimize prompts for Google's Gemini image generation model based on official best practices.

CORE PRINCIPLE:
"Describe the scene, not just list words." Focus on creating vivid, complete narratives that paint a cohesive visual picture.${imageContext}

ENHANCEMENT GUIDELINES:

1. SCENE COMPOSITION (Primary Focus):
   - Complete setting/environment description: location, time of day, weather, season
   - Spatial relationships: how elements are positioned and interact
   - Atmosphere and mood: emotional tone, lighting quality, ambient conditions
   - Foreground, midground, and background layers

2. PHOTOGRAPHIC/VISUAL TECHNIQUES (when appropriate):
   - Camera perspective: close-up, wide-angle, overhead, low angle, macro shot
   - Composition style: rule of thirds, centered, symmetrical, diagonal lines
   - Lighting type: natural sunlight, golden hour, soft diffuse, dramatic shadows, neon
   - Depth of field: sharp focus subject with blurred background, or all in focus
   - Color palette: warm/cool tones, vibrant/muted, monochromatic, specific color scheme

3. STYLIZATION (when requested):
   - Art style: photorealistic, illustration, watercolor, oil painting, digital art, 3D render
   - Artistic movement: impressionist, surrealist, minimalist, baroque, art deco
   - Reference inspirations: "in the style of [artist]" or "inspired by [work]"

4. SPECIFIC SUBJECT DETAILS:
   - Character/object descriptions: physical appearance, expression, gesture, clothing
   - Materials and textures: fabric, metal, wood, glass, skin, foliage
   - Scale and proportion: size relationships between elements
   - Actions or interactions: what is happening in the scene

5. TECHNICAL CONSTRAINTS:
   - Keep prompt between 75-500 characters (concise but descriptive)
   - Maintain the user's original intent and core idea
   - Use descriptive language over generic superlatives
   - Avoid conflicting style directives${hasImages ? "\n   - IMPORTANT: Base the enhanced prompt on the images provided, expanding on user's requested modifications while preserving the base visual elements" : ""}

INSTRUCTIONS:
- Transform the prompt into a vivid scene description that tells a visual story
- Preserve and expand on the user's original intent
- Ensure all elements work together cohesively
- Return ONLY the enhanced prompt, no explanations, prefixes, bracketed notes, or commentary

Original prompt to enhance:
${prompt}

Enhanced prompt:`

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: systemPrompt,
      temperature: 0.7,
      maxTokens: 500,
    })

    return NextResponse.json<EnhancePromptResponse>({
      enhanced: text.trim(),
      imageAnalysis: imageAnalyses.length > 0 ? imageAnalyses : undefined,
    })
  } catch (error: any) {
    console.error("Error enhancing prompt with images:", error)
    return NextResponse.json<ErrorResponse>(
      { error: error.message || "Failed to enhance prompt" },
      { status: 500 },
    )
  }
}
