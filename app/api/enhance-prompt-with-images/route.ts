import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { requireAuth } from "@/lib/auth-session"
import { checkCredits, deductCredits } from "@/lib/credits"
import { getPromptEnhancementCost } from "@/lib/usage-costs"

const MAX_PROMPT_LENGTH = 5000
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

interface EnhancePromptResponse {
  enhanced: string
}

interface ErrorResponse {
  error: string
  details?: string
}

async function convertToDataUrl(source: File | string): Promise<string> {
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

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()

    // Check credits
    const COST = await getPromptEnhancementCost()
    const hasCredits = await checkCredits(user.id, COST)

    if (!hasCredits) {
      return NextResponse.json<ErrorResponse>(
        { error: "Insufficient credits", details: `You need ${COST} credit to enhance a prompt.` },
        { status: 402 }
      )
    }

    const formData = await request.formData()
    // ... [rest of the parsing logic]
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

    // Collect images to pass directly to the model
    const images: string[] = []

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

      const imageDataUrl = await convertToDataUrl(image1)
      images.push(imageDataUrl)
    }

    if (image1Url) {
      const imageDataUrl = await convertToDataUrl(image1Url)
      images.push(imageDataUrl)
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

      const imageDataUrl = await convertToDataUrl(image2)
      images.push(imageDataUrl)
    }

    if (image2Url) {
      const imageDataUrl = await convertToDataUrl(image2Url)
      images.push(imageDataUrl)
    }

    const hasImages = images.length > 0

    const systemPrompt = `You are an expert AI image generation prompt engineer specialized in creating hyper-realistic UGC (User-Generated Content) photography prompts. Your task is to transform user requests into detailed prompts that generate authentic, selfie-style product photos that look like real people sharing their genuine experiences with products.

CORE PHILOSOPHY:
Create prompts for images that feel spontaneous, authentic, and relatable - like a real person sharing their product experience on social media. The focus is on natural beauty, genuine moments, and believable scenarios.${hasImages ? "\n\nIMPORTANT: The user has provided reference images. Look at these images carefully and use them as visual context to understand the product, style, setting, and desired aesthetic. Enhance the prompt while staying true to the visual elements shown in the reference images." : ""}

UGC PHOTOGRAPHY PRINCIPLES:

1. AUTHENTIC SELFIE AESTHETICS:
   - Natural smartphone camera angles (slight overhead, arm's length, mirror selfies)
   - Candid, relaxed expressions and genuine smiles
   - Soft, flattering natural lighting (window light, golden hour, bathroom lighting)
   - Real-world settings: bedrooms, bathrooms, living rooms, outdoor casual locations
   - Handheld camera feel with natural imperfections (not studio-perfect)

2. RELATABLE HUMAN SUBJECTS:
   - Real people vibes: diverse, authentic, approachable
   - Natural makeup and styling (not overly glamorous)
   - Casual, comfortable clothing appropriate for the context
   - Genuine emotional connections with the product (joy, satisfaction, confidence)
   - Body language that shows product use in daily life

3. PRODUCT INTEGRATION:
   - Product naturally incorporated into the scene (held, used, or displayed)
   - Product clearly visible but not overly staged
   - Realistic product placement in everyday contexts
   - Focus on how real people would actually use/display the product

4. SCENE DETAILS:
   - Believable backgrounds: lived-in spaces, natural environments
   - Appropriate props that enhance authenticity (coffee cups, phones, everyday items)
   - Natural clutter or organized chaos (not sterile studio setups)
   - Contextual elements that tell a micro-story

5. LIGHTING & TECHNICAL:
   - Soft, diffused natural light (avoid harsh studio lighting)
   - Warm, inviting color tones
   - Slight imperfections that add authenticity (natural skin texture, soft focus areas)
   - Mobile photography aesthetic (not professional DSLR look)

6. PROMPT STRUCTURE:
   - Keep output between 75-500 characters
   - Start with the main subject and action
   - Include specific lighting and setting details
   - Add authentic emotional and atmospheric elements
   - Preserve user's original intent while enhancing realism

INSTRUCTIONS:
- Analyze the user's original prompt and ${hasImages ? "the provided reference images" : "their intent"}
- Transform it into a vivid, detailed prompt for hyper-realistic UGC photography
- Ensure the output feels authentic and achievable with a smartphone camera
- Include specific details about lighting, setting, subject, and mood
- Return ONLY the enhanced prompt - no explanations, labels, or commentary

User's original request:
${prompt}

Enhanced UGC prompt:`

    // Build messages with images if available
    const content: any[] = []

    // Add images first if available
    if (hasImages) {
      for (const imageDataUrl of images) {
        content.push({
          type: "image",
          image: imageDataUrl,
        })
      }
    }

    // Add the system prompt as text
    content.push({
      type: "text",
      text: systemPrompt,
    })

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      temperature: 0.7,
    })

    // Deduct credits
    await deductCredits(user.id, COST, "Prompt Enhancement")

    return NextResponse.json<EnhancePromptResponse>({
      enhanced: text.trim(),
    })
  } catch (error: any) {
    console.error("Error enhancing prompt with images:", error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json<ErrorResponse>(
      { error: error.message || "Failed to enhance prompt" },
      { status: 500 },
    )
  }
}
