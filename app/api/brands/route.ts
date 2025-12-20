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

// GET all brands
export async function GET() {
  try {
    const sql = neon(getDatabaseUrl())

    const brands = await sql`
      SELECT id, name, tone, description, created_at
      FROM brands
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `

    return NextResponse.json({ brands }, { status: 200 })
  } catch (error) {
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
    const body = await request.json()
    const { name, tone, description } = body

    if (!name) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 }
      )
    }

    const sql = neon(getDatabaseUrl())

    const result = await sql`
      INSERT INTO brands (name, tone, description)
      VALUES (${name}, ${tone || null}, ${description || null})
      RETURNING *
    `

    return NextResponse.json(
      { message: "Brand created successfully", brand: result[0] },
      { status: 201 }
    )
  } catch (error) {
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
