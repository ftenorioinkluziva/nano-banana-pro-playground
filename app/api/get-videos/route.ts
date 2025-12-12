import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return dbUrl
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

    // Get all videos ordered by creation date (newest first)
    const videos = await sql`
      SELECT
        id,
        prompt,
        negative_prompt,
        mode,
        status,
        video_uri,
        resolution,
        aspect_ratio,
        duration,
        model,
        created_at,
        updated_at
      FROM videos
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 100
    `

    return NextResponse.json({
      success: true,
      videos: videos,
      count: videos.length,
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
