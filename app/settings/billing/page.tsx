import { db } from "@/db"
import { transactions } from "@/db/schema"
import { desc, eq, count } from "drizzle-orm"
import { BillingSettings } from "@/components/settings/billing-settings"
import { TransactionHistory } from "@/components/settings/transaction-history"
import { requireAuth } from "@/lib/auth-session"

export const dynamic = "force-dynamic"

export default async function BillingPage(props: { searchParams?: Promise<{ page?: string }> }) {
    const { user } = await requireAuth()
    const searchParams = await props.searchParams
    const page = Number(searchParams?.page) || 1
    const limit = 20
    const offset = (page - 1) * limit

    // 1. Get total count
    const [countResult] = await db
        .select({ count: count() })
        .from(transactions)
        .where(eq(transactions.userId, user.id))

    const totalCount = countResult?.count ?? 0
    const totalPages = Math.ceil(totalCount / limit)

    // 2. Get paginated data
    const userTransactions = await db.query.transactions.findMany({
        where: eq(transactions.userId, user.id),
        orderBy: [desc(transactions.createdAt)],
        limit: limit,
        offset: offset
    })

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <h1 className="text-3xl font-bold mb-6">Billing & Credits</h1>

            <div className="grid gap-8">
                <BillingSettings />
                <TransactionHistory
                    transactions={userTransactions as any}
                    currentPage={page}
                    totalPages={totalPages}
                />
            </div>
        </div>
    )
}
