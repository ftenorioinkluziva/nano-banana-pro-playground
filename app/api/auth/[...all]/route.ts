import { NextResponse } from "next/server"

let authHandler: any = null
let authError: any = null

try {
    const { auth } = require("@/lib/auth")
    const { toNextJsHandler } = require("better-auth/next-js")
    authHandler = toNextJsHandler(auth)
} catch (error) {
    authError = error
    console.error("Error initializing Better Auth:", error)
}

export async function GET(request: Request) {
    if (authError) {
        return NextResponse.json(
            { error: "Auth initialization failed", details: authError.message },
            { status: 500 }
        )
    }

    if (authHandler?.GET) {
        return authHandler.GET(request)
    }

    return NextResponse.json({ error: "Auth handler not initialized" }, { status: 500 })
}

export async function POST(request: Request) {
    if (authError) {
        return NextResponse.json(
            { error: "Auth initialization failed", details: authError.message },
            { status: 500 }
        )
    }

    if (authHandler?.POST) {
        return authHandler.POST(request)
    }

    return NextResponse.json({ error: "Auth handler not initialized" }, { status: 500 })
}
