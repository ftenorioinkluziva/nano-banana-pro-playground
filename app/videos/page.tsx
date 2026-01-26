"use client"

import React, { useState, useCallback } from "react"
import { VideoGenerationForm } from "@/components/video-generator/video-generation-form"
import { VideoResult } from "@/components/video-generator/video-result"
import type { GenerateVideoParams, VideoGeneration, AppState } from "@/types/video"
import { AppState as AppStateEnum } from "@/types/video"
import {
  AppErrorBoundary,
  ProgressSpinner,
  CenteredError,
} from "@/components/shared"
import { useVideoDatabaseHistory } from "@/components/video-generator/hooks/use-video-database-history"
import { VideoHistory } from "@/components/video-generator/video-history"
import { useLanguage } from "@/components/language-provider"

const DEFAULT_APP_STATE: AppState = AppStateEnum.IDLE

export default function VideosPage() {
  const { t } = useLanguage()
  const [appState, setAppState] = useState<AppState>(DEFAULT_APP_STATE)
  const [currentVideo, setCurrentVideo] = useState<VideoGeneration | null>(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Use video database history hook
  const {
    videos: videoHistory,
    isLoading: loadingHistory,
    refreshHistory: fetchVideoHistory,
    deleteVideo,
  } = useVideoDatabaseHistory()

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    setGenerating(true)
    setProgress(0)
    setError(null)
    setLastConfig(params)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) return prev
          return prev + Math.random() * 15
        })
      }, 1500)

      const formData = new FormData()

      // Params
      if (params.modelId && params.generationTypeId) {
        formData.append("modelId", params.modelId)
        formData.append("generationTypeId", params.generationTypeId)
        formData.append("prompt", params.prompt)
        formData.append("resolution", params.resolution)
        formData.append("duration", params.duration || "6s")

        if (params.aspectRatio) {
          formData.append("aspectRatio", params.aspectRatio)
        }
        if (params.negativePrompt) {
          formData.append("negativePrompt", params.negativePrompt)
        }

        // Images
        if (params.images && params.images.length > 0) {
          params.images.forEach((img, index) => {
            formData.append(`image${index}`, img.file)
          })
        }

        // Videos
        if (params.videos && params.videos.length > 0) {
          params.videos.forEach((vid, index) => {
            formData.append(`video${index}`, vid.file)
          })
        }

        // TaskId
        if (params.taskId) {
          formData.append("taskId", params.taskId)
        }
      }

      const response = await fetch("/api/generate-video", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(90)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || t.generationFailed)
      }

      const data = await response.json()
      setProgress(100)

      const generationId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const generation: VideoGeneration = {
        id: generationId,
        prompt: params.prompt,
        mode: params.mode || "text-to-video",
        status: "complete",
        video_url: data.videoUrl,
        video_uri: data.videoUri,
        resolution: params.resolution,
        aspect_ratio: params.aspectRatio,
        model: params.modelId || "veo-fast",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setCurrentVideo(generation)
      setAppState(AppStateEnum.SUCCESS)

      // Save to database
      try {
        await fetch("/api/save-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: generationId,
            prompt: params.prompt,
            negativePrompt: params.negativePrompt,
            mode: params.mode || "text-to-video",
            videoUri: data.videoUri,
            taskId: data.taskId,
            resolution: params.resolution,
            aspectRatio: params.aspectRatio,
            duration: params.duration,
            model: data.model,
          }),
        })
        fetchVideoHistory()
      } catch (saveError) {
        console.error("Error saving video:", saveError)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.generationFailed
      setError(errorMessage)
      setAppState(AppStateEnum.ERROR)
    } finally {
      setGenerating(false)
    }
  }, [fetchVideoHistory, t.generationFailed])

  const handleNewVideo = useCallback(() => {
    setAppState(AppStateEnum.IDLE)
    setCurrentVideo(null)
    setError(null)
    setProgress(0)
  }, [])

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      handleGenerate(lastConfig)
    }
  }, [lastConfig, handleGenerate])

  const handleDownload = useCallback((videoUrl: string, videoId: string) => {
    if (!videoUrl) {
      alert(t.videoUrlNotAvailable)
      return
    }

    const link = document.createElement("a")
    link.href = videoUrl
    link.download = `creato-video-${videoId}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [t.videoUrlNotAvailable])

  // Fetch products
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await fetch("/api/products")
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [])

  const handleProductSelect = useCallback((productId: string) => {
    const product = products.find((p) => p.id.toString() === productId)
    setSelectedProduct(product || null)
  }, [products])

  const handleClearProduct = useCallback(() => {
    setSelectedProduct(null)
  }, [])

  return (
    <AppErrorBoundary>
      <main className="min-h-screen bg-black p-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2" suppressHydrationWarning>{t.videoGenerationTitle}</h1>
            <p className="text-zinc-400" suppressHydrationWarning>{t.videoGenerationSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {appState === AppStateEnum.IDLE && (
                <VideoGenerationForm
                  onGenerate={handleGenerate}
                  generating={generating}
                  progress={progress}
                  error={error}
                  products={products}
                  selectedProduct={selectedProduct}
                  loadingProducts={loadingProducts}
                  onProductSelect={handleProductSelect}
                  onClearProduct={handleClearProduct}
                  videoHistory={videoHistory}
                  loadingHistory={loadingHistory}
                />
              )}

              {appState === AppStateEnum.LOADING && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
                  <ProgressSpinner
                    progress={progress}
                    message={`${t.generating} ${t.longerVideosTakeMoreTime}`}
                    size="lg"
                  />
                </div>
              )}

              {appState === AppStateEnum.SUCCESS && currentVideo && (
                <VideoResult
                  video={currentVideo}
                  onNewVideo={handleNewVideo}
                  onRetry={handleRetry}
                  onDownload={handleDownload}
                />
              )}

              {appState === AppStateEnum.ERROR && error && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
                  <CenteredError
                    title={t.generationFailed}
                    message={error}
                    onRetry={handleRetry}
                    onGoBack={handleNewVideo}
                  />
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <VideoHistory
                videos={videoHistory}
                isLoading={loadingHistory}
                onDelete={deleteVideo}
                onRefresh={fetchVideoHistory}
              />
            </div>
          </div>
        </div>
      </main>
    </AppErrorBoundary>
  )
}
