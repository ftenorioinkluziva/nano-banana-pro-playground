"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { VideoGeneration } from "@/types/video"

export function useVideoDatabaseHistory(onToast?: (message: string, type: "success" | "error") => void) {
  const [videos, setVideos] = useState<VideoGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
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

  // Load videos from database
  const loadVideos = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/videos?limit=50")
      if (response.ok) {
        const data = await response.json()
        if (isMountedRef.current) {
          setVideos(data.videos || [])
          setHasMore(data.pagination?.hasMore || false)
        }
      } else {
        console.error("Failed to fetch videos from database")
        onToastRef.current?.("Failed to load video history", "error")
      }
    } catch (error) {
      console.error("Error fetching videos from database:", error)
      onToastRef.current?.("Failed to load video history", "error")
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  // Load on mount only once
  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  const addVideo = useCallback(
    async (video: VideoGeneration) => {
      // Add to state optimistically
      setVideos((prev) => [video, ...prev])

      // Save to database
      setIsSyncing(true)
      try {
        const response = await fetch("/api/save-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: video.id,
            prompt: video.prompt,
            negativePrompt: video.negative_prompt,
            mode: video.mode,
            videoUri: video.video_uri,
            videoUrl: video.video_url,
            taskId: video.task_id,
            resolution: video.resolution,
            aspectRatio: video.aspect_ratio,
            duration: video.duration,
            model: video.model,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error("Error saving video to database:", error)
          onToastRef.current?.("Failed to save video to database", "error")
          // Reload from database to get correct state
          loadVideos()
        }
      } catch (error) {
        console.error("Error saving video to database:", error)
        onToastRef.current?.("Failed to save video to database", "error")
        // Reload from database to get correct state
        loadVideos()
      } finally {
        setIsSyncing(false)
      }
    },
    [loadVideos],
  )

  const deleteVideo = useCallback(
    async (id: string) => {
      // Remove from state optimistically
      setVideos((prev) => prev.filter((v) => v.id !== id))

      // Delete from database
      try {
        const response = await fetch(`/api/delete-video?id=${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const error = await response.json()
          console.error("Error deleting video from database:", error)
          onToastRef.current?.("Failed to delete video from database", "error")
          // Reload from database to get correct state
          loadVideos()
        }
      } catch (error) {
        console.error("Error deleting video from database:", error)
        onToastRef.current?.("Failed to delete video from database", "error")
        // Reload from database to get correct state
        loadVideos()
      }
    },
    [loadVideos],
  )

  const clearHistory = useCallback(async () => {
    // Just clear the state - don't delete from database
    setVideos([])
    // Note: We don't delete from database to preserve history
    // Users can manually delete individual items
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const response = await fetch(`/api/videos?limit=50&offset=${videos.length}`)
      if (response.ok) {
        const data = await response.json()
        if (isMountedRef.current) {
          setVideos((prev) => [...prev, ...(data.videos || [])])
          setHasMore(data.pagination?.hasMore || false)
        }
      }
    } catch (error) {
      console.error("Error loading more videos:", error)
      onToastRef.current?.("Failed to load more videos", "error")
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMore(false)
      }
    }
  }, [videos.length, hasMore, isLoadingMore])

  return {
    videos,
    setVideos,
    addVideo,
    deleteVideo,
    clearHistory,
    isLoading,
    isSyncing,
    hasMore,
    loadMore,
    isLoadingMore,
    refreshHistory: loadVideos,
  }
}
