
import { requireRole } from "@/lib/auth-session"
import { redirect } from "next/navigation"


export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    try {
        await requireRole(["admin"])
    } catch (error) {
        redirect("/")
    }

    return (
        <div className="flex min-h-screen flex-col">
            <div className="border-b bg-muted/40 p-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-semibold">Admin Dashboard</h1>
                    <nav className="flex gap-4 text-sm">
                        <a href="/admin/billing" className="hover:underline">Usage Logs</a>

                        {/* Add more links here */}
                    </nav>
                </div>
            </div>
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    )
}
