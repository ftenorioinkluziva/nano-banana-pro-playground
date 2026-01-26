"use client"

import { useState } from "react"
import { BrandForm } from "@/components/brand-form"
import { BrandList } from "@/components/brand-list"
import { AppErrorBoundary } from "@/components/shared"
import { useLanguage } from "@/components/language-provider"

export interface Brand {
  id: number
  name: string
  tone: string | null
  description: string | null
  created_at: string
}

export default function BrandsPage() {
  const { t } = useLanguage()
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
    setEditingBrand(null)
  }

  const handleCancel = () => {
    setEditingBrand(null)
  }

  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex flex-col gap-1 mb-2">
            <h1 className="text-3xl font-bold text-white">{t.brands}</h1>
          </div>
          <BrandForm
            editingBrand={editingBrand}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
          <BrandList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </AppErrorBoundary>
  )
}
