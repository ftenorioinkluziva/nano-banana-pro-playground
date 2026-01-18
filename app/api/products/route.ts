import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // REQUIRE AUTHENTICATION
    const session = await requireAuth()
    const userId = session.user.id

    const body = await request.json()

    const {
      name,
      slug,
      price,
      category,
      format,
      quantity_label,
      description,
      usage_instructions,
      contraindications,
      ingredients,
      benefits,
      nutritional_info,
      image_url,
      target_audience,
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      )
    }

    // Parse JSON fields if they are strings
    let parsedBenefits = null
    let parsedNutritionalInfo = null

    if (benefits && typeof benefits === "string" && benefits.trim()) {
      try {
        parsedBenefits = JSON.parse(benefits)
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid JSON format for benefits" },
          { status: 400 }
        )
      }
    } else if (benefits && typeof benefits === "object") {
      parsedBenefits = benefits
    }

    if (nutritional_info && typeof nutritional_info === "string" && nutritional_info.trim()) {
      try {
        parsedNutritionalInfo = JSON.parse(nutritional_info)
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid JSON format for nutritional_info" },
          { status: 400 }
        )
      }
    } else if (nutritional_info && typeof nutritional_info === "object") {
      parsedNutritionalInfo = nutritional_info
    }

    // GET DATABASE CONNECTION
    const sql = getNeonClient()

    // INSERT PRODUCT WITH USER_ID
    const result = await sql`
      INSERT INTO products (
        user_id,
        name,
        slug,
        price,
        category,
        format,
        quantity_label,
        description,
        usage_instructions,
        contraindications,
        ingredients,
        benefits,
        nutritional_info,
        image_url,
        target_audience
      ) VALUES (
        ${userId},
        ${name},
        ${slug || null},
        ${price ? parseFloat(price) : null},
        ${category || null},
        ${format || null},
        ${quantity_label || null},
        ${description || null},
        ${usage_instructions || null},
        ${contraindications || null},
        ${ingredients || null},
        ${parsedBenefits ? JSON.stringify(parsedBenefits) : null},
        ${parsedNutritionalInfo ? JSON.stringify(parsedNutritionalInfo) : null},
        ${image_url || null},
        ${target_audience || null}
      )
      RETURNING *
    `

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: result[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating product:", error)

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Unauthorized", details: "Please log in to continue" },
          { status: 401 }
        )
      }

      // Handle unique constraint violations
      if (error.message.includes("duplicate key") && error.message.includes("slug")) {
        return NextResponse.json(
          { error: "A product with this slug already exists" },
          { status: 409 }
        )
      }

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

export async function GET(request: NextRequest) {
  try {
    // REQUIRE AUTHENTICATION
    const session = await requireAuth()
    const userId = session.user.id

    // GET DATABASE CONNECTION
    const sql = getNeonClient()

    // GET PRODUCTS - FILTERED BY USER_ID
    const products = await sql`
      SELECT * FROM products
      WHERE is_active = true AND user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ products }, { status: 200 })
  } catch (error) {
    console.error("Error fetching products:", error)

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Unauthorized", details: "Please log in to continue" },
          { status: 401 }
        )
      }

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
