import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const userId = session.user.id
    const { id } = await params

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
      UPDATE brands
      SET name = ${name}, tone = ${tone || null}, description = ${description || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(id)} AND (user_id = ${userId} OR user_id IS NULL)
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Brand not found or not owned by user" },
        { status: 404 }
      )
    }

    return NextResponse.json({ brand: result[0] }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error updating brand:", error)

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const userId = session.user.id
    const { id } = await params

    const sql = getNeonClient()

    const result = await sql`
      DELETE FROM brands
      WHERE id = ${Number(id)} AND (user_id = ${userId} OR user_id IS NULL)
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Brand not found or not owned by user" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error deleting brand:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
