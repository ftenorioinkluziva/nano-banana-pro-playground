import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

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
    const session = await requireAuth()
    const userId = session.user.id

    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get("product_id")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const sql = getNeonClient()

    let scripts

    if (productId) {
      // Filter by product and user
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
        AND s.user_id = ${userId}
        ORDER BY s.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else {
      // Get all scripts for the user
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
        WHERE s.user_id = ${userId}
        ORDER BY s.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    }

    // Get total count for the user
    const countResult = productId
      ? await sql`SELECT COUNT(*) as count FROM scripts WHERE product_id = ${parseInt(productId)} AND user_id = ${userId}`
      : await sql`SELECT COUNT(*) as count FROM scripts WHERE user_id = ${userId}`

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
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
