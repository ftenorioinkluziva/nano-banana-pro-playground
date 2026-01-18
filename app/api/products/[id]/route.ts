import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // REQUIRE AUTHENTICATION
    const session = await requireAuth()
    const userId = session.user.id

    const { id } = await params

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      )
    }

    // GET DATABASE CONNECTION
    const sql = getNeonClient()

    // DELETE PRODUCT - VALIDATE OWNERSHIP
    const result = await sql`
      DELETE FROM products
      WHERE id = ${Number(id)} AND user_id = ${userId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Product not found or you don't have permission to delete it" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting product:", error)

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // REQUIRE AUTHENTICATION
    const session = await requireAuth()
    const userId = session.user.id

    const { id } = await params

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      )
    }

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

    // UPDATE PRODUCT - VALIDATE OWNERSHIP
    const result = await sql`
      UPDATE products
      SET
        name = ${name},
        slug = ${slug || null},
        price = ${price ? parseFloat(price) : null},
        category = ${category || null},
        format = ${format || null},
        quantity_label = ${quantity_label || null},
        description = ${description || null},
        usage_instructions = ${usage_instructions || null},
        contraindications = ${contraindications || null},
        ingredients = ${ingredients || null},
        benefits = ${parsedBenefits ? JSON.stringify(parsedBenefits) : null},
        nutritional_info = ${parsedNutritionalInfo ? JSON.stringify(parsedNutritionalInfo) : null},
        image_url = ${image_url || null},
        target_audience = ${target_audience || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(id)} AND user_id = ${userId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Product not found or you don't have permission to edit it" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        message: "Product updated successfully",
        product: result[0],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating product:", error)

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
