import { type NextRequest, NextResponse } from "next/server"
import type { ScriptOutput } from "@/lib/agents/script-generator"

export const dynamic = "force-dynamic"

interface UpdateScriptRequest {
  script_json: ScriptOutput
}

interface ErrorResponse {
  error: string
  details?: string
}

/**
 * PATCH /api/scripts/[id] - Update script JSON
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scriptId } = await params

    if (!scriptId) {
      return NextResponse.json<ErrorResponse>({ error: "Script ID is required" }, { status: 400 })
    }

    // Parse request body
    const body = (await request.json()) as UpdateScriptRequest

    if (!body.script_json) {
      return NextResponse.json<ErrorResponse>({ error: "script_json is required" }, { status: 400 })
    }

    // Validate script_json structure
    const script = body.script_json
    if (!script.project_summary || !script.scenes || !Array.isArray(script.scenes)) {
      return NextResponse.json<ErrorResponse>(
        { error: "Invalid script structure: missing project_summary or scenes" },
        { status: 400 },
      )
    }

    // Validate scenes
    for (const scene of script.scenes) {
      if (
        typeof scene.scene_id !== "number" ||
        !scene.type ||
        !scene.video_prompt_en ||
        !scene.audio_script_pt ||
        !scene.duration_seconds
      ) {
        return NextResponse.json<ErrorResponse>(
          { error: `Invalid scene structure in scene ${scene.scene_id}` },
          { status: 400 },
        )
      }
    }

    // Update database
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    const result = await sql`
      UPDATE scripts
      SET
        script_json = ${JSON.stringify(script)},
        project_summary = ${script.project_summary},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${scriptId}
      RETURNING id, product_id, product_name, pain_point, context, tone, project_summary, script_json, created_at, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json<ErrorResponse>({ error: "Script not found" }, { status: 404 })
    }

    console.log("Script updated successfully:", scriptId)

    return NextResponse.json({
      success: true,
      script: result[0],
    })
  } catch (error) {
    console.error("Error updating script:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to update script",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

/**
 * GET /api/scripts/[id] - Get script by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scriptId } = await params

    if (!scriptId) {
      return NextResponse.json<ErrorResponse>({ error: "Script ID is required" }, { status: 400 })
    }

    // Fetch from database
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    const result = await sql`
      SELECT
        id,
        product_id,
        product_name,
        pain_point,
        context,
        tone,
        project_summary,
        script_json,
        status,
        error_message,
        created_at,
        updated_at
      FROM scripts
      WHERE id = ${scriptId}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json<ErrorResponse>({ error: "Script not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      script: result[0],
    })
  } catch (error) {
    console.error("Error fetching script:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to fetch script",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/scripts/[id] - Delete script
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scriptId } = await params

    if (!scriptId) {
      return NextResponse.json<ErrorResponse>({ error: "Script ID is required" }, { status: 400 })
    }

    // Delete from database
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    const result = await sql`
      DELETE FROM scripts
      WHERE id = ${scriptId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json<ErrorResponse>({ error: "Script not found" }, { status: 404 })
    }

    console.log("Script deleted successfully:", scriptId)

    return NextResponse.json({
      success: true,
      deletedId: scriptId,
    })
  } catch (error) {
    console.error("Error deleting script:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to delete script",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
