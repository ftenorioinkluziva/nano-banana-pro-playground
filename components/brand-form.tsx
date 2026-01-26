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
import { X } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface Brand {
  id: number
  name: string
  tone: string | null
  description: string | null
}

interface BrandFormProps {
  editingBrand?: Brand | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function BrandForm({ editingBrand, onSuccess, onCancel }: BrandFormProps) {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    tone: "",
    description: "",
  })

  const TONE_OPTIONS = [
    { value: "casual", label: t.toneCasual, description: t.toneCasualDesc },
    { value: "energetic", label: t.toneEnergetic, description: t.toneEnergeticDesc },
    { value: "professional", label: t.toneProfessional, description: t.toneProfessionalDesc },
    { value: "playful", label: t.tonePlayful, description: t.tonePlayfulDesc },
    { value: "inspirational", label: t.toneInspirational, description: t.toneInspirationalDesc },
  ]

  const isEditMode = !!editingBrand

  useEffect(() => {
    if (editingBrand) {
      setFormData({
        name: editingBrand.name || "",
        tone: editingBrand.tone || "",
        description: editingBrand.description || "",
      })
    }
  }, [editingBrand])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleToneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, tone: value }))
  }

  const handleReset = () => {
    setFormData({ name: "", tone: "", description: "" })
    onCancel?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = isEditMode
        ? `/api/brands/${editingBrand.id}`
        : "/api/brands"

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save brand")
      }

      toast.success(t.brandSaved)
      handleReset()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save brand")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full bg-black/50 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-white">
            {isEditMode ? t.editBrand : t.newBrand}
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
            <Label htmlFor="name">{t.brandName} *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Green Line Premium"
              className="bg-black border-gray-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">{t.toneOfVoice} *</Label>
            <Select value={formData.tone} onValueChange={handleToneChange} required>
              <SelectTrigger className="bg-black border-gray-800">
                <SelectValue placeholder={t.selectTone} />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-800 text-white">
                {TONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="font-medium">{option.label}</span>
                    <span className="text-gray-400 ml-2">— {option.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.description}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of the brand..."
              className="bg-black border-gray-800"
            />
          </div>

          <div className="flex gap-2 pt-2">
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
                  ? t.editBrand
                  : t.createAccount}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
