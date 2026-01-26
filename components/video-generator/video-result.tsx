"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Download, RotateCcw, Plus } from "lucide-react"
import type { VideoGeneration } from "@/types/video"
import { useLanguage } from "@/components/language-provider"

interface VideoResultProps {
  video: VideoGeneration
  onNewVideo: () => void
  onRetry: () => void
  onDownload: (videoUrl: string, videoId: string) => void
}

export function VideoResult({
  video,
  onNewVideo,
  onRetry,
  onDownload,
}: VideoResultProps) {
  const { t } = useLanguage()
  const [currentVideo, setCurrentVideo] = React.useState(video)

  // Sync state if prop changes (e.g. user selects a different video from history)
  React.useEffect(() => {
    setCurrentVideo(video)
  }, [video])

  const handleDownload = () => {
    if (currentVideo.video_url || currentVideo.video_uri) {
      onDownload(currentVideo.video_url || currentVideo.video_uri || "", currentVideo.id)
    }
  }

  const getAspectRatioClass = (aspectRatio: string) => {
    const ratioMap: Record<string, string> = {
      "16:9": "aspect-video",
      "9:16": "aspect-[9/16]",
      "1:1": "aspect-square",
      "4:3": "aspect-[4/3]",
      "3:4": "aspect-[3/4]",
      "21:9": "aspect-[21/9]",
    }
    return ratioMap[aspectRatio] || "aspect-video"
  }

  const formatModeName = (mode: string) => {
    switch (mode) {
      case "text-to-video": return t.textToVideo || mode
      case "image-to-video": return t.imageToVideo || mode
      case "video-to-video": return t.videoToVideo || mode
      case "frames-to-video": return t.framesToVideo || mode
      case "references-to-video": return t.referencesToVideo || mode
      case "extend-video": return t.extendVideo || mode
      default: return mode
    }
  }

  if (!currentVideo) {
    return null
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">{t.generatedVideo}</h3>
        <div className={`bg-black rounded-lg overflow-hidden border border-zinc-800 ${getAspectRatioClass(currentVideo.aspect_ratio || "16:9")} flex items-center justify-center mx-auto max-w-full`}>
          {currentVideo.video_url || currentVideo.video_uri ? (
            <video
              src={currentVideo.video_url || currentVideo.video_uri}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <p className="text-zinc-400">{t.videoUrlNotAvailable}</p>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">{t.generationType}</p>
          <p className="text-white font-medium">{formatModeName(currentVideo.mode)}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">{t.resolution}</p>
            <p className="text-white font-medium">{currentVideo.resolution}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">{t.aspectRatio}</p>
            <p className="text-white font-medium">{currentVideo.aspect_ratio}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">{t.duration}</p>
            <p className="text-white font-medium">{currentVideo.duration || "6s"}</p>
          </div>
        </div>
        {currentVideo.prompt && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">{t.prompt}</p>
            <p className="text-white text-sm line-clamp-3">{currentVideo.prompt}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="bg-transparent border-zinc-800 text-white hover:bg-zinc-800"
        >
          <Download size={18} className="mr-2" />
          {t.download}
        </Button>
        <Button
          onClick={onRetry}
          variant="outline"
          className="bg-transparent border-zinc-800 text-white hover:bg-zinc-800"
        >
          <RotateCcw size={18} className="mr-2" />
          {t.retry}
        </Button>
        <Button
          onClick={onNewVideo}
          className="h-10 md:h-12 text-sm md:text-base font-semibold !bg-white !text-black hover:!bg-gray-200"
        >
          <Plus size={18} className="mr-2" />
          {t.newVideo}
        </Button>
      </div>

      {(currentVideo.model_id === "veo" || currentVideo.model_id === "veo-fast" || currentVideo.model === "veo3" || currentVideo.model === "veo3_fast") && (
        <div className="pt-4 border-t border-zinc-800">
          <h4 className="text-sm font-medium text-zinc-400 mb-3">Upscale & Enhance</h4>
          <div className="grid grid-cols-2 gap-3">
            <UpscaleButton
              video={currentVideo}
              resolution="1080p"
              cost={5}
              onSuccess={setCurrentVideo}
            />
            <UpscaleButton
              video={currentVideo}
              resolution="4k"
              cost={120}
              onSuccess={setCurrentVideo}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function UpscaleButton({
  video,
  resolution,
  cost,
  onSuccess
}: {
  video: VideoGeneration,
  resolution: "1080p" | "4k",
  cost: number,
  onSuccess: (video: VideoGeneration) => void
}) {
  const [loading, setLoading] = React.useState(false)

  const handleUpscale = async () => {
    if (!video.task_id) return
    if (!confirm(`Upscale to ${resolution} for ${cost} credits?`)) return

    setLoading(true)
    try {
      const res = await fetch("/api/generate-video/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: video.task_id,
          resolution
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error)

      // Update video with new URL
      onSuccess({
        ...video,
        video_url: data.videoUrl,
        resolution: resolution
      })
      alert(`Video successfully upscaled to ${resolution}!`)

    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="secondary"
      className="bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
      onClick={handleUpscale}
      disabled={loading}
    >
      {loading ? "Upscaling..." : `Get ${resolution} (${cost} credits)`}
    </Button>
  )
}
