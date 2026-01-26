"use client";

import { useState, useEffect } from "react";
import type { Capability } from "@/types/capability";
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
import { useLanguage } from "@/components/language-provider";

interface Product {
  id: number;
  name: string;
  description: string;
  image_url: string;
  target_audience: string;
  category?: string;
  ingredients?: string;
  benefits?: any;
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
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<"veo3" | "veo3_fast">("veo3_fast");
  const [videoSetting, setVideoSetting] = useState(
    `A realistic UGC style video of a person using ${product.name} in a casual home environment.`
  );
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string>("");

  // Buscar capabilities da API
  useEffect(() => {
    fetch("/api/capabilities")
      .then((res) => res.json())
      .then((data) => {
        setCapabilities(data.capabilities || []);
        if (data.capabilities && data.capabilities.length > 0) {
          setSelectedCapabilityId(data.capabilities[0].id);
        }
      })
      .catch((err) => console.error("Error loading capabilities:", err));
  }, []);

  const handleGenerate = async () => {
    if (!selectedCapabilityId) {
      toast.error("Please select a video style");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/generate-ugc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userRequest: videoSetting,
          productId: product.id,
          capabilityId: selectedCapabilityId,
          aspectRatio: "9:16",
          model: model,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Video generation started!", {
          description: "Director Agent is crafting your video prompt",
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
      <DialogContent className="sm:max-w-[550px] bg-black border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5" />
            {t.generateVideo}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {t.chooseProductForUGC}: <strong>{product.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
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
            </div>
          </div>

          {/* Capability Selection */}
          <div className="space-y-2">
            <Label htmlFor="capability" className="text-white">{t.style}</Label>
            <Select value={selectedCapabilityId} onValueChange={setSelectedCapabilityId}>
              <SelectTrigger id="capability" className="bg-black border-gray-800">
                <SelectValue placeholder={t.styles} />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-800 text-white">
                {capabilities.map((cap) => (
                  <SelectItem key={cap.id} value={cap.id}>
                    {cap.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {capabilities.find((c) => c.id === selectedCapabilityId)?.description}
            </p>
          </div>

          {/* AI Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model" className="text-white">AI Model</Label>
            <Select value={model} onValueChange={(value: "veo3" | "veo3_fast") => setModel(value)}>
              <SelectTrigger id="model" className="bg-black border-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-800 text-white">
                <SelectItem value="veo3_fast">Veo 3.1 Fast ({t.beDescriptive.split('.')[0]})</SelectItem>
                <SelectItem value="veo3">Veo 3.1 Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Video Setting */}
          <div className="space-y-2">
            <Label htmlFor="setting" className="text-white">What happens in the video?</Label>
            <Textarea
              id="setting"
              value={videoSetting}
              onChange={(e) => setVideoSetting(e.target.value)}
              placeholder="Ex: A woman in her 30s holding the product and smiling at the camera"
              className="min-h-[120px] bg-black border-gray-800 text-white"
            />
            <p className="text-xs text-muted-foreground">
              {t.beDescriptive}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="!bg-white !text-black hover:!bg-gray-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.generating}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t.generateVideo}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
