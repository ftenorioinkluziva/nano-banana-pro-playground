
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { systemSettings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireRole } from "@/lib/auth-session"
import { z } from "zod"

// Helper schema for model cost config (number or object)
const modelCostSchema = z.union([
    z.number().int().min(0),
    z.object({
        default: z.number().int().min(0),
    }).catchall(z.number().int().min(0)) // Allows any other keys string -> number
])

// Zod schema for validation
const usageCostsSchema = z.object({
    VIDEO: z.object({
        DEFAULT: z.number().int().min(0),
        MODELS: z.record(z.string(), modelCostSchema),
    }),
    IMAGE: z.object({
        DEFAULT: z.number().int().min(0),
        MODELS: z.record(z.string(), modelCostSchema),
    }),
    PROMPT_ENHANCEMENT: z.number().int().min(0),
})

export async function GET() {
    try {
        await requireRole(["admin"])

        const setting = await db.query.systemSettings.findFirst({
            where: eq(systemSettings.key, "usage_costs"),
        })

        if (!setting) {
            return NextResponse.json({ error: "Usage costs configuration not found" }, { status: 404 })
        }

        return NextResponse.json(setting.value)
    } catch (error) {
        if (error instanceof Error && error.message.includes("Forbidden")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        console.error("Error fetching usage costs:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireRole(["admin"])

        const body = await request.json()

        // Validate body
        const validationResult = usageCostsSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid configuration format", details: validationResult.error.format() },
                { status: 400 }
            )
        }

        const newCosts = validationResult.data

        await db
            .insert(systemSettings)
            .values({
                key: "usage_costs",
                value: newCosts,
                updatedAt: new Date()
            })
            .onConflictDoUpdate({
                target: systemSettings.key,
                set: {
                    value: newCosts,
                    updatedAt: new Date()
                }
            })

        return NextResponse.json({ success: true, data: newCosts })
    } catch (error) {
        if (error instanceof Error && error.message.includes("Forbidden")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        console.error("Error updating usage costs:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
