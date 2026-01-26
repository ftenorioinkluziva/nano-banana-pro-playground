"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "@/lib/auth-client"

export function useCredits() {
    const { data: session } = useSession()
    const [credits, setCredits] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const fetchCredits = useCallback(async () => {
        if (!session) return

        try {
            setIsLoading(true)
            const response = await fetch("/api/user/credits")
            if (response.ok) {
                const data = await response.json()
                setCredits(data.credits)
            }
        } catch (error) {
            console.error("Failed to fetch credits:", error)
        } finally {
            setIsLoading(false)
        }
    }, [session])

    useEffect(() => {
        fetchCredits()

        // Poll every 30 seconds to keep updated
        const interval = setInterval(fetchCredits, 30000)
        return () => clearInterval(interval)
    }, [fetchCredits])

    return { credits, isLoading, refreshCredits: fetchCredits }
}
