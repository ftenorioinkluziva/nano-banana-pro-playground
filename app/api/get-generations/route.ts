import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export const dynamic = "force-dynamic"

interface ErrorResponse {
  error: string
  details?: string
}

export async function GET(request: NextRequest) {
  try {
    // 1. REQUIRE AUTHENTICATION
    const session = await requireAuth()
    const userId = session.user.id

    // 2. PARSE QUERY PARAMS
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    // 3. QUERY DATABASE - FILTERED BY USER_ID
    const sql = getNeonClient()

    let result
    if (limit === -1) {
      // Fetch ALL (no limit)
      result = await sql`
        SELECT
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
          description,
          created_at,
          updated_at
        FROM generations
        WHERE deleted_at IS NULL AND user_id = ${userId}
        ORDER BY created_at DESC
        OFFSET ${offset}
      `
    } else {
      // Fetch with LIMIT
      result = await sql`
        SELECT
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
          description,
          created_at,
          updated_at
        FROM generations
        WHERE deleted_at IS NULL AND user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    }

    return NextResponse.json({
      generations: result,
      total: result.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching generations:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json<ErrorResponse>(
        { error: "Unauthorized", details: "Please log in to continue" },
        { status: 401 },
      )
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to fetch generations",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
