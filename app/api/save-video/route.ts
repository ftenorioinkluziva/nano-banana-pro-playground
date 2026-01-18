import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export const dynamic = "force-dynamic"

interface SaveVideoRequest {
  id: string
  prompt: string
  negativePrompt?: string
  mode: string
  videoUri: string
  taskId?: string
  resolution: string
  aspectRatio: string
  duration?: string
  model?: string
}

interface ErrorResponse {
  error: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. REQUIRE AUTHENTICATION
    const session = await requireAuth()
    const userId = session.user.id

    const body = (await request.json()) as SaveVideoRequest

    const {
      id,
      prompt,
      negativePrompt,
      mode,
      videoUri,
      taskId,
      resolution,
      aspectRatio,
      duration,
      model,
    } = body

    if (!id || !prompt || !mode || !videoUri) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Missing required fields",
          details: "id, prompt, mode, and videoUri are required",
        },
        { status: 400 },
      )
    }

    // 2. GET DATABASE CONNECTION
    const sql = getNeonClient()

    // 3. SAVE TO DATABASE WITH USER_ID
    const result = await sql`
      INSERT INTO videos (
        id,
        user_id,
        prompt,
        negative_prompt,
        mode,
        status,
        video_uri,
        task_id,
        resolution,
        aspect_ratio,
        duration,
        model
      ) VALUES (
        ${id},
        ${userId},
        ${prompt},
        ${negativePrompt || null},
        ${mode},
        'complete',
        ${videoUri},
        ${taskId || null},
        ${resolution},
        ${aspectRatio},
        ${duration || '6s'},
        ${model || 'veo3_fast'}
      )
      ON CONFLICT (id) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP,
        task_id = ${taskId || null}
      RETURNING id, created_at
    `

    return NextResponse.json({
      success: true,
      videoId: id,
      createdAt: result[0].created_at,
    })
  } catch (error) {
    console.error("Error saving video:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json<ErrorResponse>(
        { error: "Unauthorized", details: "Please log in to continue" },
        { status: 401 },
      )
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to save video",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
