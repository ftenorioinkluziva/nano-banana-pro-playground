"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Generation } from "../types"

const STORAGE_KEY = "nb2_generations"
const MAX_STORED_LOCALLY = 50 // Keep generation metadata only

// Store only metadata, not full image data
function saveGenerationMetadata(generation: Generation) {
  const metadata = {
    id: generation.id,
    prompt: generation.prompt,
    enhancedPrompt: generation.enhancedPrompt,
    mode: generation.mode,
    status: generation.status,
    aspectRatio: generation.aspectRatio,
    model: generation.model,
    description: generation.description,
    created_at: generation.created_at,
    updated_at: generation.updated_at,
  }
  return metadata
}

function getLocalGenerations(): Generation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error("Error loading generations from localStorage:", error)
    return []
  }
}

function saveLocalGeneration(generation: Generation) {
  try {
    const current = getLocalGenerations()
    // Store only metadata, not the full generation with images
    const metadata = saveGenerationMetadata(generation)
    const updated = [metadata, ...current].slice(0, MAX_STORED_LOCALLY)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded, clearing old data")
      try {
        localStorage.removeItem(STORAGE_KEY)
        // Retry with empty localStorage
        const metadata = saveGenerationMetadata(generation)
        localStorage.setItem(STORAGE_KEY, JSON.stringify([metadata]))
      } catch (retryError) {
        console.error("Failed to save even after clearing localStorage:", retryError)
      }
    } else {
      console.error("Error saving generation to localStorage:", error)
    }
  }
}

function deleteLocalGeneration(id: string) {
  try {
    const current = getLocalGenerations()
    const updated = current.filter((g) => g.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error deleting generation from localStorage:", error)
  }
}

function clearLocalGenerations() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing localStorage:", error)
  }
}

export function useDatabaseHistory(onToast?: (message: string, type: "success" | "error") => void) {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const isMountedRef = useRef(true)
  const syncTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  // Load generations from localStorage on mount
  useEffect(() => {
    const loadGenerations = async () => {
      setIsLoading(true)

      const localGens = getLocalGenerations()
      if (isMountedRef.current) {
        setGenerations(localGens)
      }

      // Try to fetch from database in the background
      try {
        const response = await fetch("/api/get-generations?limit=50")
        if (response.ok) {
          const data = await response.json()
          if (isMountedRef.current) {
            // Merge database generations with local ones
            const dbGens = data.generations as Generation[]
            const merged = [
              ...localGens,
              ...dbGens.filter((g) => !localGens.some((lg) => lg.id === g.id)),
            ].slice(0, MAX_STORED_LOCALLY)
            setGenerations(merged)
          }
        }
      } catch (error) {
        console.error("Error fetching generations from database:", error)
      }

      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }

    loadGenerations()
  }, [])

  const addGeneration = useCallback(
    async (generation: Generation) => {
      // Save to localStorage immediately
      saveLocalGeneration(generation)

      setGenerations((prev) => {
        const updated = [generation, ...prev]
        return updated
      })

      // Save to database asynchronously
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
          onToast?.("Saved locally but failed to sync to database", "error")
        }
      } catch (error) {
        console.error("Error syncing generation to database:", error)
        onToast?.("Saved locally but failed to sync to database", "error")
      } finally {
        setIsSyncing(false)
      }
    },
    [onToast],
  )

  const deleteGeneration = useCallback(
    async (id: string) => {
      // Remove from local immediately
      setGenerations((prev) => prev.filter((g) => g.id !== id))
      deleteLocalGeneration(id)

      // Delete from database
      try {
        const response = await fetch(`/api/delete-generation?id=${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const error = await response.json()
          console.error("Error deleting from database:", error)
        }
      } catch (error) {
        console.error("Error deleting generation from database:", error)
      }
    },
    [],
  )

  const clearHistory = useCallback(async () => {
    clearLocalGenerations()
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
