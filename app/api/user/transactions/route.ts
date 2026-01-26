import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { db } from "@/db"
import { transactions } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const sessionUser = await requireAuth()

        const history = await db.query.transactions.findMany({
            where: eq(transactions.userId, sessionUser.id),
            orderBy: [desc(transactions.createdAt)],
            limit: 50,
        })

        return NextResponse.json(history)
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
