
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react"

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

type Transaction = {
    id: string
    amount: number
    type: "purchase" | "topup" | "usage" | "bonus" | "refund"
    description: string
    createdAt: Date | null
}

interface TransactionHistoryProps {
    transactions: Transaction[]
    currentPage: number
    totalPages: number
}

export function TransactionHistory({ transactions, currentPage, totalPages }: TransactionHistoryProps) {
    // Helper to generate page numbers
    const getPageNumbers = () => {
        const pages = []
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                pages.push(i)
            } else if (
                (i === currentPage - 2 && i > 2) ||
                (i === currentPage + 2 && i < totalPages - 1)
            ) {
                pages.push("ellipsis") // Marker for ellipsis
            }
        }
        // Deduplicate ellipsis if adjacent logic fails (simplified here)
        return Array.from(new Set(pages))
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>History</CardTitle>
                <CardDescription>Credit transactions on your account.</CardDescription>
            </CardHeader>
            <CardContent>
                {transactions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        No transactions found.
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {tx.createdAt ? format(new Date(tx.createdAt), "MMM d, yyyy HH:mm") : "-"}
                                        </TableCell>
                                        <TableCell className="font-medium">{tx.description}</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.amount > 0 ? "outline" : "secondary"} className="text-xs capitalize">
                                                {tx.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-mono ${tx.amount > 0 ? "text-green-500" : "text-zinc-500"}`}>
                                            <div className="flex items-center justify-end gap-1">
                                                {tx.amount > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                                {Math.abs(tx.amount)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {totalPages > 1 && (
                            <div className="mt-4">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href={currentPage > 1 ? `?page=${currentPage - 1}` : undefined}
                                                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>

                                        {getPageNumbers().map((page, idx) => (
                                            <PaginationItem key={idx}>
                                                {page === "ellipsis" ? (
                                                    <PaginationEllipsis />
                                                ) : (
                                                    <PaginationLink
                                                        href={`?page=${page}`}
                                                        isActive={page === currentPage}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                href={currentPage < totalPages ? `?page=${currentPage + 1}` : undefined}
                                                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
