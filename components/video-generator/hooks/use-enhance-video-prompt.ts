import { useState, useCallback } from "react"

interface EnhancementSuggestions {
  subject?: string
  action?: string
  style?: string
  camera?: string
  composition?: string
  ambiance?: string
}

interface EnhancedPromptResult {
  originalPrompt: string
  enhancedPrompt: string
  suggestions: EnhancementSuggestions
}

export function useEnhanceVideoPrompt() {
  const [enhancing, setEnhancing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enhancedResult, setEnhancedResult] = useState<EnhancedPromptResult | null>(null)

  const enhancePrompt = useCallback(
    async (prompt: string, mode?: string): Promise<EnhancedPromptResult | null> => {
      if (!prompt || prompt.trim().length === 0) {
        setError("Prompt cannot be empty")
        return null
      }

      setEnhancing(true)
      setError(null)
      setEnhancedResult(null)

      try {
        const response = await fetch("/api/enhance-video-prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            mode,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          const errorMessage = errorData.details || errorData.error || "Failed to enhance prompt"
          setError(errorMessage)
          return null
        }

        const data = (await response.json()) as EnhancedPromptResult
        setEnhancedResult(data)
        return data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setError(errorMessage)
        console.error("Error enhancing prompt:", err)
        return null
      } finally {
        setEnhancing(false)
      }
    },
    []
  )

  const clearEnhancement = useCallback(() => {
    setEnhancedResult(null)
    setError(null)
  }, [])

  return {
    enhancing,
    error,
    enhancedResult,
    enhancePrompt,
    clearEnhancement,
  }
}
