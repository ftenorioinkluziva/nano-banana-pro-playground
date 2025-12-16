import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return dbUrl
}

interface VideoRecord {
  id: string
  prompt: string
  negative_prompt: string | null
  mode: string
  status: string
  video_uri: string | null
  video_url: string | null
  task_id: string | null
  resolution: string
  aspect_ratio: string
  duration: string
  model: string
  error_message: string | null
  created_at: string
  updated_at: string
}

interface ErrorResponse {
  error: string
  details?: string
}

export async function GET(request: NextRequest) {
  try {
    // Import neon only when needed
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(getDatabaseUrl())

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Fetch videos from database, ordered by most recent first
    const videos = await sql<VideoRecord[]>`
      SELECT
        id,
        prompt,
        negative_prompt,
        mode,
        status,
        video_uri,
        video_url,
        task_id,
        resolution,
        aspect_ratio,
        duration,
        model,
        error_message,
        created_at,
        updated_at
      FROM videos
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM videos
      WHERE deleted_at IS NULL
    `

    const total = parseInt(countResult[0].total as string)

    return NextResponse.json({
      videos: videos,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error("Error fetching videos:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to fetch videos",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
