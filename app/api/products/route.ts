import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const body = await request.json()
    const { name, description, image_url, target_audience, brand_id } = body

    if (!name || !description || !target_audience || !brand_id) {
      return NextResponse.json(
        { error: "Name, description, target_audience, and brand are required" },
        { status: 400 }
      )
    }

    const sql = getNeonClient()

    const result = await sql`
      INSERT INTO products (
        user_id,
        name,
        description,
        image_url,
        target_audience,
        brand_id
      ) VALUES (
        ${userId},
        ${name},
        ${description || null},
        ${image_url || null},
        ${target_audience || null},
        ${brand_id || null}
      )
      RETURNING *
    `

    return NextResponse.json(
      { message: "Product created successfully", product: result[0] },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating product:", error)

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const sql = getNeonClient()

    const products = await sql`
      SELECT
        p.id,
        p.name,
        p.description,
        p.image_url,
        p.target_audience,
        p.brand_id,
        p.is_active,
        p.created_at,
        b.name as brand_name,
        b.tone as brand_tone
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_active = true AND (p.user_id = ${userId} OR p.user_id IS NULL)
      ORDER BY p.created_at DESC
    `

    return NextResponse.json({ products }, { status: 200 })
  } catch (error) {
    console.error("Error fetching products:", error)

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
