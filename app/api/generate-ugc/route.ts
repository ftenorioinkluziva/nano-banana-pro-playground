import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { generateDirectorPrompt } from "@/lib/agents/director"
import { KieAIService } from "@/lib/kieai-service"
import { v4 as uuidv4 } from "uuid"

const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return dbUrl
}

export const dynamic = "force-dynamic"
export const maxDuration = 600 // 10 minutes for video generation

interface GenerateUGCRequest {
  userRequest: string // Descrição do usuário
  productId: number
  capabilityId: string
  aspectRatio?: "16:9" | "9:16"
  model?: "veo3" | "veo3_fast"
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateUGCRequest
    const { userRequest, productId, capabilityId, aspectRatio, model } = body

    // Validations
    if (!userRequest || !productId || !capabilityId) {
      return NextResponse.json(
        { error: "userRequest, productId, and capabilityId are required" },
        { status: 400 }
      )
    }

    const kieApiKey = process.env.KIEAI_API_KEY
    if (!kieApiKey) {
      return NextResponse.json(
        { error: "KIEAI_API_KEY not configured" },
        { status: 500 }
      )
    }

    const sql = neon(getDatabaseUrl())

    // 1. Buscar produto do banco com JOIN em brands
    const productResult = await sql`
      SELECT
        p.id,
        p.name,
        p.description,
        p.brand_id,
        b.tone as brand_tone
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ${productId}
        AND p.is_active = true
      LIMIT 1
    `

    if (productResult.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    const product = productResult[0]

    // 2. Buscar capability do banco
    const capabilityResult = await sql`
      SELECT
        id,
        label,
        base_prompt_template,
        recommended_aspect_ratio,
        default_negative_prompt,
        generation_type
      FROM capabilities
      WHERE id = ${capabilityId}
        AND is_active = true
        AND deleted_at IS NULL
      LIMIT 1
    `

    if (capabilityResult.length === 0) {
      return NextResponse.json(
        { error: "Capability not found" },
        { status: 404 }
      )
    }

    const capability = capabilityResult[0]

    // 3. Chamar Director Agent para gerar prompt técnico
    console.log("Calling Director Agent...")
    const technicalPrompt = await generateDirectorPrompt({
      userRequest,
      productName: product.name,
      productDescription: product.description || "",
      brandTone: product.brand_tone || undefined,
      capabilityTemplate: capability.base_prompt_template,
      capabilityName: capability.label,
    })

    console.log("Technical Prompt Generated:", technicalPrompt)

    // 4. Gerar vídeo via KieAI
    const kieService = new KieAIService(kieApiKey)
    const finalAspectRatio = aspectRatio || capability.recommended_aspect_ratio || "16:9"
    const finalModel = model || "veo3_fast"

    console.log("Starting video generation with KieAI...")
    const result = await kieService.generateVideoWithPolling({
      prompt: technicalPrompt,
      aspectRatio: finalAspectRatio as "16:9" | "9:16",
      model: finalModel as "veo3" | "veo3_fast",
      generationType: "TEXT_2_VIDEO",
    })

    console.log("Video generation complete:", result.videoUrl)

    // 5. Salvar no banco de dados
    const videoId = uuidv4()
    await sql`
      INSERT INTO videos (
        id,
        prompt,
        enhanced_prompt,
        original_user_request,
        mode,
        status,
        video_url,
        video_uri,
        task_id,
        aspect_ratio,
        model,
        product_id,
        capability_id,
        negative_prompt
      ) VALUES (
        ${videoId},
        ${technicalPrompt},
        ${technicalPrompt},
        ${userRequest},
        'Text to Video',
        'complete',
        ${result.videoUrl || null},
        ${result.videoUrl || null},
        ${result.taskId || null},
        ${finalAspectRatio},
        ${finalModel},
        ${productId},
        ${capabilityId},
        ${capability.default_negative_prompt || null}
      )
    `

    return NextResponse.json({
      success: true,
      videoId,
      videoUrl: result.videoUrl,
      taskId: result.taskId,
      technicalPrompt,
    })
  } catch (error) {
    console.error("Error in generate-ugc route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        error: "Failed to generate UGC video",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
