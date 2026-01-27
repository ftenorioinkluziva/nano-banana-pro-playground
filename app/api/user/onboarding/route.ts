import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { user: currentUser } = await requireAuth()

        const userRecord = await db.query.user.findFirst({
            where: eq(user.id, currentUser.id),
            columns: { onboardingCompleted: true },
        })

        return NextResponse.json({ onboardingCompleted: userRecord?.onboardingCompleted ?? false })
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST() {
    try {
        const { user: currentUser } = await requireAuth()

        await db
            .update(user)
            .set({ onboardingCompleted: true, updatedAt: new Date() })
            .where(eq(user.id, currentUser.id))

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
