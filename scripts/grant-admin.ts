
import { db } from "../db"
import { user } from "../db/schema"
import { eq } from "drizzle-orm"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function grantAdmin(userId: string) {
    if (!userId) {
        console.error("Please provide a user ID")
        process.exit(1)
    }

    console.log(`Granting admin role to user ${userId}...`)

    try {
        await db
            .update(user)
            .set({ role: "admin" })
            .where(eq(user.id, userId))

        console.log("✅ Successfully updated user role to admin")
    } catch (error) {
        console.error("❌ Error updating user role:", error)
    } finally {
        process.exit(0)
    }
}

const userId = process.argv[2]
grantAdmin(userId)
