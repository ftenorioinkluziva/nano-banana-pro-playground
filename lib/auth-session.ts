import { cookies } from "next/headers"
import { auth } from "./auth"
import type { User } from "@/db/schema"

export async function getSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("better-auth.session_token")?.value

  if (!sessionToken) {
    return null
  }

  try {
    const session = await auth.api.getSession({
      headers: {
        cookie: `better-auth.session_token=${sessionToken}`,
      },
    })

    return session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  return session
}

export async function requireRole(allowedRoles: User["role"][]) {
  const session = await requireAuth()

  if (!allowedRoles.includes(session.user.role as User["role"])) {
    throw new Error("Forbidden: Insufficient permissions")
  }

  return session
}
