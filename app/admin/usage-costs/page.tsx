
"use client"

import { UsageCostsEditor } from "@/components/admin/usage-costs-editor"

export default function UsageCostsPage() {
    return (
        <div className="container py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Usage Costs Configuration</h1>
                <p className="text-muted-foreground mt-2">
                    Manage credit costs for AI generations. These settings override the default compiled values.
                </p>
            </div>

            <UsageCostsEditor />
        </div>
    )
}
