import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return dbUrl
}

interface DeleteVideoRequest {
  videoId: string
}

interface ErrorResponse {
  error: string
  details?: string
}

export async function DELETE(request: NextRequest) {
  try {
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

    // Import neon only when needed
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(getDatabaseUrl())

    // Soft delete by setting deleted_at timestamp
    const result = await sql`
      UPDATE videos
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${videoId}
      RETURNING id
    `

    if (!result || result.length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Video not found",
          details: `No video found with id: ${videoId}`,
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      videoId: videoId,
    })
  } catch (error) {
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
