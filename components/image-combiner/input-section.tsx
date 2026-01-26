"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Sparkles, Wand2 } from "lucide-react"
import { ImageUploadBox } from "./image-upload-box"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const btnClassName = "w-full h-10 md:h-12 text-sm md:base font-semibold bg-white text-black hover:bg-gray-200"

interface InputSectionProps {
  prompt: string
  setPrompt: (prompt: string) => void
  model: "nano-banana-pro" | "z-image"
  setModel: (model: "nano-banana-pro" | "z-image") => void
  resolution: "1K" | "2K" | "4K"
  setResolution: (resolution: "1K" | "2K" | "4K") => void
  outputFormat: "PNG" | "JPG"
  setOutputFormat: (format: "PNG" | "JPG") => void
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
  isEnhancing?: boolean
  enhancedPrompt?: string | null
  imageAnalysis?: string[] | null
  image1?: File | null
  image2?: File | null
  onEnhancePrompt?: (prompt: string, options?: any) => Promise<string | null>
  onApplyEnhancedPrompt?: () => string | null
  onClearEnhancedPrompt?: () => void
  t: Record<string, string>
}

export function InputSection({
  prompt,
  setPrompt,
  model,
  setModel,
  resolution,
  setResolution,
  outputFormat,
  setOutputFormat,
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
  t,
}: InputSectionProps) {
  return (
    <div className="flex flex-col min-h-0">
      <div className="space-y-3 md:space-y-4 min-h-0 flex flex-col">
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-300 block" suppressHydrationWarning>{t.model}</label>
          <p className="text-xs text-gray-400" suppressHydrationWarning>{t.modelDescription}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setModel("nano-banana-pro")}
              className={cn(
                "h-10 md:h-12 text-sm md:text-base font-semibold transition-all border rounded",
                model === "nano-banana-pro"
                  ? "bg-white text-black border-white"
                  : "bg-black/50 text-white border-gray-600 hover:bg-gray-700"
              )}
            >
              Nano Banana Pro
            </button>
            <button
              onClick={() => setModel("z-image")}
              className={cn(
                "h-10 md:h-12 text-sm md:text-base font-semibold transition-all border rounded",
                model === "z-image"
                  ? "bg-white text-black border-white"
                  : "bg-black/50 text-white border-gray-600 hover:bg-gray-700"
              )}
            >
              Z Image
            </button>
          </div>
        </div>

        {/* Prompt Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <label className="text-sm md:text-base font-medium text-gray-300" suppressHydrationWarning>{t.prompt}</label>
              <p className="text-xs text-gray-400" suppressHydrationWarning>{t.promptDescription}</p>
            </div>
            <Button
              onClick={onClearAll}
              disabled={!prompt.trim() && !hasImages}
              variant="outline"
              size="sm"
              className="h-8 px-3 bg-transparent border border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
            >
              <Trash2 className="size-4 md:mr-2" />
              <span className="hidden md:inline" suppressHydrationWarning>{t.clear}</span>
            </Button>
          </div>

          <textarea
            ref={promptTextareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPromptPaste}
            placeholder={t.promptPlaceholder}
            autoFocus
            className="w-full min-h-[120px] max-h-[200px] p-3 md:p-4 bg-black/50 border-2 border-gray-600 resize-none focus:outline-none focus:border-white text-white text-sm md:text-base"
            style={{
              fontSize: "16px",
            }}
            suppressHydrationWarning
          />

          {/* Enhance Prompt Button */}
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      if (onEnhancePrompt) {
                        onEnhancePrompt(prompt, {
                          image1,
                          image2,
                          image1Url: useUrls ? image1Url : undefined,
                          image2Url: useUrls ? image2Url : undefined,
                        })
                      }
                    }}
                    disabled={!prompt.trim() || isEnhancing}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent border border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 gap-2"
                  >
                    {isEnhancing ? (
                      <>
                        <div className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span suppressHydrationWarning>{t.enhancing}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3 text-blue-400" />
                        <span suppressHydrationWarning>{t.enhancePrompt}</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 border-zinc-800 text-white text-xs" suppressHydrationWarning>
                  {t.enhanceTooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {enhancedPrompt && (
              <Button
                onClick={() => {
                  if (onClearEnhancedPrompt) {
                    onClearEnhancedPrompt()
                  }
                }}
                variant="outline"
                size="sm"
                className="text-xs bg-transparent border border-gray-600 text-white hover:bg-gray-700"
                suppressHydrationWarning
              >
                {t.clearEnhanced}
              </Button>
            )}
          </div>

          {/* Enhanced Prompt Display */}
          {enhancedPrompt && (
            <div className="p-3 bg-green-900/20 border border-green-600/50 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-green-400" suppressHydrationWarning>{t.enhancedPromptLabel}</span>
                <Button
                  onClick={() => {
                    if (onApplyEnhancedPrompt) {
                      const enhanced = onApplyEnhancedPrompt()
                      if (enhanced) {
                        setPrompt(enhanced)
                      }
                    }
                    if (onClearEnhancedPrompt) {
                      onClearEnhancedPrompt()
                    }
                  }}
                  size="sm"
                  className="h-6 text-xs bg-green-600 hover:bg-green-700 text-white"
                  suppressHydrationWarning
                >
                  {t.apply}
                </Button>
              </div>
              <p className="text-sm text-gray-200">{enhancedPrompt}</p>
              {imageAnalysis && imageAnalysis.length > 0 && (
                <div className="mt-2 pt-2 border-t border-green-600/30">
                  <span className="text-xs font-medium text-green-400" suppressHydrationWarning>{t.imageAnalysisLabel}</span>
                  <ul className="mt-1 space-y-1">
                    {imageAnalysis.map((analysis, idx) => (
                      <li key={idx} className="text-xs text-gray-300">
                        • {analysis}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image Input Section - Only for nano-banana-pro */}
        {model === "nano-banana-pro" && (
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm md:text-base font-medium text-gray-300" suppressHydrationWarning>{t.imageInput}</label>
              <p className="text-xs text-gray-400" suppressHydrationWarning>{t.imageInputDescription}</p>
            </div>

            <div className="inline-flex bg-black/50 border border-gray-600">
              <button
                onClick={() => setUseUrls(false)}
                className={cn(
                  "px-3 py-2 text-xs md:text-sm font-medium transition-all",
                  !useUrls ? "bg-white text-black" : "text-gray-300 hover:text-white",
                )}
                suppressHydrationWarning
              >
                {t.files}
              </button>
              <button
                onClick={() => setUseUrls(true)}
                className={cn(
                  "px-3 py-2 text-xs md:text-sm font-medium transition-all",
                  useUrls ? "bg-white text-black" : "text-gray-300 hover:text-white",
                )}
                suppressHydrationWarning
              >
                {t.urls}
              </button>
            </div>

            {useUrls ? (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="url"
                    value={image1Url}
                    onChange={(e) => onUrlChange(e.target.value, 1)}
                    placeholder={t.firstImageUrl}
                    className="w-full p-3 pr-10 bg-black/50 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  {image1Url && (
                    <button
                      onClick={() => onClearImage(1)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                        <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={image2Url}
                    onChange={(e) => onUrlChange(e.target.value, 2)}
                    placeholder={t.secondImageUrl}
                    className="w-full p-3 pr-10 bg-black/50 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  {image2Url && (
                    <button
                      onClick={() => onClearImage(2)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                        <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
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
                  t={t}
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
                  t={t}
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
            )}
          </div>
        )}

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <label className="text-sm md:text-base font-medium text-gray-300 block" suppressHydrationWarning>{t.aspectRatio}</label>
          <p className="text-xs text-gray-400" suppressHydrationWarning>{t.aspectRatioDescription}</p>
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger className="w-full h-10 md:h-12 px-3 bg-black/50 border border-gray-600 text-white text-sm md:text-base focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="1:1" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-gray-600 text-white">
              {availableAspectRatios.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-sm md:text-base">
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resolution - Only for nano-banana-pro */}
        {model === "nano-banana-pro" && (
          <div className="space-y-2">
            <label className="text-sm md:text-base font-medium text-gray-300 block" suppressHydrationWarning>{t.resolution}</label>
            <p className="text-xs text-gray-400" suppressHydrationWarning>{t.resolutionDescription}</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setResolution("1K")}
                className={cn(
                  "h-10 md:h-12 text-sm md:text-base font-semibold transition-all border rounded",
                  resolution === "1K"
                    ? "bg-white text-black border-white"
                    : "bg-black/50 text-white border-gray-600 hover:bg-gray-700"
                )}
              >
                1K
              </button>
              <button
                onClick={() => setResolution("2K")}
                className={cn(
                  "h-10 md:h-12 text-sm md:text-base font-semibold transition-all border rounded",
                  resolution === "2K"
                    ? "bg-white text-black border-white"
                    : "bg-black/50 text-white border-gray-600 hover:bg-gray-700"
                )}
              >
                2K
              </button>
              <button
                onClick={() => setResolution("4K")}
                className={cn(
                  "h-10 md:h-12 text-sm md:text-base font-semibold transition-all border rounded",
                  resolution === "4K"
                    ? "bg-white text-black border-white"
                    : "bg-black/50 text-white border-gray-600 hover:bg-gray-700"
                )}
              >
                4K
              </button>
            </div>
          </div>
        )}

        {/* Output Format - Only for nano-banana-pro */}
        {model === "nano-banana-pro" && (
          <div className="space-y-2">
            <label className="text-sm md:text-base font-medium text-gray-300 block" suppressHydrationWarning>{t.outputFormat}</label>
            <p className="text-xs text-gray-400" suppressHydrationWarning>{t.outputFormatDescription}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOutputFormat("PNG")}
                className={cn(
                  "h-10 md:h-12 text-sm md:text-base font-semibold transition-all border rounded",
                  outputFormat === "PNG"
                    ? "bg-white text-black border-white"
                    : "bg-black/50 text-white border-gray-600 hover:bg-gray-700"
                )}
              >
                PNG
              </button>
              <button
                onClick={() => setOutputFormat("JPG")}
                className={cn(
                  "h-10 md:h-12 text-sm md:text-base font-semibold transition-all border rounded",
                  outputFormat === "JPG"
                    ? "bg-white text-black border-white"
                    : "bg-black/50 text-white border-gray-600 hover:bg-gray-700"
                )}
              >
                JPG
              </button>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="pt-2">
          <Button onClick={onGenerate} disabled={!canGenerate || isConvertingHeic} className={btnClassName} suppressHydrationWarning>
            {isConvertingHeic ? t.convertingHeic : t.generate}
          </Button>
        </div>
      </div>
    </div>
  )
}
