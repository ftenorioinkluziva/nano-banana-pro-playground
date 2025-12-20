import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface ErrorResponse {
  error: string
  details?: string
}

/**
 * GET /api/scripts - List all scripts with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get("product_id")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Fetch from database
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    let scripts

    if (productId) {
      // Filter by product
      scripts = await sql`
        SELECT
          s.id,
          s.product_id,
          s.product_name,
          s.pain_point,
          s.context,
          s.tone,
          s.project_summary,
          s.script_json,
          s.status,
          s.error_message,
          s.created_at,
          s.updated_at,
          p.image_url as product_image_url
        FROM scripts s
        LEFT JOIN products p ON s.product_id = p.id
        WHERE s.product_id = ${parseInt(productId)}
        ORDER BY s.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else {
      // Get all scripts
      scripts = await sql`
        SELECT
          s.id,
          s.product_id,
          s.product_name,
          s.pain_point,
          s.context,
          s.tone,
          s.project_summary,
          s.script_json,
          s.status,
          s.error_message,
          s.created_at,
          s.updated_at,
          p.image_url as product_image_url
        FROM scripts s
        LEFT JOIN products p ON s.product_id = p.id
        ORDER BY s.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    }

    // Get total count
    const countResult = productId
      ? await sql`SELECT COUNT(*) as count FROM scripts WHERE product_id = ${parseInt(productId)}`
      : await sql`SELECT COUNT(*) as count FROM scripts`

    const totalCount = parseInt(countResult[0].count)

    return NextResponse.json({
      success: true,
      scripts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error("Error fetching scripts:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to fetch scripts",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
