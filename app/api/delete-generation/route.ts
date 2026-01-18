import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export const dynamic = "force-dynamic"

interface ErrorResponse {
  error: string
  details?: string
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const searchParams = request.nextUrl.searchParams
    const generationId = searchParams.get("id") as string | null

    if (!generationId) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Missing required parameter",
          details: "id query parameter is required",
        },
        { status: 400 },
      )
    }

    const sql = getNeonClient()

    // Soft delete - mark as deleted instead of removing, but only if owned by user
    const result = await sql`
      UPDATE generations
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${generationId}
      AND user_id = ${userId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Generation not found or you don't have permission to delete it",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      generationId,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error deleting generation:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to delete generation",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
