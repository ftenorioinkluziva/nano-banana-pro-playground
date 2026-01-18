import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export const dynamic = "force-dynamic"

interface SaveGenerationRequest {
  id: string
  prompt: string
  enhancedPrompt?: string
  mode: "text-to-image" | "image-editing"
  imageUrl: string
  imageUrls?: string[]
  aspectRatio?: string
  model?: string
  description?: string
}

interface ErrorResponse {
  error: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. REQUIRE AUTHENTICATION
    const session = await requireAuth()
    const userId = session.user.id

    const body = (await request.json()) as SaveGenerationRequest

    const {
      id,
      prompt,
      enhancedPrompt,
      mode,
      imageUrl,
      imageUrls,
      aspectRatio,
      model,
      description,
    } = body

    if (!id || !prompt || !mode || !imageUrl) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Missing required fields",
          details: "id, prompt, mode, and imageUrl are required",
        },
        { status: 400 },
      )
    }

    // 2. GET DATABASE CONNECTION
    const sql = getNeonClient()

    // 3. SAVE TO DATABASE WITH USER_ID
    // If imageUrls is already a string, parse it first, otherwise use as is
    const imageUrlsArray = imageUrls
      ? (typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls)
      : null

    const result = await sql`
      INSERT INTO generations (
        id,
        user_id,
        prompt,
        enhanced_prompt,
        mode,
        status,
        image_url,
        image_urls,
        aspect_ratio,
        model,
        description
      ) VALUES (
        ${id},
        ${userId},
        ${prompt},
        ${enhancedPrompt || null},
        ${mode},
        'complete',
        ${imageUrl},
        ${imageUrlsArray},
        ${aspectRatio || '1:1'},
        ${model || 'nano-banana-pro'},
        ${description || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, created_at
    `

    return NextResponse.json({
      success: true,
      generationId: id,
      createdAt: result[0].created_at,
    })
  } catch (error) {
    console.error("Error saving generation:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json<ErrorResponse>(
        { error: "Unauthorized", details: "Please log in to continue" },
        { status: 401 },
      )
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to save generation",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
