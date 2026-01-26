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
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";

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
  const { t } = useLanguage()

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-black border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{generation.product_name}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {t.complete} — {generation.ai_model}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-800">
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
                <h4 className="text-sm font-semibold mb-1 text-white">{t.style}</h4>
                <p className="text-sm text-muted-foreground bg-gray-900/50 p-3 rounded border border-gray-800">
                  {generation.visual_setting}
                </p>
              </div>
            )}

            {generation.final_prompt && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-white">{t.prompt}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px] text-zinc-400 hover:text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(generation.final_prompt || "")
                      toast.success(t.promptCopied)
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {t.copyPrompt}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground font-mono bg-black border border-gray-800 p-3 rounded overflow-x-auto">
                  {generation.final_prompt}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gray-800 text-gray-300 border-none">{generation.ai_model}</Badge>
              <span className="text-xs text-muted-foreground">
                ID: {generation.batch_id.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!generation.video_url}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {t.download}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
