"use client"

import { useState } from "react"
import { ProductForm } from "@/components/product-form"
import { ProductList } from "@/components/product-list"

interface Product {
  id: number
  name: string
  slug: string | null
  price: string | null
  category: string | null
  format: string | null
  quantity_label: string | null
  description: string | null
  usage_instructions: string | null
  contraindications: string | null
  ingredients: string | null
  benefits: any
  nutritional_info: any
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ProductsPage() {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSuccess = () => {
    // Refresh the list
    setRefreshTrigger((prev) => prev + 1)
    // Clear editing state
    setEditingProduct(null)
  }

  const handleCancel = () => {
    setEditingProduct(null)
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <ProductForm
          editingProduct={editingProduct}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
        <ProductList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}
