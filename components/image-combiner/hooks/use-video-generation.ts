"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { GenerateVideoParams, VideoGeneration } from "@/types/video"

interface UseVideoGenerationReturn {
  generating: boolean
  progress: number
  error: string | null
  generateVideo: (params: GenerateVideoParams) => Promise<VideoGeneration | null>
  cancelGeneration: () => void
}

export function useVideoGeneration(): UseVideoGenerationReturn {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const cancelTokenRef = useRef<AbortController | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const cancelGeneration = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.abort()
      cancelTokenRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    setGenerating(false)
    setProgress(0)
  }, [])

  const generateVideo = useCallback(
    async (params: GenerateVideoParams): Promise<VideoGeneration | null> => {
      setGenerating(true)
      setProgress(0)
      setError(null)

      cancelTokenRef.current = new AbortController()

      // Simulate progress updates (0% to 80% while generating)
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) {
            return prev
          }
          return prev + Math.random() * 10
        })
      }, 2000)

      try {
        const formData = new FormData()

        // Add basic params
        formData.append("prompt", params.prompt)
        formData.append("mode", params.mode)
        formData.append("resolution", params.resolution)
        formData.append("aspectRatio", params.aspectRatio)
        formData.append("model", params.model)

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
          if (params.inputVideo) {
            formData.append("inputVideo", params.inputVideo.file)
          }
        }

        const response = await fetch("/api/generate-video", {
          method: "POST",
          body: formData,
          signal: cancelTokenRef.current.signal,
        })

        setProgress(90)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || errorData.error || "Failed to generate video")
        }

        const data = await response.json()
        setProgress(100)

        // Create video generation record
        const generation: VideoGeneration = {
          id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

        return generation
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred while generating video"
        setError(errorMessage)
        console.error("Video generation error:", err)
        return null
      } finally {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
        setGenerating(false)
      }
    },
    []
  )

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  return {
    generating,
    progress,
    error,
    generateVideo,
    cancelGeneration,
  }
}
