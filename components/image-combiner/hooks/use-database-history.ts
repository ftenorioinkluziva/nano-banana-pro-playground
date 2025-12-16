"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Generation } from "../types"

export function useDatabaseHistory(onToast?: (message: string, type: "success" | "error") => void) {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const isMountedRef = useRef(true)
  const onToastRef = useRef(onToast)

  // Update onToastRef when onToast changes
  useEffect(() => {
    onToastRef.current = onToast
  }, [onToast])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Load generations from database only
  const loadGenerations = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/get-generations?limit=50")
      if (response.ok) {
        const data = await response.json()
        if (isMountedRef.current) {
          // Transform database format (snake_case) to Generation type (camelCase)
          const dbGens: Generation[] = data.generations.map((gen: any) => ({
            id: gen.id,
            status: gen.status || "complete",
            progress: gen.status === "complete" ? 100 : 0,
            imageUrl: gen.image_url,
            prompt: gen.prompt,
            error: gen.error_message || undefined,
            timestamp: new Date(gen.created_at).getTime(),
            mode: gen.mode,
            aspectRatio: gen.aspect_ratio,
            model: gen.model,
            enhancedPrompt: gen.enhanced_prompt,
            description: gen.description,
            imageUrls: gen.image_urls,
          }))
          setGenerations(dbGens)
        }
      } else {
        console.error("Failed to fetch generations from database")
        onToastRef.current?.("Failed to load generation history", "error")
      }
    } catch (error) {
      console.error("Error fetching generations from database:", error)
      onToastRef.current?.("Failed to load generation history", "error")
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  // Load on mount only once
  useEffect(() => {
    loadGenerations()
  }, [loadGenerations])

  const addGeneration = useCallback(
    async (generation: Generation) => {
      // Add to state optimistically
      setGenerations((prev) => [generation, ...prev])

      // Save to database
      setIsSyncing(true)
      try {
        const response = await fetch("/api/save-generation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: generation.id,
            prompt: generation.prompt,
            enhancedPrompt: generation.enhancedPrompt,
            mode: generation.mode,
            imageUrl: generation.imageUrl,
            imageUrls: generation.imageUrls,
            aspectRatio: generation.aspectRatio,
            model: generation.model,
            description: generation.description,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error("Error saving to database:", error)
          onToastRef.current?.("Failed to save to database", "error")
          // Reload from database to get correct state
          loadGenerations()
        }
      } catch (error) {
        console.error("Error saving generation to database:", error)
        onToastRef.current?.("Failed to save to database", "error")
        // Reload from database to get correct state
        loadGenerations()
      } finally {
        setIsSyncing(false)
      }
    },
    [loadGenerations],
  )

  const deleteGeneration = useCallback(
    async (id: string) => {
      // Remove from state optimistically
      setGenerations((prev) => prev.filter((g) => g.id !== id))

      // Delete from database
      try {
        const response = await fetch(`/api/delete-generation?id=${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const error = await response.json()
          console.error("Error deleting from database:", error)
          onToastRef.current?.("Failed to delete from database", "error")
          // Reload from database to get correct state
          loadGenerations()
        }
      } catch (error) {
        console.error("Error deleting generation from database:", error)
        onToastRef.current?.("Failed to delete from database", "error")
        // Reload from database to get correct state
        loadGenerations()
      }
    },
    [loadGenerations],
  )

  const clearHistory = useCallback(async () => {
    // Just clear the state - don't delete from database
    setGenerations([])
    // Note: We don't delete from database to preserve history
    // Users can manually delete individual items
  }, [])

  const updateGeneration = useCallback((id: string, updates: Partial<Generation>) => {
    setGenerations((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
      return updated
    })
  }, [])

  return {
    generations,
    setGenerations,
    addGeneration,
    deleteGeneration,
    clearHistory,
    updateGeneration,
    isLoading,
    isSyncing,
    hasMore: false,
    loadMore: () => {},
    isLoadingMore: false,
  }
}
