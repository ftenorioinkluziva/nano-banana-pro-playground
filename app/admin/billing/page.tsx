
import { db } from "@/db"
import { transactions } from "@/db/schema"
import { desc, eq, sql } from "drizzle-orm"
import { BillingDashboard } from "@/components/admin/billing-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminBillingPage() {
    // Fetch last 100 transactions with user details
    const recentTransactions = await db.query.transactions.findMany({
        orderBy: [desc(transactions.createdAt)],
        limit: 100,
        with: {
            user: {
                columns: {
                    name: true,
                    email: true,
                }
            }
        }
    })

    // Calculate aggregated stats (this might be heavy on large DBs, should be optimized later)
    // For now, we fetch all to sum, or use aggregate queries

    // Aggregate queries for performance
    const usageStats = await db
        .select({
            totalUsed: sql<number>`sum(case when ${transactions.amount} < 0 then abs(${transactions.amount}) else 0 end)`,
            totalPurchased: sql<number>`sum(case when ${transactions.type} = 'purchase' then ${transactions.amount} else 0 end)`
        })
        .from(transactions)

    const stats = usageStats[0] || { totalUsed: 0, totalPurchased: 0 }

    return (
        <BillingDashboard
            transactions={recentTransactions as any}
            totalCreditsUsed={Number(stats.totalUsed) || 0}
            totalCreditsPurchased={Number(stats.totalPurchased) || 0}
            totalRevenueEstimated={0} // Not tracking revenue directly yet
        />
    )
}
