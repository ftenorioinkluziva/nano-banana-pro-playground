
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Transaction = {
    id: number
    userId: string
    amount: number
    type: string
    description: string
    createdAt: Date
    user?: {
        name: string
        email: string
    }
}

interface BillingDashboardProps {
    transactions: Transaction[]
    totalCreditsUsed: number
    totalCreditsPurchased: number
    totalRevenueEstimated: number
}

export function BillingDashboard({
    transactions,
    totalCreditsUsed,
    totalCreditsPurchased,
    totalRevenueEstimated,
}: BillingDashboardProps) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Credits Used
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCreditsUsed.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Lifetime usage across all users
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Credits Purchased
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCreditsPurchased.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Total credits bought by users
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Net Flow
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(totalCreditsPurchased - totalCreditsUsed).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Outstanding credits in system
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{tx.user?.name || 'Unknown'}</span>
                                            <span className="text-xs text-muted-foreground">{tx.user?.email || tx.userId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={tx.amount > 0 ? "default" : "secondary"}>
                                            {tx.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={`font-mono ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                                    </TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
