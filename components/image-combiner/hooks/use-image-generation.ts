"use client"

import type React from "react"

import { useState } from "react"
import type { Generation } from "../types"

interface UseImageGenerationProps {
  prompt: string
  model: "nano-banana-pro" | "z-image"
  aspectRatio: string
  resolution: "1K" | "2K" | "4K"
  outputFormat: "PNG" | "JPG"
  image1: File | null
  image2: File | null
  image1Url: string
  image2Url: string
  useUrls: boolean
  generations: Generation[]
  setGenerations: React.Dispatch<React.SetStateAction<Generation[]>>
  addGeneration: (generation: Generation) => Promise<void>
  onToast: (message: string, type?: "success" | "error") => void
  onImageUpload: (file: File, imageNumber: 1 | 2) => Promise<void>
  onApiKeyMissing?: () => void
  setUseUrls: (use: boolean) => void
  onUrlChange: (url: string, slot: 1 | 2) => void
  t: Record<string, string>
  userCredits: number | null
}

interface GenerateImageOptions {
  prompt?: string
  aspectRatio?: string
  selectedModel?: string
  image1?: File | null
  image2?: File | null
  image1Url?: string
  image2Url?: string
  useUrls?: boolean
}

const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime)

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
  } catch (error) {
    console.log("Could not play sound:", error)
  }
}

