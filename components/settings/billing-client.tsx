"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useCredits } from "@/hooks/use-credits"
import { Check, X, Zap, CreditCard, History } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Transaction {
    id: string
    amount: number
    type: string
    description: string
    createdAt: string
}

export default function BillingClient() {
    const { credits, isLoading, refreshCredits } = useCredits()
    const searchParams = useSearchParams()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState(true)

    useEffect(() => {
        if (searchParams.get("success")) {
            toast.success("Credits added successfully!")
            refreshCredits()
        }
        if (searchParams.get("canceled")) {
            toast.error("Purchase canceled.")
        }
    }, [searchParams, refreshCredits])

    useEffect(() => {
        fetch("/api/user/transactions")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setTransactions(data)
                }
            })
            .catch((err) => console.error(err))
            .finally(() => setLoadingTransactions(false))
    }, [])

    const handlePurchase = async () => {
        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    creditAmount: 500,
                    // priceId: "optional-if-env-set"
                }),
            })
            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                toast.error("Failed to start checkout")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    return (
        <div className="container mx-auto py-10 px-4 space-y-8 max-w-5xl">
            <h1 className="text-3xl font-bold text-white">Billing & Credits</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Balance Card */}
                <Card className="bg-zinc-900 border-zinc-800 text-white">
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
                        <p className="text-sm text-zinc-400 mb-6">
                            ~ {credits ? Math.floor(credits / 5) : 0} Images or {credits ? Math.floor(credits / 50) : 0} Videos
                        </p>
                    </CardContent>
                </Card>

                {/* Purchase Card */}
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-400" />
                            Top Up
                        </CardTitle>
                        <CardDescription>Purchase more credits to keep creating</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border p-4 rounded-lg border-zinc-700 bg-zinc-800/50">
                            <div>
                                <span className="font-bold text-lg">Creato Pack</span>
                                <p className="text-xs text-zinc-400">500 Credits • Best Value</p>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-lg">R$ 50.00</span>
                            </div>
                        </div>
                        <Button onClick={handlePurchase} className="w-full bg-white text-black hover:bg-zinc-200">
                            Purchase Package
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions History */}
            <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Transaction History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-700 hover:bg-transparent">
                                <TableHead className="text-zinc-400">Date</TableHead>
                                <TableHead className="text-zinc-400">Description</TableHead>
                                <TableHead className="text-zinc-400 text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingTransactions ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
                                        Loading history...
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                        <TableCell className="font-mono text-xs text-zinc-400">
                                            {format(new Date(tx.createdAt), "MMM d, HH:mm")}
                                        </TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell className={cn(
                                            "text-right font-mono",
                                            tx.amount > 0 ? "text-green-400" : "text-red-400"
                                        )}>
                                            {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
