import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface ErrorResponse {
  error: string
  details?: string
}

/**
 * GET /api/scripts/[id]/videos
 * Returns all videos generated for scenes in a specific script
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scriptId } = await params

    if (!scriptId) {
      return NextResponse.json<ErrorResponse>(
        { error: "Missing scriptId" },
        { status: 400 }
      )
    }

    // Initialize database connection
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    // Fetch all videos for this script, ordered by scene_id
    const videos = await sql`
      SELECT
        id,
        script_id,
        scene_id,
        video_url,
        video_base64,
        task_id,
        prompt_used,
        model,
        aspect_ratio,
        resolution,
        duration,
        mode,
        status,
        error_message,
        created_at,
        updated_at,
        completed_at
      FROM scene_videos
      WHERE script_id = ${scriptId}
      ORDER BY scene_id ASC
    `

    return NextResponse.json({
      success: true,
      videos: videos,
      count: videos.length
    })

  } catch (error) {
    console.error("Error fetching scene videos:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to fetch scene videos",
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
