"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProgressBar } from "./progress-bar"
import { useMobile } from "@/hooks/use-mobile"
import type { Generation } from "./hooks/use-image-generation"
import { useEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Copy, Download, RefreshCw, Maximize2, Trash2, ExternalLink, ArrowLeft } from "lucide-react"

interface OutputSectionProps {
  selectedGeneration: Generation | undefined
  generations: Generation[]
  selectedGenerationId: string | null
  setSelectedGenerationId: (id: string) => void
  isConvertingHeic: boolean
  heicProgress: number
  imageLoaded: boolean
  setImageLoaded: (loaded: boolean) => void
  onCancelGeneration: (id: string) => void
  onDeleteGeneration: (id: string) => void
  onOpenFullscreen: () => void
  onLoadAsInput: () => void
  onCopy: () => void
  onDownload: () => void
  onOpenInNewTab: () => void
  t: Record<string, string>
}

export function OutputSection({
  selectedGeneration,
  generations,
  selectedGenerationId,
  setSelectedGenerationId,
  isConvertingHeic,
  heicProgress,
  imageLoaded,
  setImageLoaded,
  onCancelGeneration,
  onDeleteGeneration,
  onOpenFullscreen,
  onLoadAsInput,
  onCopy,
  onDownload,
  onOpenInNewTab,
  t,
}: OutputSectionProps) {
  const isMobile = useMobile()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTyping = activeElement?.tagName === "TEXTAREA" || activeElement?.tagName === "INPUT"

      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !isTyping) {
        if (generations.length <= 1) return

        e.preventDefault()
        const currentIndex = generations.findIndex((g) => g.id === selectedGenerationId)
        if (currentIndex === -1 && generations.length > 0) {
          setSelectedGenerationId(generations[0].id)
          return
        }

        let newIndex
        if (e.key === "ArrowLeft") {
          newIndex = currentIndex - 1
        } else {
          newIndex = currentIndex + 1
        }

        if (newIndex >= 0 && newIndex < generations.length) {
          setSelectedGenerationId(generations[newIndex].id)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [generations, selectedGenerationId, setSelectedGenerationId])

  const generatedImage =
    selectedGeneration?.status === "complete" && selectedGeneration.imageUrl
      ? { url: selectedGeneration.imageUrl, prompt: selectedGeneration.prompt }
      : null

  const renderButtons = (className?: string) => (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onLoadAsInput}
              disabled={!generatedImage}
              variant="outline"
              size="sm"
              className="text-xs h-8 px-3 bg-zinc-900/50 border-zinc-700 text-white hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2 backdrop-blur-sm transition-all"
            >
              <ArrowLeft className="size-3" />
              <span className="hidden sm:inline">{t.useAsInput}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-950 border-zinc-800 text-white text-xs sm:hidden">
            {t.useAsInput}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onCopy}
              disabled={!generatedImage}
              variant="outline"
              size="sm"
              className="text-xs h-8 px-3 bg-zinc-900/50 border-zinc-700 text-white hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2 backdrop-blur-sm transition-all"
            >
              <Copy className="size-3" />
              <span className="hidden sm:inline">{t.copy}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-950 border-zinc-800 text-white text-xs sm:hidden">
            {t.copy}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onDownload}
              disabled={!generatedImage}
              variant="outline"
              size="sm"
              className="text-xs h-8 px-3 bg-zinc-900/50 border-zinc-700 text-white hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2 backdrop-blur-sm transition-all"
            >
              <Download className="size-3" />
              <span className="hidden sm:inline">{t.download}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-950 border-zinc-800 text-white text-xs sm:hidden">
            {t.download}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div >
  )

  return (
    <div className="flex flex-col h-full min-h-0 select-none relative group/output">
      <div className="relative flex-1 min-h-0 flex flex-col">
        {selectedGeneration?.status === "loading" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <ProgressBar
              progress={selectedGeneration.progress}
              onCancel={() => onCancelGeneration(selectedGeneration.id)}
            />
          </div>
        ) : isConvertingHeic ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <ProgressBar progress={heicProgress} onCancel={() => { }} isConverting />
          </div>
        ) : generatedImage ? (
          <div className="absolute inset-0 flex flex-col select-none">
            <div className="flex-1 flex items-center justify-center relative group max-w-full max-h-full overflow-hidden">
              <img
                src={generatedImage.url || "/placeholder.svg"}
                alt="Generated"
                className={cn(
                  "max-w-full max-h-full transition-all duration-700 ease-out cursor-pointer",
                  "lg:w-full lg:h-full lg:object-contain",
                  imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
                )}
                onLoad={() => setImageLoaded(true)}
                onClick={onOpenFullscreen}
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-center py-6 select-none bg-black/20">
            <div>
              <div className="w-8 h-8 md:w-16 md:h-16 mx-auto mb-3 border border-gray-600 flex items-center justify-center bg-black/50">
                <svg
                  className="w-4 h-4 md:w-8 md:h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              </div>
              <p className="text-xs text-gray-400 font-medium py-1 md:py-2">{t.readyToGenerate}</p>
            </div>
          </div>
        )}

        {/* Desktop Controls Container - Always visible if there are generations */}
        {generations.length > 0 && (
          <div className="hidden lg:flex flex-col items-center w-full absolute bottom-6 z-30 pointer-events-none gap-2">
            {/* Buttons - pointer-events-auto to allow clicking */}
            <div className="pointer-events-auto">
              {renderButtons("flex justify-center gap-2 transition-all duration-200")}
            </div>
          </div>
        )}
      </div>

      {/* Mobile/Tablet buttons - below the image container */}
      {generations.length > 0 && renderButtons("mt-3 md:mt-4 flex lg:hidden justify-center gap-2 flex-shrink-0")}
    </div>
  )
}
