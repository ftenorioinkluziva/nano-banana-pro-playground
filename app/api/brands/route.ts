import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET all brands
export async function GET() {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const sql = getNeonClient()

    const brands = await sql`
      SELECT id, name, tone, description, created_at
      FROM brands
      WHERE deleted_at IS NULL
      AND user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ brands }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error fetching brands:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST create brand
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const body = await request.json()
    const { name, tone, description } = body

    if (!name) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 }
      )
    }

    const sql = getNeonClient()

    const result = await sql`
      INSERT INTO brands (name, tone, description, user_id)
      VALUES (${name}, ${tone || null}, ${description || null}, ${userId})
      RETURNING *
    `

    return NextResponse.json(
      { message: "Brand created successfully", brand: result[0] },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error creating brand:", error)

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json(
        { error: "A brand with this name already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
