import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"
import { generateUGCScript, type ScriptOutput } from "@/lib/agents/script-generator"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // 60 seconds timeout for AI generation

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]

interface GenerateScriptResponse {
  success: boolean
  scriptId: string
  script: ScriptOutput
}

interface ErrorResponse {
  error: string
  details?: string
}

/**
 * Convert File or URL to base64 data URL
 */
async function convertToDataUrl(source: File | string): Promise<string> {
  if (typeof source === "string") {
    // Fetch URL and convert to base64
    const response = await fetch(source)
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const contentType = response.headers.get("content-type") || "image/jpeg"
    return `data:${contentType};base64,${base64}`
  } else {
    // Convert File to base64
    const arrayBuffer = await source.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    return `data:${source.type};base64,${base64}`
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth()
    const userId = session.user.id

    // Parse FormData
    const formData = await request.formData()
    const productId = formData.get("product_id") as string
    const personaImage = formData.get("persona_image") as File | null
    const painPoint = formData.get("pain_point") as string
    const context = formData.get("context") as string | null
    const tone = formData.get("tone") as string

    // Validate required fields
    if (!productId) {
      return NextResponse.json<ErrorResponse>({ error: "product_id is required" }, { status: 400 })
    }

    if (!personaImage) {
      return NextResponse.json<ErrorResponse>({ error: "persona_image is required" }, { status: 400 })
    }

    if (!painPoint || !painPoint.trim()) {
      return NextResponse.json<ErrorResponse>({ error: "pain_point is required" }, { status: 400 })
    }

    if (!tone || !["natural_friendly", "energetic", "serious"].includes(tone)) {
      return NextResponse.json<ErrorResponse>(
        { error: "tone must be one of: natural_friendly, energetic, serious" },
        { status: 400 },
      )
    }

    // Validate persona image
    if (personaImage.size > MAX_FILE_SIZE) {
      return NextResponse.json<ErrorResponse>(
        { error: `Persona image too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.` },
        { status: 400 },
      )
    }

    if (!ALLOWED_IMAGE_TYPES.includes(personaImage.type)) {
      return NextResponse.json<ErrorResponse>(
        { error: `Invalid image type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}` },
        { status: 400 },
      )
    }

    // Fetch product from database - verify ownership
    const sql = getNeonClient()

    const productResult = await sql`
      SELECT id, name, image_url
      FROM products
      WHERE id = ${parseInt(productId)}
      AND user_id = ${userId}
      LIMIT 1
    `

    if (productResult.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: "Product not found or you don't have permission to use it" },
        { status: 404 }
      )
    }

    const product = productResult[0]

    if (!product.image_url) {
      return NextResponse.json<ErrorResponse>(
        { error: "Product must have an image_url for script generation" },
        { status: 400 },
      )
    }

    console.log("Generating UGC script for product:", product.name)

    // Convert persona image to base64
    const personaImageBase64 = await convertToDataUrl(personaImage)

    // Generate script using AI
    const script = await generateUGCScript({
      personaImageBase64,
      productImageUrl: product.image_url,
      productName: product.name,
      painPoint: painPoint.trim(),
      context: context?.trim() || undefined,
      tone: tone as "natural_friendly" | "energetic" | "serious",
    })

    console.log("Script generated successfully:", script.project_summary)

    // Save to database
    const scriptId = crypto.randomUUID()

    await sql`
      INSERT INTO scripts (
        id,
        product_id,
        persona_image_base64,
        product_name,
        pain_point,
        context,
        tone,
        project_summary,
        script_json,
        status,
        user_id
      ) VALUES (
        ${scriptId},
        ${product.id},
        ${personaImageBase64},
        ${product.name},
        ${painPoint.trim()},
        ${context?.trim() || null},
        ${tone},
        ${script.project_summary},
        ${JSON.stringify(script)},
        'complete',
        ${userId}
      )
    `

    console.log("Script saved to database with ID:", scriptId)

    return NextResponse.json<GenerateScriptResponse>({
      success: true,
      scriptId,
      script,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error generating script:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Script generation failed",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
