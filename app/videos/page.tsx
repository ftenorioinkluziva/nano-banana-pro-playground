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

const DEFAULT_APP_STATE: AppState = AppStateEnum.IDLE

export default function VideosPage() {
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

      // Add basic params
      formData.append("prompt", params.prompt)
      formData.append("mode", params.mode)
      formData.append("resolution", params.resolution)
      formData.append("aspectRatio", params.aspectRatio)
      formData.append("duration", params.duration || "6s")
      formData.append("model", params.model)
      if (params.negativePrompt) {
        formData.append("negativePrompt", params.negativePrompt)
      }

      // Add mode-specific data
      if (params.mode === "Frames to Video") {
        if (params.startFrame) {
          formData.append("startFrame", params.startFrame.file)
        }
        if (params.endFrame) {
          formData.append("endFrame", params.endFrame.file)
        }
        if (params.isLooping !== undefined) {
          formData.append("isLooping", String(params.isLooping))
        }
      } else if (params.mode === "References to Video") {
        if (params.referenceImages && params.referenceImages.length > 0) {
          // Send reference images with indexed keys as expected by API
          params.referenceImages.forEach((img, index) => {
            formData.append(`referenceImage${index}`, img.file)
          })
        }
        if (params.styleImage) {
          formData.append("styleImage", params.styleImage.file)
        }
      } else if (params.mode === "Extend Video") {
        if (params.originalTaskId) {
          formData.append("originalTaskId", params.originalTaskId)
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
        throw new Error(errorData.details || errorData.error || "Failed to generate video")
      }

      const data = await response.json()

      console.log("Video generation completed:", data)

      setProgress(100)

      // Generate unique ID for this generation
      const generationId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create video generation record from the complete response
      const generation: VideoGeneration = {
        id: generationId,
        prompt: params.prompt,
        mode: params.mode,
        status: "complete",
        video_url: data.videoUrl, // Use the base64 data URL from API
        video_uri: data.videoUri, // Keep the original URI for reference
        resolution: params.resolution,
        aspect_ratio: params.aspectRatio,
        model: params.model,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setCurrentVideo(generation)
      setAppState(AppStateEnum.SUCCESS)

      // Save to database in the background
      try {
        const saveResponse = await fetch("/api/save-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: generationId,
            prompt: params.prompt,
            negativePrompt: params.negativePrompt,
            mode: params.mode,
            videoUri: data.videoUri,
            taskId: data.taskId, // Save the task ID for Extend Video
            resolution: params.resolution,
            aspectRatio: params.aspectRatio,
            duration: params.duration,
            model: data.model,
          }),
        })

        if (!saveResponse.ok) {
          console.error("Failed to save video to database")
        } else {
          console.log("Video saved to database successfully")
          // Refresh video history after successful save
          fetchVideoHistory()
        }
      } catch (saveError) {
        console.error("Error saving video:", saveError)
        // Don't fail the generation if save fails
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      setAppState(AppStateEnum.ERROR)
    } finally {
      setGenerating(false)
    }
  }, [fetchVideoHistory])

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
      alert("Video URL not available")
      return
    }

    // Create a link and trigger download
    const link = document.createElement("a")
    link.href = videoUrl
    link.download = `creato-video-${videoId}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Video Generation</h1>
            <p className="text-zinc-400">
              Create stunning videos with AI-powered generation
            </p>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Generation Form/Result */}
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
                    message="Generating your video... This may take several minutes."
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
                    title="Failed to generate video"
                    message={error || "An unexpected error occurred"}
                    onRetry={handleRetry}
                    onGoBack={handleNewVideo}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Video History */}
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
