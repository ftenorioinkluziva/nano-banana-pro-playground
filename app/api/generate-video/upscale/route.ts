
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { KieAIService } from "@/lib/kieai-service"
import { USAGE_COSTS } from "@/lib/usage-costs"
import { checkCredits, deductCredits } from "@/lib/credits"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes timeout

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth()

        const body = await request.json()
        const { taskId, resolution } = body

        if (!taskId) {
            return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
        }

        if (resolution !== "1080p" && resolution !== "4k") {
            return NextResponse.json({ error: "Invalid resolution. Must be '1080p' or '4k'" }, { status: 400 })
        }

        // Determine cost
        let cost = 0
        if (resolution === "1080p") {
            const veoCost = USAGE_COSTS.VIDEO.MODELS["veo"]
            if (typeof veoCost !== 'number') {
                cost = (veoCost as any)["1080p"] || 5
            } else {
                cost = 5
            }
        } else if (resolution === "4k") {
            const veoCost = USAGE_COSTS.VIDEO.MODELS["veo"]
            if (typeof veoCost !== 'number') {
                cost = (veoCost as any)["4k"] || 120
            } else {
                cost = 120
            }
        }

        const hasCredits = await checkCredits(user.id, cost)
        if (!hasCredits) {
            return NextResponse.json({
                error: "Insufficient credits",
                details: `You need ${cost} credits to upscale to ${resolution}.`
            }, { status: 402 })
        }

        const kieApiKey = process.env.KIEAI_API_KEY
        if (!kieApiKey) {
            return NextResponse.json({ error: "KIE.AI API key not configured" }, { status: 500 })
        }

        const kieService = new KieAIService(kieApiKey)

        // Deduct credits before starting
        await deductCredits(user.id, cost, `${resolution} video upscale`)

        try {
            let result
            if (resolution === "1080p") {
                result = await kieService.get1080pVideoWithPolling(taskId)
            } else {
                result = await kieService.get4kVideoWithPolling(taskId)
            }

            return NextResponse.json({
                success: true,
                videoUrl: result.videoUrl,
                taskId: result.taskId,
                creditsDeducted: cost
            })

        } catch (error: any) {
            console.error("Upscale failed:", error)
            // Ideally refund credits here, but keeping it simple for now
            return NextResponse.json({
                error: "Upscale failed",
                details: error.message
            }, { status: 500 })
        }

    } catch (error: any) {
        console.error("API Error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
