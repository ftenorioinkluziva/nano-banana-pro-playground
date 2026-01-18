import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "@/db/schema"

// Singleton pattern for Drizzle client
let drizzleClient: ReturnType<typeof drizzle> | null = null

export function getDrizzleClient() {
  if (!drizzleClient) {
    const sql = neon(process.env.DATABASE_URL!)
    drizzleClient = drizzle(sql, { schema })
  }
  return drizzleClient
}

// Keep existing neon() helper for backward compatibility
export function getNeonClient() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return neon(dbUrl)
}
