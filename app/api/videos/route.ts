import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export const dynamic = "force-dynamic"

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
    // 1. REQUIRE AUTHENTICATION
    const session = await requireAuth()
    const userId = session.user.id

    // 2. GET DATABASE CONNECTION
    const sql = getNeonClient()

    // 3. GET QUERY PARAMETERS
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // 4. FETCH VIDEOS - FILTERED BY USER_ID
    const videos = await sql<VideoRecord[]>`
      SELECT
        id,
        prompt,
        NULL as negative_prompt, 
        mode,
        status,
        NULL as video_uri, 
        video_url,
        task_id,
        resolution,
        aspect_ratio,
        duration,
        model,
        error_message,
        created_at,
        updated_at
      FROM generations
      WHERE deleted_at IS NULL AND user_id = ${userId} AND type = 'VIDEO'
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    console.log(`[GET /api/videos] Fetched ${videos.length} videos for user ${userId}`)
    if (videos.length === 0) {
      // Debug check: count ALL generations for user
      const allGens = await sql`SELECT count(*) as count, type FROM generations WHERE user_id = ${userId} GROUP BY type`
      console.log(`[GET /api/videos] Debug: User has generations:`, allGens)
    }

    // Get total count for this user
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM generations
      WHERE deleted_at IS NULL AND user_id = ${userId} AND type = 'VIDEO'
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

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json<ErrorResponse>(
        { error: "Unauthorized", details: "Please log in to continue" },
        { status: 401 },
      )
    }

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
