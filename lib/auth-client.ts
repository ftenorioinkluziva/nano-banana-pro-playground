"use client"

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL + "/api/auth" :
    (typeof window !== "undefined" ? window.location.origin + "/api/auth" : "http://localhost:3000/api/auth"),
})

export const { useSession, signIn, signOut, signUp } = authClient
