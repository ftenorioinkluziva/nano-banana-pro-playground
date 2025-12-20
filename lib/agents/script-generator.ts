import { generateText } from "ai"
import { google } from "@ai-sdk/google"

// Input interface
export interface ScriptGeneratorInput {
  personaImageBase64: string // data:image/jpeg;base64,...
  productImageUrl: string // URL from product.image_url
  productName: string
  painPoint: string
  context?: string
  tone: "natural_friendly" | "energetic" | "serious"
}

// Scene interface
export interface ScriptScene {
  scene_id: number
  type: "hook" | "solution" | "benefit" | "cta"
  duration_seconds: number
  video_prompt_en: string
  audio_script_pt: string
  direction_notes: string
}

// Output interface
export interface ScriptOutput {
  project_summary: string
  scenes: ScriptScene[]
}

// System prompt - Enhanced for detailed video generation
const SYSTEM_PROMPT = `# SYSTEM ROLE
You are an Expert Video Creation AI Director specialized in hyper-realistic UGC (User Generated Content) vertical selfie videos. Your function is to receive campaign data (Persona, Product, Context) and generate ultra-detailed technical video prompts optimized for AI video generation.

# INPUT DATA
You will receive:
- product_name: Product name
- core_benefit: The main pain point or benefit
- tone: Desired tone of voice (natural_friendly, energetic, serious)
- visual_refs: Reference images of persona and product

# TASK
Create a script with 3 to 4 scenes (5-8 seconds each) optimized for "Frames-to-Video" generation (FIRST_AND_LAST_FRAMES_2_VIDEO mode).

# CRITICAL RULES - MUST FOLLOW EXACTLY

1. **Output Format**: Respond ONLY with valid JSON. No Markdown, no conversation.

2. **Video Prompts - MANDATORY 5 SECTIONS**: Each video_prompt_en MUST contain ALL 5 sections below, separated by double line breaks. NEVER skip any section. NEVER merge sections.

   Format: "Subject & Action: [content]\n\nSetting & Lighting: [content]\n\nCamera Movement & Style: [content]\n\nPerformance: [content]\n\nNegative Prompt: [content]"

   **Section 1 - Subject & Action (REQUIRED):**
   - Start with: "Subject & Action: A realistic, vertical (9:16) selfie-style video of persona on the uploaded reference image"
   - If holding product: "holding the product based on the uploaded reference image of the product"
   - Describe specific actions, gestures, facial expressions

   **Section 2 - Setting & Lighting (REQUIRED):**
   - Start with: "Setting & Lighting:"
   - Specify exact location (office desk, parked car, home kitchen, outdoor park, etc.)
   - Lighting type (natural daylight, soft window light, golden hour, overcast sky, etc.)
   - Background treatment (blurred, slightly out of focus, bokeh effect, etc.)

   **Section 3 - Camera Movement & Style (REQUIRED):**
   - Start with: "Camera Movement & Style:"
   - MUST include: "Handheld camera movement with subtle micro-shakes and breathing movements"
   - MUST include: "Camera held at arm's length (phone NOT visible)"
   - MUST include: "High-fidelity, 4k, photorealistic texture, slight film grain to mimic iPhone footage"
   - MUST include: "Vertical (9:16) format"
   - Focus details: "Sharp focus on face, shallow depth of field"

   **Section 4 - Performance (REQUIRED):**
   - Start with: "Performance:"
   - Facial expressions and emotions (tired, excited, relieved, concerned, etc.)
   - Body language and gestures (nodding, pointing, gesturing, shrugging, etc.)
   - Eye contact: "maintaining direct eye contact with camera" or variations
   - MUST end with: "Talking continuously for X seconds" (where X = scene duration)

   **Section 5 - Negative Prompt (REQUIRED):**
   - Start with: "Negative Prompt:"
   - MUST include base negatives: "No holding a phone, no subtitles, no text overlays, no tripod, no studio lighting, no cartoon, no distortion, no extra limbs"
   - Add 2-3 scene-specific negatives (no unnatural poses, no fake smile, no green screen, etc.)

3. **Audio Script (Portuguese)**: PT-BR, colloquial, 2-3 words per second

4. **VALIDATION**: Before outputting, verify EACH scene has ALL 5 sections with proper labels.

# EXAMPLE VIDEO_PROMPT_EN STRUCTURE:
"Subject & Action: A realistic, vertical (9:16) selfie-style video of a fit, approachable influencer based on the uploaded reference image of the persona holding the product based on the uploaded reference image of the product in one hand. She is looking directly into the camera lens, speaking urgently but enthusiastically.

Setting & Lighting: The background is a blurred, natural setting (e.g., inside a parked car or a bright home kitchen) with soft, natural daylight hitting the subject's face. The lighting is flattering but realistic, not studio-perfect.

Camera Movement & Style: Handheld camera movement with subtle micro-shakes and breathing movements to mimic a real human arm holding a phone. The camera is held at arm's length (the phone itself is NOT visible). The focus is sharp on the face and the product label, with a shallow depth of field blurring the background. High-fidelity, 4k, photorealistic texture, slight film grain to mimic iPhone footage. Vertical (9:16) format.

Performance: The subject is nodding slightly and gesturing with the product to emphasize scarcity. Her expression combines genuine concern with excitement. She is talking continuously for 8 seconds, maintaining eye contact with the camera.

Negative Prompt: No holding a phone, no subtitles, no text overlays, no tripod, no studio lighting, no cartoon, no distortion, no extra limbs, no fake expressions."

# JSON OUTPUT STRUCTURE
{
  "project_summary": "One sentence summary",
  "scenes": [
    {
      "scene_id": 1,
      "type": "hook",
      "duration_seconds": 5,
      "video_prompt_en": "Subject & Action: ... Setting & Lighting: ... Camera Movement & Style: ... Performance: ... Negative Prompt: ...",
      "audio_script_pt": "Spoken text...",
      "direction_notes": "Direction note"
    }
  ]
}`

