import { NextRequest, NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { requireAuth } from "@/lib/auth-session"
import { checkCredits, deductCredits } from "@/lib/credits"
import { USAGE_COSTS, getPromptEnhancementCost } from "@/lib/usage-costs"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const body = await request.json()
    const { prompt } = body

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: "Prompt is too long (maximum 5000 characters)" },
        { status: 400 }
      )
    }

    // Check credits
    const cost = await getPromptEnhancementCost()
    const hasCredits = await checkCredits(userId, cost)
    if (!hasCredits) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
    }

    const systemPrompt = `You are an expert AI image generation prompt engineer. Your task is to enhance and optimize prompts for Google's Gemini image generation model based on official best practices.

CORE PRINCIPLE:
"Describe the scene, not just list words." Focus on creating vivid, complete narratives that paint a cohesive visual picture.

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
   - Avoid conflicting style directives

INSTRUCTIONS:
- Transform the prompt into a vivid scene description that tells a visual story
- Preserve and expand on the user's original intent
- Ensure all elements work together cohesively
- Return ONLY the enhanced prompt, no explanations, prefixes, bracketed notes, or commentary

Original prompt to enhance:
${prompt}

Enhanced prompt:`

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: systemPrompt,
      temperature: 0.7,
      maxTokens: 500,
    })

    // Deduct credits
    await deductCredits(userId, cost, "Prompt Enhancement")

    return NextResponse.json({
      enhanced: text.trim(),
    })

  } catch (error: any) {
    console.error("Error enhancing prompt:", error)
    return NextResponse.json(
      { error: error.message || "Failed to enhance prompt" },
      { status: 500 }
    )
  }
}
