"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Download, RotateCcw, Plus } from "lucide-react"
import type { VideoGeneration } from "@/types/video"

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
  const handleDownload = () => {
    if (video.video_url || video.video_uri) {
      onDownload(video.video_url || video.video_uri || "", video.id)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Video Display */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Generated Video</h3>
        <div className="bg-black rounded-lg overflow-hidden border border-gray-800 aspect-video flex items-center justify-center">
          {video.video_url || video.video_uri ? (
            <video
              src={video.video_url || video.video_uri}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <p className="text-zinc-400">Video URL not available</p>
          )}
        </div>
      </div>

      {/* Video Details */}
      <div className="bg-black/50 border border-gray-800 rounded-lg p-4 space-y-3">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Mode</p>
          <p className="text-white font-medium">{video.mode}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Resolution</p>
          <p className="text-white font-medium">{video.resolution}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Aspect Ratio</p>
          <p className="text-white font-medium">{video.aspect_ratio}</p>
        </div>
        {video.prompt && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Prompt</p>
            <p className="text-white text-sm line-clamp-3">{video.prompt}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
        >
          <Download size={18} className="mr-2" />
          Download
        </Button>
        <Button
          onClick={onRetry}
          variant="outline"
          className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
        >
          <RotateCcw size={18} className="mr-2" />
          Retry
        </Button>
        <Button
          onClick={onNewVideo}
          className="h-10 md:h-12 text-sm md:text-base font-semibold !bg-white !text-black hover:!bg-gray-200"
        >
          <Plus size={18} className="mr-2" />
          New Video
        </Button>
      </div>
    </div>
  )
}
