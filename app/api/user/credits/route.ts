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
            columns: { credits: true },
        })

        return NextResponse.json({ credits: userRecord?.credits || 0 })
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
