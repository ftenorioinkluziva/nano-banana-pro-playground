"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  image_url: string;
  target_audience: string;
}

interface GenerateVideoDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GenerateVideoDialog({
  product,
  open,
  onOpenChange,
}: GenerateVideoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("Nano + Veo 3.1");
  const [videoSetting, setVideoSetting] = useState(
    `A realistic UGC style video of a person using ${product.name} in a casual home environment.`
  );

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/dispatch-ugc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          model,
          videoSetting,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Video generation started!", {
          description: "Check the history to track progress",
        });
        onOpenChange(false);

        // Reload the page to refresh the history
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to start generation");
      }
    } catch (error) {
      console.error("Error generating video:", error);
      toast.error("Failed to start generation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate UGC Video
          </DialogTitle>
          <DialogDescription>
            Configure AI parameters to generate a user-generated content video for{" "}
            <strong>{product.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Preview */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div>
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
              {product.target_audience && (
                <p className="text-xs text-muted-foreground mt-1">
                  Target: {product.target_audience}
                </p>
              )}
            </div>
          </div>

          {/* AI Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nano + Veo 3.1">Nano + Veo 3.1 (Recommended)</SelectItem>
                <SelectItem value="Nano + Veo 3.0">Nano + Veo 3.0</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the AI model for video generation
            </p>
          </div>

          {/* Video Setting */}
          <div className="space-y-2">
            <Label htmlFor="setting">Video Setting / Scene Description</Label>
            <Textarea
              id="setting"
              value={videoSetting}
              onChange={(e) => setVideoSetting(e.target.value)}
              placeholder="Describe the scene, environment, and how the product should be presented..."
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Describe the visual setting and context for the UGC video
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
