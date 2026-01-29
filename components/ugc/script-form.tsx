"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { ScriptOutput } from "@/lib/agents/script-generator"
import { useLanguage } from "@/components/language-provider"

interface Product {
  id: number
  name: string
  image_url: string | null
  description: string | null
  brand_id: number | null
  brand_name: string | null
}

interface ScriptFormProps {
  onScriptGenerated: (script: ScriptOutput, scriptId: string) => void
  isGenerating: boolean
  setIsGenerating: (value: boolean) => void
  disabled?: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function ScriptForm({ onScriptGenerated, isGenerating, setIsGenerating, disabled }: ScriptFormProps) {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>("")
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [personaImage, setPersonaImage] = useState<File | null>(null)
  const [personaPreview, setPersonaPreview] = useState<string | null>(null)
  const [painPoint, setPainPoint] = useState("")
  const [context, setContext] = useState("")
  const [tone, setTone] = useState<"natural_friendly" | "energetic" | "serious">("natural_friendly")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Gallery State
  const [uploadMethod, setUploadMethod] = useState<"upload" | "gallery">("upload")
  const [galleryImages, setGalleryImages] = useState<any[]>([])
  const [isLoadingGallery, setIsLoadingGallery] = useState(false)

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products")
        if (!response.ok) throw new Error("Failed to fetch products")
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error("Error fetching products:", error)
        toast.error(t.errorLoadingProducts)
      }
    }
    fetchProducts()
  }, [t.errorLoadingProducts])

  // Fetch Gallery Images
  useEffect(() => {
    if (uploadMethod === "gallery" && galleryImages.length === 0) {
      async function fetchGallery() {
        setIsLoadingGallery(true)
        try {
          const response = await fetch("/api/get-generations?limit=20")
          if (!response.ok) throw new Error("Failed to fetch gallery")
          const data = await response.json()
          // Filter only successfully generated images
          const images = data.generations.filter((g: any) => g.image_url && g.status === 'complete')
          setGalleryImages(images)
        } catch (error) {
          console.error("Error fetching gallery:", error)
          toast.error("Failed to load gallery images")
        } finally {
          setIsLoadingGallery(false)
        }
      }
      fetchGallery()
    }
  }, [uploadMethod, galleryImages.length])

  const handleGalleryImageSelect = async (imageUrl: string) => {
    try {
      // Show loading or optimism?
      // For now, let's just set preview and fetch in background? 
      // No, we need the File object for valid state.

      const toastId = toast.loading(t.downloadingImage || "Processing image...")

      // Use proxy to avoid CORS
      const response = await fetch(`/api/download-image?url=${encodeURIComponent(imageUrl)}`)
      if (!response.ok) throw new Error("Failed to download image")

      const blob = await response.blob()
      const file = new File([blob], "gallery_image.png", { type: blob.type })

      processFile(file)
      toast.dismiss(toastId)
    } catch (error) {
      console.error("Error processing gallery image:", error)
      toast.error(t.errorProcessingImage || "Failed to process image")
    }
  }

  // Get unique brands from products
  const brands = Array.from(new Set(products.map(p => p.brand_id).filter(id => id !== null)))
    .map(id => {
      const product = products.find(p => p.brand_id === id)
      return {
        id: id!.toString(),
        name: product?.brand_name || "Unknown Brand"
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  // Filter products by selected brand
  const filteredProducts = products.filter(p =>
    selectedBrandId ? p.brand_id?.toString() === selectedBrandId : false
  )

  const processFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`${t.imageTooLarge} ${MAX_FILE_SIZE / 1024 / 1024}MB`)
      return
    }

    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".heic") && !file.name.toLowerCase().endsWith(".heif")) {
      toast.error(t.fileMustBeImage)
      return
    }

    setPersonaImage(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPersonaPreview(reader.result as string)
    }
    reader.onerror = () => {
      toast.error(t.errorReadingFile)
    }
    reader.readAsDataURL(file)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleClearImage = () => {
    setPersonaImage(null)
    setPersonaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const canGenerate =
    !disabled && !isGenerating && selectedProductId && personaImage && painPoint.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // ... same submit logic
    if (!canGenerate) return

    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append("product_id", selectedProductId)
      formData.append("persona_image", personaImage!)
      formData.append("pain_point", painPoint.trim())
      if (context.trim()) {
        formData.append("context", context.trim())
      }
      formData.append("tone", tone)

      const response = await fetch("/api/generate-script", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || "Failed to generate script")
      }

      const data = await response.json()
      onScriptGenerated(data.script, data.scriptId)
    } catch (error) {
      console.error("Error generating script:", error)
      toast.error(error instanceof Error ? error.message : t.errorGeneratingScript)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 border border-gray-700 rounded-lg p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t.scriptConfiguration}</h2>
          <p className="text-sm text-gray-400">{t.fillFormForScript}</p>
        </div>

        {/* Brand Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">
            {t.brand} <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedBrandId}
            onValueChange={(val) => {
              setSelectedBrandId(val)
              setSelectedProductId("") // Reset product when brand changes
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-full h-12 bg-black/50 border-gray-600 text-white">
              <SelectValue placeholder={t.selectBrand} />
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-600">
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id} className="text-white">
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">
            {t.products} <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedProductId}
            onValueChange={setSelectedProductId}
            disabled={disabled || !selectedBrandId}
          >
            <SelectTrigger className="w-full h-12 bg-black/50 border-gray-600 text-white">
              <SelectValue placeholder={selectedBrandId ? t.selectAProduct : t.selectBrand} />
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-600">
              {filteredProducts.map((product) => (
                <SelectItem key={product.id} value={product.id.toString()} className="text-white">
                  <div className="flex items-center gap-2">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="w-6 h-6 object-cover rounded" />
                    )}
                    <span>{product.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Persona Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">
            {t.personaPhoto} <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400">{t.personaPhotoDesc}</p>

          {/* Tabs for Upload Method */}
          <div className="flex gap-4 border-b border-gray-700">
            <button
              type="button"
              onClick={() => {
                setUploadMethod("upload")
                // Don't clear image when switching tabs, only if user explicitly clears
              }}
              className={`pb-2 text-sm font-medium transition-colors ${uploadMethod === "upload"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-gray-300"
                }`}
            >
              {t.uploadPhoto || "Upload Photo"}
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod("gallery")}
              className={`pb-2 text-sm font-medium transition-colors ${uploadMethod === "gallery"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-gray-300"
                }`}
            >
              {t.selectFromGallery || "Select from Gallery"}
            </button>
          </div>

          {!personaPreview ? (
            uploadMethod === "upload" ? (
              <div
                onClick={() => !disabled && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging
                  ? "border-white bg-white/10"
                  : "border-gray-600 hover:border-gray-500"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <svg
                  className={`mx-auto h-12 w-12 ${isDragging ? "text-white" : "text-gray-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className={`mt-2 text-sm ${isDragging ? "text-white" : "text-gray-400"}`}>
                  {isDragging ? t.dropImageHere : t.clickToUpload}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t.imageRequirements}</p>
              </div>
            ) : (
              <div className="border border-gray-700 rounded-lg p-4 max-h-[400px] overflow-y-auto bg-black/20">
                {isLoadingGallery ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {galleryImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-square cursor-pointer group rounded-md overflow-hidden border border-gray-800 hover:border-white transition-all"
                        onClick={() => handleGalleryImageSelect(img.image_url)}
                      >
                        <img
                          src={img.image_url}
                          alt={img.description || "Gallery image"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">Select</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>{t.noImagesFound || "No images found in your gallery"}</p>
                    <p className="text-xs mt-1">{t.generateImagesFirst || "Generate images to use them here"}</p>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="relative">
              <img src={personaPreview} alt="Persona preview" className="w-full h-64 object-contain bg-black/50 rounded-lg border border-gray-700" />
              <button
                type="button"
                onClick={handleClearImage}
                disabled={disabled}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handleImageSelect}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* Pain Point */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">
            {t.painPointBenefit} <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400">{t.painPointDesc}</p>
          <textarea
            value={painPoint}
            onChange={(e) => setPainPoint(e.target.value)}
            placeholder="Ex: Dores nas costas ao acordar"
            maxLength={500}
            disabled={disabled}
            className="w-full min-h-[100px] p-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white resize-none"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{t.describeProblem}</span>
            <span>{painPoint.length}/500</span>
          </div>
        </div>

        {/* Context */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">{t.contextOptional}</label>
          <p className="text-xs text-gray-400">{t.contextDesc}</p>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t.contextPlaceholder}
            maxLength={200}
            disabled={disabled}
            className="w-full h-12 px-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white"
          />
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">
            {t.toneOfVoice} <span className="text-red-500">*</span>
          </label>
          <Select value={tone} onValueChange={(value: any) => setTone(value)} disabled={disabled}>
            <SelectTrigger className="w-full h-12 bg-black/50 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-600">
              <SelectItem value="natural_friendly" className="text-white">
                {t.naturalFriendly}
              </SelectItem>
              <SelectItem value="energetic" className="text-white">
                {t.energetic}
              </SelectItem>
              <SelectItem value="serious" className="text-white">
                {t.serious}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!canGenerate}
          className="w-full h-12 text-base font-semibold !bg-white !text-black hover:!bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
              {t.generatingScript}
            </>
          ) : (
            `✨ ${t.createScript}`
          )}
        </Button>
      </div>
    </form>
  )
}
