"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { ImageUploadBox } from "./image-upload-box"
import { cn } from "@/lib/utils"

const btnClassName = "w-full h-10 md:h-12 text-sm md:base font-semibold bg-white text-black hover:bg-gray-200"

interface InputSectionProps {
  prompt: string
  setPrompt: (prompt: string) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  availableModels: ReadonlyArray<{ value: string; label: string; description: string }>
  numberOfImages: number
  setNumberOfImages: (num: number) => void
  aspectRatio: string
  setAspectRatio: (ratio: string) => void
  availableAspectRatios: Array<{ value: string; label: string; icon: React.ReactNode }>
  useUrls: boolean
  setUseUrls: (use: boolean) => void
  image1Preview: string | null
  image2Preview: string | null
  image1Url: string
  image2Url: string
  isConvertingHeic: boolean
  canGenerate: boolean
  hasImages: boolean
  onGenerate: () => void
  onClearAll: () => void
  onImageUpload: (file: File, slot: 1 | 2) => Promise<void>
  onUrlChange: (url: string, slot: 1 | 2) => void
  onClearImage: (slot: 1 | 2) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onPromptPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
  onImageFullscreen: (url: string) => void
  promptTextareaRef: React.RefObject<HTMLTextAreaElement>
  isAuthenticated: boolean
  remaining: number
  decrementOptimistic: () => void
  usageLoading: boolean
  onShowAuthModal: () => void
  generations: any[]
  selectedGenerationId: string | null
  onSelectGeneration: (id: string) => void
  onCancelGeneration: (id: string) => void
  onDeleteGeneration: (id: string) => Promise<void>
  historyLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  isLoadingMore: boolean
  isEnhancing?: boolean
  enhancedPrompt?: string | null
  imageAnalysis?: string[] | null
  image1?: File | null
  image1Url?: string
  image2?: File | null
  image2Url?: string
  useUrls?: boolean
  onEnhancePrompt?: (prompt: string, options?: any) => Promise<string | null>
  onApplyEnhancedPrompt?: () => string | null
  onClearEnhancedPrompt?: () => void
  products?: any[]
  selectedProduct?: any | null
  loadingProducts?: boolean
  onProductSelect?: (productId: string) => void
  onClearProduct?: () => void
}

