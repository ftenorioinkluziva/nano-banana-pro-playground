import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return dbUrl
}

interface SaveVideoRequest {
  id: string
  prompt: string
  negativePrompt?: string
  mode: string
  videoUri: string
  resolution: string
  aspectRatio: string
  duration?: string
  model?: string
}

interface ErrorResponse {
  error: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveVideoRequest

    const {
      id,
      prompt,
      negativePrompt,
      mode,
      videoUri,
      resolution,
      aspectRatio,
      duration,
      model,
    } = body

    if (!id || !prompt || !mode || !videoUri) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Missing required fields",
          details: "id, prompt, mode, and videoUri are required",
        },
        { status: 400 },
      )
    }

    // Import neon only when needed
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(getDatabaseUrl())

    // Save video generation metadata to database
    const result = await sql`
      INSERT INTO videos (
        id,
        prompt,
        negative_prompt,
        mode,
        status,
        video_uri,
        resolution,
        aspect_ratio,
        duration,
        model
      ) VALUES (
        ${id},
        ${prompt},
        ${negativePrompt || null},
        ${mode},
        'complete',
        ${videoUri},
        ${resolution},
        ${aspectRatio},
        ${duration || '6s'},
        ${model || 'veo-3.1-fast-generate-preview'}
      )
      ON CONFLICT (id) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, created_at
    `

    return NextResponse.json({
      success: true,
      videoId: id,
      createdAt: result[0].created_at,
    })
  } catch (error) {
    console.error("Error saving video:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to save video",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
