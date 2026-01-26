import { db } from "@/db"
import { user, transactions } from "@/db/schema"
import { eq, sql, and, gte } from "drizzle-orm"

/**
 * Check if a user has enough credits for an operation
 */
export async function checkCredits(userId: string, cost: number): Promise<boolean> {
    const userRecord = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: { credits: true },
    })

    if (!userRecord) return false
    return userRecord.credits >= cost
}

/**
 * Deduct credits from a user and record the transaction
 * Returns true if successful, false if insufficient funds
 */
export async function deductCredits(
    userId: string,
    amount: number,
    description: string
): Promise<boolean> {
    // Check balance logic (optimistic check, real check happens in update)
    // Note: Without robust transactions, we rely on the condition in the UPDATE clause

    // Attempt to deduct credits only if sufficient balance exists
    const [updatedUser] = await db
        .update(user)
        .set({
            credits: sql`${user.credits} - ${amount}`,
            updatedAt: new Date(),
        })
        .where(and(eq(user.id, userId), gte(user.credits, amount)))
        .returning({ id: user.id })

    if (!updatedUser) {
        return false
    }

    // Record transaction
    // If this fails, we technically have a data inconsistency vs credits,
    // but in serverless http mode we trade this risk for functionality.
    await db.insert(transactions).values({
        userId,
        amount: -amount, // Negative for spending
        type: "usage",
        description,
    })

    return true
}

/**
 * Add credits to a user (e.g. from purchase or admin grant)
 */
export async function addCredits(
    userId: string,
    amount: number,
    type: "purchase" | "bonus" | "refund" | "topup",
    description: string,
    stripePaymentId?: string
): Promise<void> {
    await db
        .update(user)
        .set({
            credits: sql`${user.credits} + ${amount}`,
            updatedAt: new Date(),
        })
        .where(eq(user.id, userId))

    await db.insert(transactions).values({
        userId,
        amount: amount,
        type,
        description,
        stripePaymentId,
    })
}
