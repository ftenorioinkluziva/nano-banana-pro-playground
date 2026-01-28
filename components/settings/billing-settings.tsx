
"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Zap } from "lucide-react"
import { toast } from "sonner"
import { useCredits } from "@/hooks/use-credits"

export function BillingSettings() {
    const { credits, isLoading, refreshCredits } = useCredits()
    const searchParams = useSearchParams()
    const [isPurchasing, setIsPurchasing] = useState(false)

    useEffect(() => {
        if (searchParams.get("success")) {
            toast.success("Credits added successfully!")
            refreshCredits()
        }
        if (searchParams.get("canceled")) {
            toast.error("Purchase canceled.")
        }
    }, [searchParams, refreshCredits])

    const handlePurchase = async () => {
        setIsPurchasing(true)
        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    creditAmount: 1000,
                    // priceId: "optional-if-env-set"
                }),
            })
            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                toast.error("Failed to start checkout")
                setIsPurchasing(false)
            }
        } catch (error) {
            toast.error("An error occurred")
            setIsPurchasing(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Balance Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        Current Balance
                    </CardTitle>
                    <CardDescription>Your available credits for generation</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold mb-4">
                        {isLoading ? "..." : (credits ?? 0).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                        ~ {credits ? Math.floor(credits / 5) : 0} Images or {credits ? Math.floor(credits / 50) : 0} Videos
                    </p>
                </CardContent>
            </Card>

            {/* Purchase Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-400" />
                        Top Up
                    </CardTitle>
                    <CardDescription>Purchase more credits to keep creating</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border p-4 rounded-lg bg-secondary/50">
                        <div>
                            <span className="font-bold text-lg">Creato Pack</span>
                            <p className="text-xs text-muted-foreground">1000 Credits • Best Value</p>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-lg">R$ 49.90</span>
                        </div>
                    </div>
                    <Button
                        onClick={handlePurchase}
                        className="w-full"
                        disabled={isPurchasing}
                    >
                        {isPurchasing ? "Processing..." : "Purchase Package"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
