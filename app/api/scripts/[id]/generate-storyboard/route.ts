
import { type NextRequest, NextResponse } from "next/server"
import { KieAIService } from "@/lib/kieai-service"
import type { ScriptOutput } from "@/lib/agents/script-generator"
import { checkCredits, deductCredits } from "@/lib/credits"
import { USAGE_COSTS } from "@/lib/usage-costs"

export const dynamic = "force-dynamic"
export const maxDuration = 600 // 10 minutes for video generation

const FILE_UPLOAD_ENDPOINT = "https://kieai.redpandaai.co/api/file-base64-upload"

interface KieFileUploadResponse {
    success: boolean
    code: number
    msg: string
    data?: {
        fileName: string
        filePath: string
        downloadUrl: string
    }
}

async function uploadBase64Image(base64Data: string, apiKey: string): Promise<string> {
    const response = await fetch(FILE_UPLOAD_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            base64Data,
            uploadPath: "videos/images",
        }),
    })

    if (!response.ok) throw new Error("Failed to upload image")
    const data: KieFileUploadResponse = await response.json()
    if (!data.success || !data.data?.downloadUrl) throw new Error(data.msg || "Upload failed")
    return data.data.downloadUrl
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: scriptId } = await params
        const body = await request.json() // Optional: override options

        // Check API Key
        const kieApiKey = process.env.KIEAI_API_KEY
        if (!kieApiKey) {
            return NextResponse.json({ error: "KIE.AI API key not configured" }, { status: 500 })
        }

        // DB Connection
        const { neon } = await import("@neondatabase/serverless")
        const sql = neon(process.env.DATABASE_URL!)

        // Fetch Script
        const scripts = await sql`
      SELECT id, user_id, script_json, persona_image_base64
      FROM scripts
      WHERE id = ${scriptId}
    `

        if (!scripts || scripts.length === 0) {
            return NextResponse.json({ error: "Script not found" }, { status: 404 })
        }

        const script = scripts[0]
        const scriptData = script.script_json as ScriptOutput
        const userId = script.user_id

        // Check existing full video (scene_id = 0)
        const existing = await sql`
        SELECT * FROM scene_videos 
        WHERE script_id = ${scriptId} AND scene_id = 0 
        AND status IN ('generating', 'complete')
    `
        if (existing.length > 0) {
            return NextResponse.json({ success: true, sceneVideo: existing[0], message: "Video already exists" })
        }

        // Determine duration and cost
        const totalDuration = scriptData.scenes.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
        let soraDuration = "10"
        let cost = 150

        if (totalDuration > 10) {
            soraDuration = "25" // Support up to 25s
            cost = 270
        }

        // Check credits
        const hasCredits = await checkCredits(userId, cost)
        if (!hasCredits) {
            return NextResponse.json({ error: `Insufficient credits. Needed: ${cost}` }, { status: 402 })
        }

        // Prepare Storyboard Payload
        // Upload persona image once
        let personaUrl = ""
        try {
            personaUrl = await uploadBase64Image(script.persona_image_base64, kieApiKey)
        } catch (e) {
            console.error("Failed to upload persona", e)
            return NextResponse.json({ error: "Failed to upload persona image" }, { status: 500 })
        }

        const storyboard = scriptData.scenes.map(scene => ({
            prompt: scene.video_prompt_en,
            duration: `${scene.duration_seconds}s`,
            img_url: personaUrl // Use persona as reference for each scene to maintain consistency
        }))

        // Deduct credits
        await deductCredits(userId, cost, `Sora Storyboard Video (${soraDuration}s)`)

        // Create DB Record
        const videoId = crypto.randomUUID()
        await sql`
      INSERT INTO scene_videos (
        id, script_id, scene_id,
        prompt_used, model, aspect_ratio, resolution, duration, mode,
        status
      ) VALUES (
        ${videoId}, ${scriptId}, 0,
        ${"Storyboard Generation"}, ${"sora-2-pro-storyboard"}, ${"9:16"},
        ${"720p"}, ${soraDuration + "s"}, ${"STORYBOARD"},
        'generating'
      )
    `

        // Call API
        try {
            const kieService = new KieAIService(kieApiKey)
            const result = await kieService.generateWithWan26AndPoll(
                {
                    model: "sora-2-pro-storyboard",
                    prompt: "Generate a storyboard video", // Fallback, storyboard param used mainly
                    duration: soraDuration, // "10" or "25"
                    resolution: "high", // Default to high for storyboard
                    storyboard: storyboard
                },
                {
                    maxAttempts: 120, // 20 mins
                    pollInterval: 10000
                }
            )

            // Download video as base64
            const videoBase64 = await kieService.downloadVideoAsBase64(result.videoUrl)

            await sql`
            UPDATE scene_videos
            SET
              video_url = ${result.videoUrl},
              video_base64 = ${videoBase64},
              task_id = ${result.taskId},
              status = 'complete',
              completed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ${videoId}
        `

            return NextResponse.json({
                success: true,
                sceneVideo: {
                    id: videoId,
                    status: "complete",
                    video_url: result.videoUrl
                }
            })

        } catch (error: any) {
            console.error("Storyboard Error:", error)
            // Mark as error
            await sql`UPDATE scene_videos SET status = 'error', error_message = ${error.message} WHERE id = ${videoId}`

            // Ideally refund here
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

    } catch (error: any) {
        console.error("Route Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