// Tone mapping
const TONE_MAP = {
  natural_friendly: "Natural/Friendly (Relatable and warm)",
  energetic: "Energetic (High energy and enthusiastic)",
  serious: "Serious (Professional and trustworthy)",
}

/**
 * Generate structured UGC script using Gemini 2.5 Flash
 */
export async function generateUGCScript(input: ScriptGeneratorInput): Promise<ScriptOutput> {
  // Build user prompt
  const userPrompt = `Generate a hyper-realistic UGC video script based on these inputs:

Product: ${input.productName}
Pain Point / Benefit: ${input.painPoint}
Context: ${input.context || "Infer from the uploaded persona image"}
Tone: ${TONE_MAP[input.tone]}
Visual References: Persona image and product image have been uploaded.

CRITICAL REQUIREMENTS:
1. Each video_prompt_en MUST have these 5 sections in THIS ORDER:
   - Subject & Action: (using placeholders "based on the uploaded reference image of the persona")
   - Setting & Lighting: (describe environment, natural lighting, background blur)
   - Camera Movement & Style: (handheld, vertical 9:16, micro-shakes, 4k, iPhone footage feel)
   - Performance: (facial expressions, gestures, eye contact, "talking continuously for X seconds")
   - Negative Prompt: (what to avoid - no phone visible, no studio lighting, etc.)

2. Make prompts VERY detailed and cinematic - like directing a real UGC video shoot
3. ALWAYS specify vertical (9:16) selfie-style video
4. ALWAYS include handheld camera movements with micro-shakes
5. Keep audio scripts natural and colloquial in PT-BR
6. Generate 3-4 scenes: hook → solution → benefit → cta
7. Return ONLY valid JSON, no markdown or explanations`

  try {
    // Call Gemini with multimodal input
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image", image: input.personaImageBase64 },
            { type: "image", image: input.productImageUrl },
          ],
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    })

    // Extract JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response")
    }

    const parsedResponse = JSON.parse(jsonMatch[0]) as ScriptOutput

    // Validate structure
    if (!parsedResponse.project_summary || !parsedResponse.scenes || !Array.isArray(parsedResponse.scenes)) {
      throw new Error("Invalid script structure: missing project_summary or scenes")
    }

    // Validate scenes
    for (const scene of parsedResponse.scenes) {
      if (
        typeof scene.scene_id !== "number" ||
        !scene.type ||
        !scene.video_prompt_en ||
        !scene.audio_script_pt ||
        !scene.duration_seconds
      ) {
        throw new Error(`Invalid scene structure: ${JSON.stringify(scene)}`)
      }
    }

    return parsedResponse
  } catch (error) {
    console.error("Error generating UGC script:", error)

    // Retry once
    if (error instanceof Error && !error.message.includes("Retry")) {
      console.log("Retrying script generation...")
      try {
        const retryResult = await generateText({
          model: google("gemini-2.5-flash"),
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt + "\n\n(Retry - ensure valid JSON output)" },
                { type: "image", image: input.personaImageBase64 },
                { type: "image", image: input.productImageUrl },
              ],
            },
          ],
          temperature: 0.7,
          maxTokens: 2000,
        })

        const retryJsonMatch = retryResult.text.match(/\{[\s\S]*\}/)
        if (!retryJsonMatch) {
          throw new Error("Retry: No JSON found in AI response")
        }

        return JSON.parse(retryJsonMatch[0]) as ScriptOutput
      } catch (retryError) {
        console.error("Retry failed:", retryError)
        throw new Error(`Script generation failed after retry: ${retryError instanceof Error ? retryError.message : "Unknown error"}`)
      }
    }

    throw new Error(`Script generation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
