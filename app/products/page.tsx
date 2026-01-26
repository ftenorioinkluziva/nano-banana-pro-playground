"use client"

import { useState } from "react"
import { ProductForm } from "@/components/product-form"
import { ProductList } from "@/components/product-list"
import { AppErrorBoundary } from "@/components/shared"
import { useLanguage } from "@/components/language-provider"

interface Product {
  id: number
  name: string
  description: string | null
  image_url: string | null
  target_audience: string | null
  brand_id: number | null
}

export default function ProductsPage() {
  const { t } = useLanguage()
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
    setEditingProduct(null)
  }

  const handleCancel = () => {
    setEditingProduct(null)
  }

  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex flex-col gap-1 mb-2">
            <h1 className="text-3xl font-bold text-white">{t.products}</h1>
          </div>
          <ProductForm
            editingProduct={editingProduct}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
          <ProductList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </AppErrorBoundary>
  )
}
