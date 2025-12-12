"use client"

import { useState } from "react"

interface UsePromptEnhancementProps {
  onToast: (message: string, type?: "success" | "error") => void
}

interface EnhancementOptions {
  image1?: File | null
  image2?: File | null
  image1Url?: string
  image2Url?: string
}

export function usePromptEnhancement({ onToast }: UsePromptEnhancementProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<string[] | null>(null)

  const enhancePrompt = async (
    prompt: string,
    options?: EnhancementOptions,
  ): Promise<string | null> => {
    if (!prompt.trim()) {
      onToast("Please enter a prompt first", "error")
      return null
    }

    setIsEnhancing(true)
    try {
      const hasImages = options?.image1 || options?.image2 || options?.image1Url || options?.image2Url

      if (!hasImages) {
        // Use text-only enhancement
        const response = await fetch("/api/enhance-prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(errorData.error || "Failed to enhance prompt")
        }

        const data = await response.json()
        const enhanced = data.enhanced || ""

        setEnhancedPrompt(enhanced)
        setImageAnalysis(null)
        onToast("Prompt enhanced successfully", "success")

        return enhanced
      }

      // Use image-aware enhancement
      const formData = new FormData()
      formData.append("prompt", prompt)

      if (options?.image1) {
        formData.append("image1", options.image1)
      }
      if (options?.image1Url) {
        formData.append("image1Url", options.image1Url)
      }
      if (options?.image2) {
        formData.append("image2", options.image2)
      }
      if (options?.image2Url) {
        formData.append("image2Url", options.image2Url)
      }

      onToast("Analyzing images and enhancing prompt...", "success")

      const response = await fetch("/api/enhance-prompt-with-images", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to enhance prompt with image analysis")
      }

      const data = await response.json()
      const enhanced = data.enhanced || ""
      const analyses = data.imageAnalysis || null

      setEnhancedPrompt(enhanced)
      setImageAnalysis(analyses)
      onToast("Prompt enhanced with image context", "success")

      return enhanced
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      onToast(`Error enhancing prompt: ${errorMessage}`, "error")
      return null
    } finally {
      setIsEnhancing(false)
    }
  }

  const applyEnhancedPrompt = () => {
    return enhancedPrompt
  }

  const clearEnhancedPrompt = () => {
    setEnhancedPrompt(null)
    setImageAnalysis(null)
  }

  return {
    isEnhancing,
    enhancedPrompt,
    imageAnalysis,
    enhancePrompt,
    applyEnhancedPrompt,
    clearEnhancedPrompt,
  }
}
