"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { X } from "lucide-react"

interface ProductFormData {
  name: string
  slug: string
  price: string
  category: string
  format: string
  quantity_label: string
  description: string
  target_audience: string
  usage_instructions: string
  contraindications: string
  ingredients: string
  benefits: string
  nutritional_info: string
  image_url: string
}

interface Product {
  id: number
  name: string
  slug: string | null
  price: string | null
  category: string | null
  format: string | null
  quantity_label: string | null
  description: string | null
  target_audience: string | null
  usage_instructions: string | null
  contraindications: string | null
  ingredients: string | null
  benefits: any
  nutritional_info: any
  image_url: string | null
}

interface ProductFormProps {
  editingProduct?: Product | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProductForm({ editingProduct, onSuccess, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    slug: "",
    price: "",
    category: "",
    format: "",
    quantity_label: "",
    description: "",
    target_audience: "",
    usage_instructions: "",
    contraindications: "",
    ingredients: "",
    benefits: "",
    nutritional_info: "",
    image_url: "",
  })

  const isEditMode = !!editingProduct

  // Populate form when editing
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || "",
        slug: editingProduct.slug || "",
        price: editingProduct.price || "",
        category: editingProduct.category || "",
        format: editingProduct.format || "",
        quantity_label: editingProduct.quantity_label || "",
        description: editingProduct.description || "",
        target_audience: editingProduct.target_audience || "",
        usage_instructions: editingProduct.usage_instructions || "",
        contraindications: editingProduct.contraindications || "",
        ingredients: editingProduct.ingredients || "",
        benefits: editingProduct.benefits ? JSON.stringify(editingProduct.benefits, null, 2) : "",
        nutritional_info: editingProduct.nutritional_info
          ? JSON.stringify(editingProduct.nutritional_info, null, 2)
          : "",
        image_url: editingProduct.image_url || "",
      })
    }
  }, [editingProduct])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setFormData({
      name: "",
      slug: "",
      price: "",
      category: "",
      format: "",
      quantity_label: "",
      description: "",
      target_audience: "",
      usage_instructions: "",
      contraindications: "",
      ingredients: "",
      benefits: "",
      nutritional_info: "",
      image_url: "",
    })
    if (onCancel) {
      onCancel()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = isEditMode
        ? `/api/products/${editingProduct.id}`
        : "/api/products"

      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Failed to ${isEditMode ? "update" : "create"} product`)
      }

      const result = await response.json()
      toast.success(`Product ${isEditMode ? "updated" : "created"} successfully!`)

      // Reset form
      handleReset()

      // Notify parent
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditMode ? "update" : "create"} product`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-black/50 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-white">
            {isEditMode ? "Edit Product" : "Register New Product"}
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-black border-gray-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="product-name"
                  className="bg-black border-gray-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="bg-black border-gray-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="bg-black border-gray-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Input
                  id="format"
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                  placeholder="e.g., Capsules, Powder"
                  className="bg-black border-gray-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity_label">Quantity Label</Label>
                <Input
                  id="quantity_label"
                  name="quantity_label"
                  value={formData.quantity_label}
                  onChange={handleChange}
                  placeholder="e.g., 60 capsules"
                  className="bg-black border-gray-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="bg-black border-gray-800"
              />
            </div>
          </div>

          {/* Detailed Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Detailed Information</h3>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="bg-black border-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Textarea
                id="target_audience"
                name="target_audience"
                value={formData.target_audience}
                onChange={handleChange}
                rows={2}
                placeholder="e.g., Athletes, Seniors, Women, etc."
                className="bg-black border-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients</Label>
              <Textarea
                id="ingredients"
                name="ingredients"
                value={formData.ingredients}
                onChange={handleChange}
                rows={3}
                className="bg-black border-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage_instructions">Usage Instructions</Label>
              <Textarea
                id="usage_instructions"
                name="usage_instructions"
                value={formData.usage_instructions}
                onChange={handleChange}
                rows={3}
                className="bg-black border-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contraindications">Contraindications</Label>
              <Textarea
                id="contraindications"
                name="contraindications"
                value={formData.contraindications}
                onChange={handleChange}
                rows={3}
                className="bg-black border-gray-800"
              />
            </div>
          </div>

          {/* JSON Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Additional Data (JSON format)</h3>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits (JSON)</Label>
              <Textarea
                id="benefits"
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                rows={3}
                placeholder='{"benefit1": "value", "benefit2": "value"}'
                className="bg-black border-gray-800 font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nutritional_info">Nutritional Info (JSON)</Label>
              <Textarea
                id="nutritional_info"
                name="nutritional_info"
                value={formData.nutritional_info}
                onChange={handleChange}
                rows={3}
                placeholder='{"calories": 100, "protein": "5g"}'
                className="bg-black border-gray-800 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {isEditMode && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 md:h-12 text-sm md:text-base font-semibold !bg-white !text-black hover:!bg-gray-200 disabled:opacity-50"
            >
              {isSubmitting
                ? isEditMode
                  ? "Updating Product..."
                  : "Creating Product..."
                : isEditMode
                ? "Update Product"
                : "Create Product"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
