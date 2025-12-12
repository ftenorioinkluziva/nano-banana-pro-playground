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

export async function DELETE(request: NextRequest) {
  try {
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

    // Import neon only when needed
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(getDatabaseUrl())

    // Soft delete - mark as deleted instead of removing
    const result = await sql`
      UPDATE generations
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${generationId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Generation not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      generationId,
    })
  } catch (error) {
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
