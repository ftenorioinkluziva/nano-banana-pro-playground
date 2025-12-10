"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

interface Generation {
  id: number;
  batch_id: string;
  product_name: string;
  video_url: string | null;
  thumbnail_url: string | null;
  final_prompt: string | null;
  ai_model: string;
  visual_setting: string | null;
  created_at: string;
}

interface VideoPlayerDialogProps {
  generation: Generation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VideoPlayerDialog({
  generation,
  open,
  onOpenChange,
}: VideoPlayerDialogProps) {
  const handleCopyUrl = () => {
    if (generation.video_url) {
      navigator.clipboard.writeText(generation.video_url);
      toast.success("Video URL copied to clipboard");
    }
  };

  const handleDownload = () => {
    if (generation.video_url) {
      window.open(generation.video_url, "_blank");
    }
  };

  const handleOpenInNewTab = () => {
    if (generation.video_url) {
      window.open(generation.video_url, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{generation.product_name}</DialogTitle>
          <DialogDescription>
            Generated with {generation.ai_model}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {generation.video_url ? (
              <video
                src={generation.video_url}
                controls
                className="w-full h-full"
                poster={generation.thumbnail_url || undefined}
              >
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
            {generation.visual_setting && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Scene Description</h4>
                <p className="text-sm text-muted-foreground">
                  {generation.visual_setting}
                </p>
              </div>
            )}

            {generation.final_prompt && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Final Prompt Used</h4>
                <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                  {generation.final_prompt}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant="secondary">{generation.ai_model}</Badge>
              <span className="text-xs text-muted-foreground">
                ID: {generation.batch_id.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              disabled={!generation.video_url}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!generation.video_url}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              disabled={!generation.video_url}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
