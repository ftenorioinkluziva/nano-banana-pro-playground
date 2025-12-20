import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return dbUrl;
};

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, completed, failed
    const productId = searchParams.get("productId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const sql = neon(getDatabaseUrl());

    // Map status values from frontend to database
    const statusMap: Record<string, string> = {
      pending: "loading",
      completed: "complete",
      failed: "error",
    };

    const dbStatus = status ? statusMap[status] || status : null;

    // Build query with JOINs
    let query;
    if (dbStatus && productId) {
      query = sql`
        SELECT
          v.id,
          v.video_url,
          v.video_uri,
          v.prompt,
          v.enhanced_prompt,
          v.original_user_request as visual_setting,
          v.status,
          v.model as ai_model,
          v.task_id as batch_id,
          v.created_at,
          v.updated_at,
          v.product_id,
          p.name as product_name,
          p.image_url as thumbnail_url,
          c.label as capability_label,
          c.description as capability_description
        FROM videos v
        LEFT JOIN products p ON v.product_id = p.id
        LEFT JOIN capabilities c ON v.capability_id = c.id
        WHERE v.product_id IS NOT NULL
          AND v.deleted_at IS NULL
          AND v.status = ${dbStatus}
          AND v.product_id = ${parseInt(productId)}
        ORDER BY v.created_at DESC
        LIMIT ${limit}
      `;
    } else if (dbStatus) {
      query = sql`
        SELECT
          v.id,
          v.video_url,
          v.video_uri,
          v.prompt,
          v.enhanced_prompt,
          v.original_user_request as visual_setting,
          v.status,
          v.model as ai_model,
          v.task_id as batch_id,
          v.created_at,
          v.updated_at,
          v.product_id,
          p.name as product_name,
          p.image_url as thumbnail_url,
          c.label as capability_label,
          c.description as capability_description
        FROM videos v
        LEFT JOIN products p ON v.product_id = p.id
        LEFT JOIN capabilities c ON v.capability_id = c.id
        WHERE v.product_id IS NOT NULL
          AND v.deleted_at IS NULL
          AND v.status = ${dbStatus}
        ORDER BY v.created_at DESC
        LIMIT ${limit}
      `;
    } else if (productId) {
      query = sql`
        SELECT
          v.id,
          v.video_url,
          v.video_uri,
          v.prompt,
          v.enhanced_prompt,
          v.original_user_request as visual_setting,
          v.status,
          v.model as ai_model,
          v.task_id as batch_id,
          v.created_at,
          v.updated_at,
          v.product_id,
          p.name as product_name,
          p.image_url as thumbnail_url,
          c.label as capability_label,
          c.description as capability_description
        FROM videos v
        LEFT JOIN products p ON v.product_id = p.id
        LEFT JOIN capabilities c ON v.capability_id = c.id
        WHERE v.product_id IS NOT NULL
          AND v.deleted_at IS NULL
          AND v.product_id = ${parseInt(productId)}
        ORDER BY v.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      query = sql`
        SELECT
          v.id,
          v.video_url,
          v.video_uri,
          v.prompt,
          v.enhanced_prompt,
          v.original_user_request as visual_setting,
          v.status,
          v.model as ai_model,
          v.task_id as batch_id,
          v.created_at,
          v.updated_at,
          v.product_id,
          p.name as product_name,
          p.image_url as thumbnail_url,
          c.label as capability_label,
          c.description as capability_description
        FROM videos v
        LEFT JOIN products p ON v.product_id = p.id
        LEFT JOIN capabilities c ON v.capability_id = c.id
        WHERE v.product_id IS NOT NULL
          AND v.deleted_at IS NULL
        ORDER BY v.created_at DESC
        LIMIT ${limit}
      `;
    }

    const generations = await query;

    // Map status back to frontend format
    const mappedGenerations = generations.map((gen: any) => ({
      ...gen,
      status: gen.status === "loading" ? "pending" : gen.status === "complete" ? "completed" : gen.status === "error" ? "failed" : gen.status,
    }));

    return NextResponse.json({
      success: true,
      data: mappedGenerations,
      count: mappedGenerations.length,
    });
  } catch (error: any) {
    console.error("Error fetching UGC generations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch generations" },
      { status: 500 }
    );
  }
}
