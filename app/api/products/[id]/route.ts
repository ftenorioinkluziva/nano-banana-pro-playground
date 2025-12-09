import { NextRequest, NextResponse } from "next/server"

// Get database connection from environment variables
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return dbUrl
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      )
    }

    // Import postgres only when needed
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(getDatabaseUrl())

    // Delete product from database
    const result = await sql`
      DELETE FROM products
      WHERE id = ${Number(id)}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
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

    // Import postgres only when needed
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(getDatabaseUrl())

    // Update product in database
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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number(id)}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
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
