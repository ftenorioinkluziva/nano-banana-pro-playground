"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { ScriptOutput } from "@/lib/agents/script-generator"

interface Product {
  id: number
  name: string
  image_url: string | null
  description: string | null
}

interface ScriptFormProps {
  onScriptGenerated: (script: ScriptOutput, scriptId: string) => void
  isGenerating: boolean
  setIsGenerating: (value: boolean) => void
  disabled?: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function ScriptForm({ onScriptGenerated, isGenerating, setIsGenerating, disabled }: ScriptFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [personaImage, setPersonaImage] = useState<File | null>(null)
  const [personaPreview, setPersonaPreview] = useState<string | null>(null)
  const [painPoint, setPainPoint] = useState("")
  const [context, setContext] = useState("")
  const [tone, setTone] = useState<"natural_friendly" | "energetic" | "serious">("natural_friendly")
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        toast.error("Erro ao carregar produtos")
      }
    }
    fetchProducts()
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Imagem muito grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo deve ser uma imagem")
      return
    }

    setPersonaImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPersonaPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
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
      toast.error(error instanceof Error ? error.message : "Erro ao gerar roteiro")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 border border-gray-700 rounded-lg p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Configuração do Roteiro</h2>
          <p className="text-sm text-gray-400">Preencha os campos abaixo para gerar seu roteiro estruturado</p>
        </div>

        {/* Product Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">
            Produto <span className="text-red-500">*</span>
          </label>
          <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={disabled}>
            <SelectTrigger className="w-full h-12 bg-black/50 border-gray-600 text-white">
              <SelectValue placeholder="Selecione um produto" />
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-600">
              {products.map((product) => (
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
            Foto da Persona <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400">Upload da foto da pessoa que será animada no vídeo</p>

          {!personaPreview ? (
            <div
              onClick={() => !disabled && fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
            >
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <p className="mt-2 text-sm text-gray-400">Clique para fazer upload ou arraste a imagem</p>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG, HEIC até 10MB</p>
            </div>
          ) : (
            <div className="relative">
              <img src={personaPreview} alt="Persona preview" className="w-full h-48 object-cover rounded-lg" />
              <button
                type="button"
                onClick={handleClearImage}
                disabled={disabled}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
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
            Dor / Benefício <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400">Qual é a principal dor ou benefício que o produto resolve?</p>
          <textarea
            value={painPoint}
            onChange={(e) => setPainPoint(e.target.value)}
            placeholder="Ex: Dores nas costas ao acordar"
            maxLength={500}
            disabled={disabled}
            className="w-full min-h-[100px] p-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white resize-none"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Descreva o problema que o produto resolve</span>
            <span>{painPoint.length}/500</span>
          </div>
        </div>

        {/* Context */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">Contexto (Opcional)</label>
          <p className="text-xs text-gray-400">Onde acontece a cena? Se não preencher, a IA irá inferir da foto</p>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ex: Cozinha, manhã de sol"
            maxLength={200}
            disabled={disabled}
            className="w-full h-12 px-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white"
          />
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 block">
            Tom de Voz <span className="text-red-500">*</span>
          </label>
          <Select value={tone} onValueChange={(value: any) => setTone(value)} disabled={disabled}>
            <SelectTrigger className="w-full h-12 bg-black/50 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-600">
              <SelectItem value="natural_friendly" className="text-white">
                Natural / Amigo
              </SelectItem>
              <SelectItem value="energetic" className="text-white">
                Enérgico
              </SelectItem>
              <SelectItem value="serious" className="text-white">
                Sério
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!canGenerate}
          className="w-full h-12 text-base font-semibold bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
              Gerando Roteiro...
            </>
          ) : (
            "✨ Gerar Roteiro"
          )}
        </Button>
      </div>
    </form>
  )
}
