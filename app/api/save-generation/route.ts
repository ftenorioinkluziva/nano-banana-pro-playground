import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return dbUrl
}

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

    // Import neon only when needed
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(getDatabaseUrl())

    // Save generation metadata to database
    const result = await sql`
      INSERT INTO generations (
        id,
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
        ${prompt},
        ${enhancedPrompt || null},
        ${mode},
        'complete',
        ${imageUrl},
        ${imageUrls ? JSON.stringify(imageUrls) : null},
        ${aspectRatio || '1:1'},
        ${model || 'gemini-2.5-flash-image'},
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
