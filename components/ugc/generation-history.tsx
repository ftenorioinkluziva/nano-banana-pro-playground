"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Clock, CheckCircle2, XCircle, Play, Download, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import VideoPlayerDialog from "./video-player-dialog";
import { useUGCSSE } from "@/hooks/use-ugc-sse";
import { CenteredSpinner, NoHistoryEmptyState } from "@/components/shared";

interface Generation {
  id: number;
  batch_id: string;
  product_id: number;
  product_name: string;
  status: "pending" | "completed" | "failed";
  ai_model: string;
  video_url: string | null;
  thumbnail_url: string | null;
  final_prompt: string | null;
  visual_setting: string | null;
  created_at: string;
  updated_at: string;
}

export default function UGCGenerationHistory() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed" | "failed">("all");
  const [selectedVideo, setSelectedVideo] = useState<Generation | null>(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);

  // Setup SSE connection for real-time updates
  useUGCSSE({
    onConnected: (data) => {
      console.log("[UGC] SSE Connected:", data);
      setSseConnected(true);
      toast.success("Real-time updates enabled", {
        description: "You'll receive instant notifications when videos are ready",
      });
    },
    onGenerationCompleted: (data) => {
      console.log("[UGC] Generation completed via SSE:", data);

      // Update the specific generation in the list
      setGenerations((prev) =>
        prev.map((gen) =>
          gen.batch_id === data.batch_id
            ? {
                ...gen,
                status: "completed",
                video_url: data.video_url,
                thumbnail_url: data.thumbnail_url,
                updated_at: new Date().toISOString(),
              }
            : gen
        )
      );

      toast.success(`Video ready: ${data.product_name}`, {
        description: "Click to view your generated video",
        action: {
          label: "View",
          onClick: () => {
            const gen = generations.find((g) => g.batch_id === data.batch_id);
            if (gen) {
              setSelectedVideo({
                ...gen,
                status: "completed",
                video_url: data.video_url,
                thumbnail_url: data.thumbnail_url,
              });
              setShowVideoDialog(true);
            }
          },
        },
      });
    },
    onGenerationFailed: (data) => {
      console.log("[UGC] Generation failed via SSE:", data);

      // Update the specific generation in the list
      setGenerations((prev) =>
        prev.map((gen) =>
          gen.batch_id === data.batch_id
            ? { ...gen, status: "failed", updated_at: new Date().toISOString() }
            : gen
        )
      );

      toast.error(`Generation failed: ${data.product_name}`, {
        description: "Please try again or contact support",
      });
    },
    onError: (error) => {
      console.error("[UGC] SSE Error:", error);
      setSseConnected(false);
      toast.error("Real-time connection lost", {
        description: "Refresh the page to reconnect",
      });
    },
  });

  useEffect(() => {
    fetchGenerations();
  }, [activeTab]);

  const fetchGenerations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      if (activeTab !== "all") {
        params.append("status", activeTab);
      }

      const response = await fetch(`/api/ugc-generations?${params}`);
      const data = await response.json();

      if (data.success) {
        setGenerations(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching generations:", error);
      if (!silent) {
        toast.error("Failed to load generations");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusIcon = (status: Generation["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 animate-pulse" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Generation["status"]) => {
    const variants: Record<Generation["status"], "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      completed: "default",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  const handlePlayVideo = (generation: Generation) => {
    if (generation.video_url) {
      setSelectedVideo(generation);
      setShowVideoDialog(true);
    }
  };

  const handleDownloadVideo = (generation: Generation) => {
    if (generation.video_url) {
      window.open(generation.video_url, "_blank");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredGenerations = generations;

  const pendingCount = generations.filter((g) => g.status === "pending").length;
  const completedCount = generations.filter((g) => g.status === "completed").length;
  const failedCount = generations.filter((g) => g.status === "failed").length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              Generation History
              {sseConnected ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3 text-green-500" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3 text-red-500" />
                  Offline
                </Badge>
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchGenerations()}
              disabled={loading}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            Real-time tracking of your UGC video generation jobs
            {pendingCount > 0 && (
              <span className="ml-2 text-yellow-600">
                • {pendingCount} processing
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({generations.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedCount})
              </TabsTrigger>
              <TabsTrigger value="failed">
                Failed ({failedCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {loading && !generations.length ? (
                <CenteredSpinner message="Loading generations..." />
              ) : filteredGenerations.length === 0 ? (
                <NoHistoryEmptyState type="videos" />
              ) : (
                <div className="space-y-3">
                  {filteredGenerations.map((generation) => (
                    <Card key={generation.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Thumbnail */}
                          <div className="relative w-32 h-20 bg-muted rounded flex-shrink-0">
                            {generation.thumbnail_url ? (
                              <img
                                src={generation.thumbnail_url}
                                alt={generation.product_name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : generation.status === "pending" ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold">
                                  {generation.product_name}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {generation.ai_model}
                                </p>
                              </div>
                              {getStatusBadge(generation.status)}
                            </div>

                            {generation.visual_setting && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                                {generation.visual_setting}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                              <span>Created: {formatDate(generation.created_at)}</span>
                              {generation.updated_at !== generation.created_at && (
                                <span>• Updated: {formatDate(generation.updated_at)}</span>
                              )}
                            </div>

                            {/* Actions */}
                            {generation.status === "completed" && generation.video_url && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={() => handlePlayVideo(generation)}
                                  className="h-10 text-sm font-semibold !bg-white !text-black hover:!bg-gray-200"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Play
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadVideo(generation)}
                                  className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            )}
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
      </Card>

      {/* Video Player Dialog */}
      {selectedVideo && (
        <VideoPlayerDialog
          generation={selectedVideo}
          open={showVideoDialog}
          onOpenChange={setShowVideoDialog}
        />
      )}
    </>
  );
}
