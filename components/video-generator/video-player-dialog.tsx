"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, Copy } from "lucide-react"
import { toast } from "sonner"
import type { VideoGeneration } from "@/types/video"

interface VideoPlayerDialogProps {
  video: VideoGeneration
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VideoPlayerDialog({ video, open, onOpenChange }: VideoPlayerDialogProps) {
  const videoUrl = video.video_uri || video.video_url

  const handleCopyUrl = () => {
    if (videoUrl) {
      navigator.clipboard.writeText(videoUrl)
      toast.success("Video URL copied to clipboard")
    }
  }

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a")
      link.href = videoUrl
      link.download = `video-${video.id}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleOpenInNewTab = () => {
    if (videoUrl) {
      window.open(videoUrl, "_blank")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Video Player</DialogTitle>
          <DialogDescription>{video.mode}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {videoUrl ? (
              <video src={videoUrl} controls autoPlay className="w-full h-full">
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No video available
              </div>
            )}
          </div>

          {/* Video Details */}
          <div className="space-y-3">
            {video.prompt && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Prompt</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {video.prompt}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{video.mode}</Badge>
              <Badge variant="outline">{video.model}</Badge>
              <Badge variant="outline">{video.resolution}</Badge>
              <Badge variant="outline">{video.aspect_ratio}</Badge>
              {video.duration && <Badge variant="outline">{video.duration}</Badge>}
              {video.task_id && (
                <span className="text-xs text-muted-foreground">
                  Task ID: {video.task_id.slice(0, 12)}...
                </span>
              )}
            </div>

            {video.created_at && (
              <p className="text-xs text-muted-foreground">
                Created: {new Date(video.created_at).toLocaleString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              disabled={!videoUrl}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!videoUrl}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              disabled={!videoUrl}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