export function InputSection({
  prompt,
  setPrompt,
  selectedModel,
  setSelectedModel,
  availableModels,
  numberOfImages,
  setNumberOfImages,
  aspectRatio,
  setAspectRatio,
  availableAspectRatios,
  useUrls,
  setUseUrls,
  image1Preview,
  image2Preview,
  image1Url,
  image2Url,
  isConvertingHeic,
  canGenerate,
  hasImages,
  onGenerate,
  onClearAll,
  onImageUpload,
  onUrlChange,
  onClearImage,
  onKeyDown,
  onPromptPaste,
  onImageFullscreen,
  promptTextareaRef,
  isEnhancing = false,
  enhancedPrompt = null,
  imageAnalysis = null,
  image1,
  image2,
  onEnhancePrompt,
  onApplyEnhancedPrompt,
  onClearEnhancedPrompt,
  products = [],
  selectedProduct = null,
  loadingProducts = false,
  onProductSelect,
  onClearProduct,
}: InputSectionProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="space-y-3 md:space-y-4 min-h-0 flex flex-col">
        <div className="space-y-3 md:space-y-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 md:mb-6 select-none">
            <div className="flex flex-col gap-1">
              <label className="text-sm md:text-base font-medium text-gray-300">Prompt</label>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-32 sm:w-36 md:w-44 !h-7 md:!h-10 px-3 !py-0 bg-black/50 border border-gray-600 text-white text-xs md:text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 data-[state=open]:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-gray-600 text-white">
                  {availableModels.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-xs md:text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{model.label}</span>
                        <span className="text-[10px] text-gray-400">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="w-24 sm:w-28 md:w-32 !h-7 md:!h-10 px-3 !py-0 bg-black/50 border border-gray-600 text-white text-xs md:text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 data-[state=open]:ring-offset-0">
                  <SelectValue placeholder="1:1" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-gray-600 text-white">
                  {availableAspectRatios.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={numberOfImages.toString()} onValueChange={(val) => setNumberOfImages(parseInt(val))}>
                <SelectTrigger className="w-20 sm:w-24 md:w-28 !h-7 md:!h-10 px-3 !py-0 bg-black/50 border border-gray-600 text-white text-xs md:text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 data-[state=open]:ring-offset-0">
                  <SelectValue placeholder="1" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-gray-600 text-white">
                  <SelectItem value="1" className="text-xs md:text-sm">1 img</SelectItem>
                  <SelectItem value="2" className="text-xs md:text-sm">2 imgs</SelectItem>
                  <SelectItem value="3" className="text-xs md:text-sm">3 imgs</SelectItem>
                  <SelectItem value="4" className="text-xs md:text-sm">4 imgs</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={onClearAll}
                disabled={!prompt.trim() && !hasImages}
                variant="outline"
                className="h-7 md:h-10 px-3 py-0 text-xs md:text-sm bg-transparent border border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
              >
                <Trash2 className="size-4 md:hidden" />
                <span className="hidden md:inline">Clear</span>
              </Button>
            </div>
          </div>

          {/* Product Selector */}
          {products && products.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium text-gray-400">
                Select Product (Optional)
              </label>
              <div className="flex gap-2">
                <Select
                  value={selectedProduct?.id?.toString() || ""}
                  onValueChange={(value) => {
                    if (value && onProductSelect) {
                      onProductSelect(value)
                    }
                  }}
                  disabled={loadingProducts}
                >
                  <SelectTrigger className="flex-1 !h-10 px-3 bg-black/50 border border-gray-600 text-white text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 data-[state=open]:ring-offset-0">
                    <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select a product..."} />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-gray-600 text-white">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()} className="text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          {product.category && (
                            <span className="text-xs text-gray-400">{product.category}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && onClearProduct && (
                  <Button
                    onClick={onClearProduct}
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 text-sm bg-transparent border border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedProduct && (
                <div className="p-2 bg-black/30 border border-gray-700 rounded text-xs text-gray-300">
                  <strong>{selectedProduct.name}</strong>
                  {selectedProduct.description && (
                    <p className="mt-1 text-gray-400">{selectedProduct.description}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <textarea
            ref={promptTextareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPromptPaste}
            placeholder=""
            autoFocus
            className="w-full flex-1 min-h-[100px] max-h-[140px] lg:min-h-[12vh] lg:max-h-[18vh] xl:min-h-[14vh] xl:max-h-[20vh] p-2 md:p-4 bg-black/50 border-2 border-gray-600 resize-none focus:outline-none focus:border-white text-white text-xs md:text-base select-text"
            style={{
              fontSize: "16px",
              WebkitUserSelect: "text",
              userSelect: "text",
            }}
          />

          {/* Enhance Prompt Section */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                const hasImages = useUrls ? (image1Url || image2Url) : (image1 || image2)
                onEnhancePrompt?.(prompt, {
                  image1,
                  image1Url,
                  image2,
                  image2Url,
                })
              }}
              disabled={!prompt.trim() || isEnhancing}
              className="flex-1 h-10 md:h-12 text-sm md:text-base font-semibold bg-white text-black hover:text-black hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
            >
              {isEnhancing ? "Enhancing..." : useUrls ? (image1Url || image2Url) ? "✨ Enhance (with images)" : "Enhance" : image1 || image2 ? "✨ Enhance (with images)" : "Enhance"}
            </button>
          </div>

          {enhancedPrompt && (
            <div className="mt-2 p-3 md:p-4 bg-blue-900/30 border border-blue-600/50 rounded">
              {/* Image Analysis Preview */}
              {imageAnalysis && imageAnalysis.length > 0 && (
                <div className="mb-3 pb-3 border-b border-blue-600/30">
                  <p className="text-xs text-blue-400 font-medium mb-1.5">📸 Image Context:</p>
                  <div className="space-y-1">
                    {imageAnalysis.map((analysis, idx) => (
                      <p key={idx} className="text-xs text-blue-300/80 line-clamp-2">
                        {analysis}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Prompt */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs md:text-sm text-blue-300 font-medium">Enhanced Prompt:</p>
                <button
                  onClick={() => {
                    if (onApplyEnhancedPrompt) {
                      const enhanced = onApplyEnhancedPrompt()
                      if (enhanced) {
                        setPrompt(enhanced)
                        onClearEnhancedPrompt?.()
                      }
                    }
                  }}
                  className="text-xs px-2 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded whitespace-nowrap"
                >
                  Use
                </button>
              </div>
              <p className="text-xs md:text-sm text-blue-200 line-clamp-3">{enhancedPrompt}</p>
              <button
                onClick={() => onClearEnhancedPrompt?.()}
                className="text-xs text-blue-400 hover:text-blue-300 mt-2"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2 md:space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 md:mb-3 select-none">
              <div className="flex flex-col gap-1">
                <label className="text-sm md:text-base font-medium text-gray-300">Images (optional)</label>
              </div>
              <div className="inline-flex bg-black/50 border border-gray-600">
                <button
                  onClick={() => setUseUrls(false)}
                  className={cn(
                    "px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all",
                    !useUrls ? "bg-white text-black" : "text-gray-300 hover:text-white",
                  )}
                >
                  Files
                </button>
                <button
                  onClick={() => setUseUrls(true)}
                  className={cn(
                    "px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all",
                    useUrls ? "bg-white text-black" : "text-gray-300 hover:text-white",
                  )}
                >
                  URLs
                </button>
              </div>
            </div>

            {useUrls ? (
              <div className="space-y-2 lg:min-h-[12vh] xl:min-h-[14vh]">
                <div className="relative">
                  <input
                    type="url"
                    value={image1Url}
                    onChange={(e) => onUrlChange(e.target.value, 1)}
                    placeholder="First image URL"
                    className="w-full p-2 md:p-3 pr-8 bg-black/50 border border-gray-600 text-white text-xs focus:outline-none focus:ring-2 focus:ring-white select-text"
                  />
                  {image1Url && (
                    <button
                      onClick={() => onClearImage(1)}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={image2Url}
                    onChange={(e) => onUrlChange(e.target.value, 2)}
                    placeholder="Second image URL"
                    className="w-full p-2 md:p-3 pr-8 bg-black/50 border border-gray-600 text-white text-xs focus:outline-none focus:ring-2 focus:ring-white select-text"
                  />
                  {image2Url && (
                    <button
                      onClick={() => onClearImage(2)}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="select-none lg:min-h-[12vh] xl:min-h-[14vh]">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                  <ImageUploadBox
                    imageNumber={1}
                    preview={image1Preview}
                    onDrop={(e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith("image/")) {
                        onImageUpload(file, 1)
                      }
                    }}
                    onClear={() => onClearImage(1)}
                    onSelect={() => {
                      if (image1Preview) {
                        onImageFullscreen(image1Preview)
                      } else {
                        document.getElementById("file1")?.click()
                      }
                    }}
                  />
                  <input
                    id="file1"
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        onImageUpload(file, 1)
                        e.target.value = ""
                      }
                    }}
                  />

                  <ImageUploadBox
                    imageNumber={2}
                    preview={image2Preview}
                    onDrop={(e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith("image/")) {
                        onImageUpload(file, 2)
                      }
                    }}
                    onClear={() => onClearImage(2)}
                    onSelect={() => {
                      if (image2Preview) {
                        onImageFullscreen(image2Preview)
                      } else {
                        document.getElementById("file2")?.click()
                      }
                    }}
                  />
                  <input
                    id="file2"
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        onImageUpload(file, 2)
                        e.target.value = ""
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-0">
          <Button onClick={onGenerate} disabled={!canGenerate || isConvertingHeic} className={btnClassName}>
            {isConvertingHeic ? "Converting HEIC..." : "Run"}
          </Button>
        </div>
      </div>
    </div>
  )
}
