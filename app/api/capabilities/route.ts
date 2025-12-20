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

// GET all capabilities (incluindo inativas para admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get("includeInactive") === "true"

    const sql = neon(getDatabaseUrl())

    const capabilities = includeInactive
      ? await sql`
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
          WHERE deleted_at IS NULL
          ORDER BY created_at ASC
        `
      : await sql`
          SELECT
            id,
            label,
            description,
            icon_name,
            recommended_aspect_ratio,
            generation_type,
            is_active
          FROM capabilities
          WHERE is_active = true
            AND deleted_at IS NULL
          ORDER BY created_at ASC
        `

    return NextResponse.json({ capabilities }, { status: 200 })
  } catch (error) {
    console.error("Error fetching capabilities:", error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

// POST create new capability
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      label,
      description,
      icon_name,
      base_prompt_template,
      recommended_aspect_ratio,
      default_negative_prompt,
      generation_type,
    } = body

    if (!id || !label || !base_prompt_template) {
      return NextResponse.json(
        { error: "id, label, and base_prompt_template are required" },
        { status: 400 }
      )
    }

    const sql = neon(getDatabaseUrl())

    const result = await sql`
      INSERT INTO capabilities (
        id,
        label,
        description,
        icon_name,
        base_prompt_template,
        recommended_aspect_ratio,
        default_negative_prompt,
        generation_type,
        is_active
      ) VALUES (
        ${id},
        ${label},
        ${description || ""},
        ${icon_name || "video"},
        ${base_prompt_template},
        ${recommended_aspect_ratio || "9:16"},
        ${default_negative_prompt || null},
        ${generation_type || "TEXT_2_VIDEO"},
        true
      )
      RETURNING *
    `

    return NextResponse.json(
      { message: "Capability created successfully", capability: result[0] },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating capability:", error)

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json(
        { error: "A capability with this ID already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