export function useImageGeneration({
  prompt,
  model,
  aspectRatio,
  resolution,
  outputFormat,
  image1,
  image2,
  image1Url,
  image2Url,
  useUrls,
  generations,
  setGenerations,
  addGeneration,
  onToast,
  onImageUpload,
  onApiKeyMissing,
  setUseUrls,
  onUrlChange,
  t,
  userCredits,
}: UseImageGenerationProps) {
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const cancelGeneration = (generationId: string) => {
    const generation = generations.find((g) => g.id === generationId)
    if (generation?.abortController) {
      generation.abortController.abort()
    }

    setGenerations((prev) =>
      prev.map((gen) =>
        gen.id === generationId && gen.status === "loading"
          ? { ...gen, status: "error" as const, error: "Cancelled by user", progress: 0, abortController: undefined }
          : gen,
      ),
    )
    onToast("Generation cancelled", "error")
  }

  const generateImage = async (options?: GenerateImageOptions) => {
    const effectivePrompt = options?.prompt ?? prompt
    const effectiveAspectRatio = options?.aspectRatio ?? aspectRatio
    const effectiveImage1 = options?.image1 !== undefined ? options.image1 : image1
    const effectiveImage2 = options?.image2 !== undefined ? options.image2 : image2
    const effectiveImage1Url = options?.image1Url !== undefined ? options.image1Url : image1Url
    const effectiveImage2Url = options?.image2Url !== undefined ? options.image2Url : image2Url
    const effectiveUseUrls = options?.useUrls !== undefined ? options.useUrls : useUrls

    const hasImages = effectiveUseUrls ? effectiveImage1Url || effectiveImage2Url : effectiveImage1 || effectiveImage2

    if (!effectivePrompt.trim()) {
      onToast("Please enter a prompt", "error")
      return
    }

    // Client-side credit check
    if (userCredits !== null) {
      let estimatedCost = 0
      if (model === "nano-banana-pro") {
        estimatedCost = resolution === "4K" ? 24 : 18
      } else if (model === "z-image") {
        estimatedCost = 0.8
      }

      if (userCredits < estimatedCost) {
        onToast(`Insufficient credits: You have ${userCredits} credits, but this generation costs ${estimatedCost} credits.`, "error")
        return
      }
    }

    const numVariations = 1
    const generationPromises = []

    for (let i = 0; i < numVariations; i++) {
      const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const controller = new AbortController()

      const newGeneration: Generation = {
        id: generationId,
        status: "loading",
        progress: 0,
        imageUrl: null,
        prompt: effectivePrompt,
        timestamp: Date.now() + i,
        abortController: controller,
      }

      setGenerations((prev) => [newGeneration, ...prev])

      if (i === 0) {
        setSelectedGenerationId(generationId)
      }

      const progressInterval = setInterval(() => {
        setGenerations((prev) =>
          prev.map((gen) => {
            if (gen.id === generationId && gen.status === "loading") {
              const next =
                gen.progress >= 98
                  ? 98
                  : gen.progress >= 96
                    ? gen.progress + 0.2
                    : gen.progress >= 90
                      ? gen.progress + 0.5
                      : gen.progress >= 75
                        ? gen.progress + 0.8
                        : gen.progress >= 50
                          ? gen.progress + 1
                          : gen.progress >= 25
                            ? gen.progress + 1.2
                            : gen.progress + 1.5
              return { ...gen, progress: Math.min(next, 98) }
            }
            return gen
          }),
        )
      }, 100)

      const generationPromise = (async () => {
        try {
          const formData = new FormData()
          formData.append("prompt", effectivePrompt)
          formData.append("model", model)
          formData.append("aspectRatio", effectiveAspectRatio)
          formData.append("resolution", resolution)
          formData.append("outputFormat", outputFormat)

          // Add image inputs if present
          if (hasImages) {
            if (effectiveUseUrls) {
              if (effectiveImage1Url) {
                formData.append("image1Url", effectiveImage1Url)
              }
              if (effectiveImage2Url) {
                formData.append("image2Url", effectiveImage2Url)
              }
            } else {
              if (effectiveImage1) {
                formData.append("image1", effectiveImage1)
              }
              if (effectiveImage2) {
                formData.append("image2", effectiveImage2)
              }
            }
          }

          const response = await fetch("/api/generate-image", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }))

            if (errorData.error === "Configuration error" && errorData.details?.includes("KIEAI_API_KEY")) {
              clearInterval(progressInterval)
              setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))
              onApiKeyMissing?.()
              return
            }

            throw new Error(`${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`)
          }

          const data = await response.json()

          clearInterval(progressInterval)

          if (data.url) {
            const completedGeneration: Generation = {
              id: data.id || generationId, // Use ID from API response
              status: "complete",
              progress: 100,
              imageUrl: data.url,
              imageUrls: data.urls,
              prompt: data.prompt || effectivePrompt,
              mode: data.mode, // Required field from API
              timestamp: Date.now(),
              aspectRatio: data.aspectRatio || effectiveAspectRatio,
              model: model,
              cost: data.cost,
            }

            setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))

            await addGeneration(completedGeneration)
          }

          if (selectedGenerationId === generationId) {
            setImageLoaded(true)
          }

          playSuccessSound()
        } catch (error) {
          console.error("Error in generation:", error)
          clearInterval(progressInterval)

          if (error instanceof Error && error.name === "AbortError") {
            return
          }

          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

          if (errorMessage.includes("Credits insufficient") || errorMessage.includes("insufficient credits")) {
            onToast(t.insufficientCredits || errorMessage, "error")
          } else {
            onToast(`Error generating image: ${errorMessage}`, "error")
          }

          setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))
        }
      })()

      generationPromises.push(generationPromise)
    }

    await Promise.all(generationPromises)
  }

  const loadGeneratedAsInput = async () => {
    const selectedGeneration = generations.find((g) => g.id === selectedGenerationId)

    if (!selectedGeneration?.imageUrl) {
      onToast("No image selected", "error")
      return
    }

    try {
      // Switch to URL mode
      setUseUrls(true)

      // Smart slot selection
      if (!image1Url) {
        onUrlChange(selectedGeneration.imageUrl, 1)
        onToast(t.urlLoadedSlot1 || "Image loaded into Input 1", "success")
      } else {
        onUrlChange(selectedGeneration.imageUrl, 2)
        onToast(t.urlLoadedSlot2 || "Image loaded into Input 2", "success")
      }
    } catch (error) {
      console.error("Error loading image as input:", error)
      onToast("Error loading image", "error")
    }
  }

  return {
    selectedGenerationId,
    setSelectedGenerationId,
    imageLoaded,
    setImageLoaded,
    generateImage,
    cancelGeneration,
    loadGeneratedAsInput,
  }
}
