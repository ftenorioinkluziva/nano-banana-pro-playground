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
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)
    const userId = searchParams.get("userId") as string | null

    // Import neon only when needed
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(getDatabaseUrl())

    let result: any[]

    if (userId) {
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
    } else {
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
        WHERE deleted_at IS NULL
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
