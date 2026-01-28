import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export const dynamic = "force-dynamic"

interface DeleteVideoRequest {
  videoId: string
}

interface ErrorResponse {
  error: string
  details?: string
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const body = (await request.json()) as DeleteVideoRequest
    const { videoId } = body

    if (!videoId) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Missing required field",
          details: "videoId is required",
        },
        { status: 400 },
      )
    }

    const sql = getNeonClient()

    // Soft delete by setting deleted_at timestamp, but only if owned by user
    const result = await sql`
      UPDATE generations
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${videoId}
      AND user_id = ${userId}
      RETURNING id
    `

    if (!result || result.length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Video not found or you don't have permission to delete it",
          details: `No video found with id: ${videoId} or insufficient permissions`,
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      videoId: videoId,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error deleting video:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to delete video",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
