import { useState, useCallback } from "react"
import type { VideoGeneration } from "@/types/video"

export function useVideoDatabase() {
  const [videos, setVideos] = useState<VideoGeneration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all videos from database
  const fetchVideos = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/get-videos")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || "Failed to fetch videos")
      }

      const data = await response.json()
      setVideos(data.videos || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      console.error("Error fetching videos:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save a video to database
  const saveVideo = useCallback(
    async (video: VideoGeneration) => {
      setError(null)

      try {
        const response = await fetch("/api/save-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: video.id,
            prompt: video.prompt,
            negativePrompt: video.negativePrompt,
            mode: video.mode,
            videoUri: video.video_uri || video.video_url || "",
            resolution: video.resolution,
            aspectRatio: video.aspect_ratio,
            duration: video.duration?.toString() || "6s",
            model: video.model,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || errorData.error || "Failed to save video")
        }

        // Update local state
        setVideos((prev) => {
          const exists = prev.some((v) => v.id === video.id)
          if (exists) {
            return prev.map((v) => (v.id === video.id ? video : v))
          }
          return [video, ...prev]
        })

        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setError(errorMessage)
        console.error("Error saving video:", err)
        return false
      }
    },
    []
  )

  // Delete a video from database
  const deleteVideo = useCallback(async (videoId: string) => {
    setError(null)

    try {
      const response = await fetch("/api/delete-video", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || "Failed to delete video")
      }

      // Update local state
      setVideos((prev) => prev.filter((v) => v.id !== videoId))

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      console.error("Error deleting video:", err)
      return false
    }
  }, [])

  return {
    videos,
    loading,
    error,
    fetchVideos,
    saveVideo,
    deleteVideo,
  }
}
