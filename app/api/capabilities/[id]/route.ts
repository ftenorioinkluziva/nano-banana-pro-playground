import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return dbUrl
}

export const dynamic = "force-dynamic"

// GET single capability
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = neon(getDatabaseUrl())

    const result = await sql`
      SELECT
        id,
        label,
        description,
        icon_name,
        base_prompt_template,
        recommended_aspect_ratio,
        default_negative_prompt,
        generation_type,
        is_active,
        created_at,
        updated_at
      FROM capabilities
      WHERE id = ${id}
        AND deleted_at IS NULL
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Capability not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ capability: result[0] }, { status: 200 })
  } catch (error) {
    console.error("Error fetching capability:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// PUT update capability
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      label,
      description,
      icon_name,
      base_prompt_template,
      recommended_aspect_ratio,
      default_negative_prompt,
      generation_type,
      is_active,
    } = body

    const sql = neon(getDatabaseUrl())

    // Check if capability exists
    const existing = await sql`
      SELECT id FROM capabilities
      WHERE id = ${id} AND deleted_at IS NULL
    `

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Capability not found" },
        { status: 404 }
      )
    }

    // Update capability
    const result = await sql`
      UPDATE capabilities
      SET
        label = COALESCE(${label}, label),
        description = COALESCE(${description}, description),
        icon_name = COALESCE(${icon_name}, icon_name),
        base_prompt_template = COALESCE(${base_prompt_template}, base_prompt_template),
        recommended_aspect_ratio = COALESCE(${recommended_aspect_ratio}, recommended_aspect_ratio),
        default_negative_prompt = COALESCE(${default_negative_prompt}, default_negative_prompt),
        generation_type = COALESCE(${generation_type}, generation_type),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(
      { message: "Capability updated successfully", capability: result[0] },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating capability:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// DELETE capability (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = neon(getDatabaseUrl())

    // Check if capability exists
    const existing = await sql`
      SELECT id FROM capabilities
      WHERE id = ${id} AND deleted_at IS NULL
    `

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Capability not found" },
        { status: 404 }
      )
    }

    // Soft delete
    await sql`
      UPDATE capabilities
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    return NextResponse.json(
      { message: "Capability deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting capability:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
