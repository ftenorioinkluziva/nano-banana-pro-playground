import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export const dynamic = "force-dynamic"

interface EnhanceVideoPromptRequest {
  prompt: string
  mode?: string
}

interface EnhanceVideoPromptResponse {
  originalPrompt: string
  enhancedPrompt: string
  suggestions: {
    subject?: string
    action?: string
    style?: string
    camera?: string
    composition?: string
    ambiance?: string
  }
}

interface ErrorResponse {
  error: string
  details?: string
}

const ENHANCE_PROMPT_SYSTEM = `You are a professional video prompt engineer. Your task is to enhance video generation prompts to be more descriptive and effective for AI video generation.

Follow these guidelines from Google's Veo documentation:

1. **Subject**: Make the main focus crystal clear (object, person, animal, scenery)
2. **Action**: Describe what the subject is doing with dynamic verbs
3. **Style**: Add creative direction (sci-fi, horror film, film noir, documentary, animated, cinematic, etc.)
4. **Camera positioning and motion**: Include terms like "aerial view, eye-level, top-down, dolly shot, tracking shot, pan"
5. **Composition**: Add framing guidance (wide shot, close-up, single-shot, two-shot, overhead)
6. **Focus and lens effects**: Include "shallow focus, deep focus, macro lens, wide-angle, telephoto"
7. **Ambiance**: Describe colors and lighting (warm tones, cool tones, blue tones, golden hour, neon, candlelit, moonlit, foggy)

For each enhancement, provide:
1. The enhanced prompt (making it more descriptive and vivid)
2. Specific suggestions for each element

Key principles:
- Use descriptive language with adjectives and adverbs
- Create vivid imagery that helps the AI understand intent
- Be specific and concrete, avoid vague terms
- For dialogue, include in quotes and describe tone
- Suggest sound effects and ambient noise explicitly
- Keep it under 2000 characters

Output MUST be valid JSON with this exact structure:
{
  "originalPrompt": "the original prompt",
  "enhancedPrompt": "the improved prompt",
  "suggestions": {
    "subject": "subject suggestions",
    "action": "action suggestions",
    "style": "style suggestions",
    "camera": "camera suggestions",
    "composition": "composition suggestions",
    "ambiance": "ambiance suggestions"
  }
}`

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Configuration error",
          details: "No Google API key configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment variables.",
        },
        { status: 500 }
      )
    }

    const body = (await request.json()) as EnhanceVideoPromptRequest
    const { prompt, mode } = body

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    if (prompt.length > 2000) {
      return NextResponse.json<ErrorResponse>(
        { error: "Prompt is too long. Maximum 2000 characters allowed." },
        { status: 400 }
      )
    }

    const model = google("gemini-2.5-flash", {
      apiKey: apiKey,
    })

    const userPrompt = `Enhance this video generation prompt for better AI video generation results.

Original Prompt: "${prompt}"
${mode ? `Generation Mode: ${mode}` : ""}

Analyze the prompt and provide:
1. An enhanced version with more descriptive language, vivid details, and proper structure
2. Suggestions for each element (subject, action, style, camera, composition, ambiance)

If the prompt is missing key elements, suggest additions.
If it's already good, refine it further while maintaining the original intent.

IMPORTANT: Return as valid JSON with this exact structure:
{
  "originalPrompt": "the original prompt",
  "enhancedPrompt": "the improved prompt with all enhancements",
  "suggestions": {
    "subject": "improved subject description or comment",
    "action": "improved action description or comment",
    "style": "style suggestions",
    "camera": "camera positioning and motion suggestions",
    "composition": "composition suggestions",
    "ambiance": "ambiance, lighting and color suggestions"
  }
}`

    const result = await generateText({
      model,
      prompt: userPrompt,
      system: ENHANCE_PROMPT_SYSTEM,
      temperature: 0.7,
      maxTokens: 1500,
    })

    console.log("Enhancement result:", result.text.substring(0, 200))

    // Extract JSON from the response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("Failed to parse JSON from response:", result.text.substring(0, 500))
      return NextResponse.json<ErrorResponse>(
        { error: "Failed to parse enhanced prompt response" },
        { status: 500 }
      )
    }

    try {
      const parsedResponse = JSON.parse(jsonMatch[0]) as EnhanceVideoPromptResponse
      return NextResponse.json<EnhanceVideoPromptResponse>(parsedResponse)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json<ErrorResponse>(
        { error: "Failed to parse enhanced prompt response" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in enhance-video-prompt route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to enhance video prompt",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
