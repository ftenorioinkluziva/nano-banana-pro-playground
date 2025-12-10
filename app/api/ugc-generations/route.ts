import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, completed, failed
    const productId = searchParams.get("productId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const sql = neon(process.env.DATABASE_URL!);

    let query = sql`
      SELECT * FROM ugc_generations
      WHERE 1=1
    `;

    // Build dynamic query based on filters
    if (status) {
      query = sql`
        SELECT * FROM ugc_generations
        WHERE status = ${status}
      `;
    }

    if (productId && status) {
      query = sql`
        SELECT * FROM ugc_generations
        WHERE status = ${status}
        AND product_id = ${parseInt(productId)}
      `;
    } else if (productId) {
      query = sql`
        SELECT * FROM ugc_generations
        WHERE product_id = ${parseInt(productId)}
      `;
    }

    // Add ordering and limit
    const generations = await sql`
      ${query}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({
      success: true,
      data: generations,
      count: generations.length
    });

  } catch (error: any) {
    console.error("Error fetching UGC generations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch generations" },
      { status: 500 }
    );
  }
}
