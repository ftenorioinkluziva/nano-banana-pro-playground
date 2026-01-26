"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { X, Plus } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"

interface Brand {
  id: number
  name: string
  tone: string | null
}

interface Product {
  id: number
  name: string
  description: string | null
  image_url: string | null
  target_audience: string | null
  brand_id: number | null
}

interface ProductFormProps {
  editingProduct?: Product | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProductForm({ editingProduct, onSuccess, onCancel }: ProductFormProps) {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    target_audience: "",
    brand_id: "",
  })

  const isEditMode = !!editingProduct

  useEffect(() => {
    fetchBrands()
  }, [])

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || "",
        description: editingProduct.description || "",
        image_url: editingProduct.image_url || "",
        target_audience: editingProduct.target_audience || "",
        brand_id: editingProduct.brand_id?.toString() || "",
      })
    }
  }, [editingProduct])

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands")
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands)
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBrandChange = (value: string) => {
    setFormData((prev) => ({ ...prev, brand_id: value }))
  }

  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      image_url: "",
      target_audience: "",
      brand_id: "",
    })
    onCancel?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = isEditMode
        ? `/api/products/${editingProduct.id}`
        : "/api/products"

      const payload = {
        ...formData,
        brand_id: formData.brand_id ? Number(formData.brand_id) : null,
      }

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save product")
      }

      toast.success(t.productSaved)
      handleReset()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save product")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-black/50 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-white">
            {isEditMode ? t.editProduct : t.newProduct}
          </CardTitle>
          {isEditMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.productName} *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder={t.productPlaceholders.name}
              className="bg-black border-gray-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.productDescription} *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
              placeholder={t.productPlaceholders.description}
              className="bg-black border-gray-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">{t.productImageUrl} *</Label>
            <Input
              id="image_url"
              name="image_url"
              type="url"
              value={formData.image_url}
              onChange={handleChange}
              required
              placeholder="https://example.com/product.jpg"
              className="bg-black border-gray-800"
            />
            {formData.image_url && (
              <div className="mt-2 p-2 rounded bg-gray-900 border border-gray-800">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="max-h-32 rounded object-contain mx-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">{t.targetAudience} *</Label>
            <Textarea
              id="target_audience"
              name="target_audience"
              value={formData.target_audience}
              onChange={handleChange}
              rows={2}
              required
              placeholder={t.productPlaceholders.target_audience}
              className="bg-black border-gray-800"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="brand_id">{t.brand} *</Label>
              <Link
                href="/brands"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {t.manageBrands}
              </Link>
            </div>
            <Select value={formData.brand_id || ""} onValueChange={handleBrandChange} required>
              <SelectTrigger className="bg-black border-gray-800">
                <SelectValue placeholder={t.selectBrand} />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-800 text-white">
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                    {brand.tone && (
                      <span className="text-gray-400 ml-2">({brand.tone})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            {isEditMode && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-700"
              >
                {t.cancel}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 !bg-white !text-black hover:!bg-gray-200 disabled:opacity-50"
            >
              {isSubmitting
                ? t.loading
                : isEditMode
                  ? t.editProduct
                  : t.newProduct}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
