"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Clock, CheckCircle2, XCircle, Play, Download, Trash2 } from "lucide-react"
import type { VideoGeneration } from "@/types/video"
import { CenteredSpinner, NoHistoryEmptyState } from "@/components/shared"
import { VideoPlayerDialog } from "./video-player-dialog"
import { useLanguage } from "@/components/language-provider"

interface VideoHistoryProps {
  videos: VideoGeneration[]
  isLoading: boolean
  onDelete?: (id: string) => Promise<void>
  onRefresh?: () => void
}

export function VideoHistory({ videos, isLoading, onDelete, onRefresh }: VideoHistoryProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed" | "failed">("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoGeneration | null>(null)
  const [showPlayerDialog, setShowPlayerDialog] = useState(false)

  const getStatusIcon = (status: VideoGeneration["status"]) => {
    switch (status) {
      case "loading":
        return <Clock className="h-4 w-4 animate-pulse" />
      case "complete":
        return <CheckCircle2 className="h-4 w-4" />
      case "error":
        return <XCircle className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: VideoGeneration["status"]) => {
    const statusMap = {
      loading: { variant: "secondary" as const, label: t.processing },
      complete: { variant: "default" as const, label: t.complete },
      error: { variant: "destructive" as const, label: t.failed },
    }

    const { variant, label } = statusMap[status]

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {label}
      </Badge>
    )
  }

  const handlePlayVideo = (video: VideoGeneration) => {
    setSelectedVideo(video)
    setShowPlayerDialog(true)
  }

  const handleDownloadVideo = (video: VideoGeneration) => {
    if (video.video_uri || video.video_url) {
      const link = document.createElement("a")
      link.href = video.video_uri || video.video_url || ""
      link.download = `video-${video.id}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleDelete = async (id: string) => {
    if (!onDelete) return

    setDeletingId(id)
    try {
      await onDelete(id)
    } catch (error) {
      console.error("Failed to delete video:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const filteredVideos = videos.filter((video) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return video.status === "loading"
    if (activeTab === "completed") return video.status === "complete"
    if (activeTab === "failed") return video.status === "error"
    return true
  })

  const pendingCount = videos.filter((v) => v.status === "loading").length
  const completedCount = videos.filter((v) => v.status === "complete").length
  const failedCount = videos.filter((v) => v.status === "error").length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t.videoHistory}</span>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.refresh}
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {t.yourGeneratedVideos}
          {pendingCount > 0 && <span className="ml-2 text-yellow-600">• {pendingCount} {t.processing.toLowerCase()}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">{t.all} ({videos.length})</TabsTrigger>
            <TabsTrigger value="pending">{t.processing} ({pendingCount})</TabsTrigger>
            <TabsTrigger value="completed">{t.complete} ({completedCount})</TabsTrigger>
            <TabsTrigger value="failed">{t.failed} ({failedCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {isLoading && !videos.length ? (
              <CenteredSpinner message="Loading videos..." />
            ) : filteredVideos.length === 0 ? (
              <NoHistoryEmptyState type="videos" />
            ) : (
              <div className="space-y-3">
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Thumbnail/Preview */}
                        <div className="relative w-32 h-20 bg-muted rounded flex-shrink-0">
                          {video.status === "loading" ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                              <Play className="h-8 w-8 text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {video.mode}
                                </Badge>
                                {getStatusBadge(video.status)}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {video.prompt}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{video.resolution}</span>
                            <span>•</span>
                            <span>{video.aspect_ratio}</span>
                            <span>•</span>
                            <span>{video.duration || "6s"}</span>
                            {video.created_at && (
                              <>
                                <span>•</span>
                                <span>{formatDate(video.created_at)}</span>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-3">
                            {video.status === "complete" && (video.video_uri || video.video_url) && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handlePlayVideo(video)}
                                  className="h-9 text-sm font-semibold !bg-white !text-black hover:!bg-gray-200"
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  {t.play}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadVideo(video)}
                                  className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  {t.download}
                                </Button>
                              </>
                            )}
                            {onDelete && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(video.id)}
                                disabled={deletingId === video.id}
                                className="bg-transparent border-gray-600 text-red-500 hover:bg-red-950/20 hover:border-red-500"
                              >
                                {deletingId === video.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    {t.delete}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Video Player Dialog */}
      {selectedVideo && (
        <VideoPlayerDialog
          video={selectedVideo}
          open={showPlayerDialog}
          onOpenChange={setShowPlayerDialog}
        />
      )}
    </Card>
  )
}
