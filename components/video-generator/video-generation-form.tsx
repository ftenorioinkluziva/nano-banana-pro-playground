"use client"

import React, { useState, useRef, useCallback } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, Trash2, Play, Sparkles } from "lucide-react"
import type { GenerateVideoParams, GenerationMode, ImageFile, VideoFile, VeoModel, Resolution, AspectRatio, Duration } from "@/types/video"
import { VeoModel as VeoModelEnum, Resolution as ResolutionEnum, AspectRatio as AspectRatioEnum, GenerationMode as GenerationModeEnum, Duration as DurationEnum } from "@/types/video"
import { AlertCircle, Lightbulb } from "lucide-react"
import { EnhancePromptDialog } from "./enhance-prompt-dialog"

interface VideoGenerationFormProps {
  onGenerate: (params: GenerateVideoParams) => Promise<void>
  generating: boolean
  progress: number
  error: string | null
  products?: any[]
  selectedProduct?: any | null
  loadingProducts?: boolean
  onProductSelect?: (productId: string) => void
  onClearProduct?: () => void
}

const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]
      if (base64) {
        resolve(base64)
      } else {
        reject(new Error("Failed to read file as base64"))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const fileToImageFile = async (file: File): Promise<ImageFile> => {
  const base64 = await fileToBase64(file)
  return { file, base64 }
}

const fileToVideoFile = async (file: File): Promise<VideoFile> => {
  const base64 = await fileToBase64(file)
  return { file, base64 }
}

export function VideoGenerationForm({
  onGenerate,
  generating,
  progress,
  error,
  products = [],
  selectedProduct = null,
  loadingProducts = false,
  onProductSelect,
  onClearProduct,
}: VideoGenerationFormProps) {
  const [mode, setMode] = useState<GenerationMode>(GenerationModeEnum.TEXT_TO_VIDEO)
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [enhanceDialogOpen, setEnhanceDialogOpen] = useState(false)
  const [model, setModel] = useState<VeoModel>(VeoModelEnum.VEO_FAST)
  const [resolution, setResolution] = useState<Resolution>(ResolutionEnum.P720)
  const [duration, setDuration] = useState<Duration>(DurationEnum.SIX_SECONDS)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatioEnum.LANDSCAPE)
  const [startFrame, setStartFrame] = useState<ImageFile | null>(null)
  const [endFrame, setEndFrame] = useState<ImageFile | null>(null)
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>([])
  const [styleImage, setStyleImage] = useState<ImageFile | null>(null)
  const [inputVideo, setInputVideo] = useState<VideoFile | null>(null)
  const [isLooping, setIsLooping] = useState(false)

  const startFrameInputRef = useRef<HTMLInputElement>(null)
  const endFrameInputRef = useRef<HTMLInputElement>(null)
  const styleImageInputRef = useRef<HTMLInputElement>(null)
  const inputVideoInputRef = useRef<HTMLInputElement>(null)
  const referenceImagesInputRef = useRef<HTMLInputElement>(null)

  const handleStartFrameChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const imageFile = await fileToImageFile(file)
        setStartFrame(imageFile)
      } catch (error) {
        console.error("Error converting file:", error)
      }
    }
  }, [])

  const handleEndFrameChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const imageFile = await fileToImageFile(file)
        setEndFrame(imageFile)
      } catch (error) {
        console.error("Error converting file:", error)
      }
    }
  }, [])

  const handleStyleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const imageFile = await fileToImageFile(file)
        setStyleImage(imageFile)
      } catch (error) {
        console.error("Error converting file:", error)
      }
    }
  }, [])

  const handleReferenceImagesChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      try {
        const imageFiles = await Promise.all(
          Array.from(files).map((file) => fileToImageFile(file))
        )
        setReferenceImages((prev) => [...prev, ...imageFiles])
      } catch (error) {
        console.error("Error converting files:", error)
      }
    }
  }, [])

  const handleInputVideoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const videoFile = await fileToVideoFile(file)
        setInputVideo(videoFile)
      } catch (error) {
        console.error("Error converting file:", error)
      }
    }
  }, [])

  const handleGenerateClick = async () => {
    if (!prompt.trim() && mode !== GenerationModeEnum.EXTEND_VIDEO) {
      alert("Please enter a prompt")
      return
    }

    const params: GenerateVideoParams = {
      prompt,
      negativePrompt,
      model: model as VeoModel,
      aspectRatio: aspectRatio as AspectRatio,
      resolution: resolution as Resolution,
      duration: duration as Duration,
      mode: mode as GenerationMode,
    }

    if (mode === GenerationModeEnum.FRAMES_TO_VIDEO) {
      params.startFrame = startFrame
      params.endFrame = endFrame
      params.isLooping = isLooping
    } else if (mode === GenerationModeEnum.REFERENCES_TO_VIDEO) {
      params.referenceImages = referenceImages
      params.styleImage = styleImage
    } else if (mode === GenerationModeEnum.EXTEND_VIDEO) {
      params.inputVideo = inputVideo
    }

    await onGenerate(params)
  }

  const canGenerate =
    !generating &&
    prompt.trim() &&
    ((mode === GenerationModeEnum.FRAMES_TO_VIDEO && startFrame) ||
      (mode === GenerationModeEnum.REFERENCES_TO_VIDEO && referenceImages.length > 0) ||
      (mode === GenerationModeEnum.EXTEND_VIDEO && inputVideo) ||
      mode === GenerationModeEnum.TEXT_TO_VIDEO)

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Generation Mode Selection */}
      <div className="space-y-2">
        <Label>Generation Mode</Label>
        <Select value={mode} onValueChange={(value) => setMode(value as GenerationMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GenerationModeEnum.TEXT_TO_VIDEO}>Text to Video</SelectItem>
            <SelectItem value={GenerationModeEnum.FRAMES_TO_VIDEO}>Frames to Video</SelectItem>
            <SelectItem value={GenerationModeEnum.REFERENCES_TO_VIDEO}>References to Video</SelectItem>
            <SelectItem value={GenerationModeEnum.EXTEND_VIDEO}>Extend Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product Selector */}
      {products && products.length > 0 && (
        <div className="space-y-2">
          <Label>Select Product (Optional)</Label>
          <p className="text-xs text-zinc-500">Choose a product to enrich your video prompt</p>
          <div className="flex gap-2">
            <Select
              value={selectedProduct?.id?.toString() || ""}
              onValueChange={(value) => {
                if (value && onProductSelect) {
                  onProductSelect(value)
                  const product = products.find((p) => p.id.toString() === value)
                  if (product) {
                    // Enrich prompt with product information
                    const productContext = `Product: ${product.name}${product.description ? `\nDescription: ${product.description}` : ""}${product.target_audience ? `\nTarget Audience: ${product.target_audience}` : ""}${product.category ? `\nCategory: ${product.category}` : ""}`

                    if (!prompt) {
                      setPrompt(productContext)
                    } else {
                      setPrompt(`${prompt}\n\n${productContext}`)
                    }
                  }
                }
              }}
              disabled={loadingProducts || generating}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select a product..."} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      {product.category && (
                        <span className="text-xs text-gray-400">{product.category}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct && onClearProduct && (
              <Button
                onClick={() => {
                  onClearProduct()
                }}
                variant="outline"
                size="sm"
                className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {selectedProduct && (
            <div className="p-2 bg-gray-900/50 border border-gray-700 rounded text-xs text-gray-300">
              <strong>{selectedProduct.name}</strong>
              {selectedProduct.description && (
                <p className="mt-1 text-gray-400">{selectedProduct.description}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Prompt Input */}
      {mode !== GenerationModeEnum.EXTEND_VIDEO && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Prompt</Label>
              <button
                onClick={() => setEnhanceDialogOpen(true)}
                disabled={!prompt.trim() || generating}
                className="text-xs flex items-center gap-1 h-7 px-2 md:px-3 rounded bg-black/80 backdrop-blur-sm text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles size={14} />
                Enhance
              </button>
            </div>
            <p className="text-xs text-zinc-500">Be descriptive: include subject, action, style, camera angle, and ambiance</p>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: A golden retriever running through a sunlit meadow, film noir style, cinematic lighting, warm bokeh background..."
              disabled={generating}
              className="min-h-24 mt-2"
            />
          </div>

          <div>
            <Label>Negative Prompt (Optional)</Label>
            <p className="text-xs text-zinc-500 mt-1">Describe what you DON'T want (e.g., "low quality, blurry, distorted")</p>
            <Textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Ex: cartoon, drawing, low quality, blurry, distorted..."
              disabled={generating}
              className="min-h-16 mt-2"
            />
          </div>

          {/* Prompt Tip */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 flex gap-2 text-sm">
            <Lightbulb className="text-gray-400 flex-shrink-0" size={18} />
            <p className="text-gray-300">
              <strong>Tip:</strong> More detailed prompts produce better results. Include camera movements, lighting, and atmosphere for cinematic videos.
            </p>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Model</Label>
          <Select value={model} onValueChange={(value) => setModel(value as VeoModel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={VeoModelEnum.VEO_FAST}>Veo Fast</SelectItem>
              <SelectItem value={VeoModelEnum.VEO}>Veo (Standard)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Resolution</Label>
          <Select value={resolution} onValueChange={(value) => setResolution(value as Resolution)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ResolutionEnum.P720}>720p</SelectItem>
              <SelectItem value={ResolutionEnum.P1080}>1080p</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Duration and Aspect Ratio */}
      {mode !== GenerationModeEnum.EXTEND_VIDEO && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select
              value={duration}
              onValueChange={(value) => {
                setDuration(value as Duration)
                // Auto-adjust resolution if 1080p with non-8s duration
                if (resolution === ResolutionEnum.P1080 && value !== DurationEnum.EIGHT_SECONDS) {
                  setResolution(ResolutionEnum.P720)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DurationEnum.FOUR_SECONDS}>4 seconds</SelectItem>
                <SelectItem value={DurationEnum.SIX_SECONDS}>6 seconds</SelectItem>
                <SelectItem value={DurationEnum.EIGHT_SECONDS}>8 seconds</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">Longer videos take more time to generate</p>
          </div>

          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={(value) => setAspectRatio(value as AspectRatio)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AspectRatioEnum.LANDSCAPE}>Landscape (16:9)</SelectItem>
                <SelectItem value={AspectRatioEnum.PORTRAIT}>Portrait (9:16)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Resolution with constraint warning */}
      <div className="space-y-2">
        <Label>Resolution</Label>
        <Select
          value={resolution}
          onValueChange={(value) => {
            const res = value as Resolution
            // If selecting 1080p, force 8s duration
            if (res === ResolutionEnum.P1080 && duration !== DurationEnum.EIGHT_SECONDS) {
              setDuration(DurationEnum.EIGHT_SECONDS)
            }
            setResolution(res)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ResolutionEnum.P720}>720p - Any duration</SelectItem>
            <SelectItem value={ResolutionEnum.P1080}>1080p - 8 seconds only</SelectItem>
          </SelectContent>
        </Select>
        {resolution === ResolutionEnum.P1080 && (
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2 flex gap-2 text-xs">
            <AlertCircle className="text-gray-400 flex-shrink-0" size={16} />
            <p className="text-gray-300">1080p only works with 8 seconds duration</p>
          </div>
        )}
      </div>

      {/* Frames to Video Mode */}
      {mode === GenerationModeEnum.FRAMES_TO_VIDEO && (
        <div className="space-y-4 border border-gray-800 p-4 rounded-lg">
          <div>
            <Label className="block mb-2">Start Frame</Label>
            {startFrame ? (
              <div className="relative inline-block">
                <img
                  src={URL.createObjectURL(startFrame.file)}
                  alt="start frame"
                  className="w-32 h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => setStartFrame(null)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => startFrameInputRef.current?.click()}
                className="border-2 border-dashed border-gray-800 rounded-lg p-6 w-full text-center hover:border-gray-600 transition-colors"
              >
                <Upload className="mx-auto mb-2" />
                <p className="text-sm text-zinc-400">Upload Start Frame</p>
              </button>
            )}
            <input
              ref={startFrameInputRef}
              type="file"
              accept="image/*"
              onChange={handleStartFrameChange}
              className="hidden"
            />
          </div>

          <div>
            <Label className="block mb-2">End Frame (Optional)</Label>
            {endFrame ? (
              <div className="relative inline-block">
                <img
                  src={URL.createObjectURL(endFrame.file)}
                  alt="end frame"
                  className="w-32 h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => setEndFrame(null)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => endFrameInputRef.current?.click()}
                className="border-2 border-dashed border-gray-800 rounded-lg p-6 w-full text-center hover:border-gray-600 transition-colors"
              >
                <Upload className="mx-auto mb-2" />
                <p className="text-sm text-zinc-400">Upload End Frame</p>
              </button>
            )}
            <input
              ref={endFrameInputRef}
              type="file"
              accept="image/*"
              onChange={handleEndFrameChange}
              className="hidden"
            />
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isLooping}
              onChange={(e) => setIsLooping(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Create looping video</span>
          </label>
        </div>
      )}

      {/* References to Video Mode */}
      {mode === GenerationModeEnum.REFERENCES_TO_VIDEO && (
        <div className="space-y-4 border border-gray-800 p-4 rounded-lg">
          <div>
            <Label className="block mb-2">Reference Images</Label>
            <div className="flex flex-wrap gap-3 mb-3">
              {referenceImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={URL.createObjectURL(img.file)}
                    alt={`reference ${idx}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setReferenceImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => referenceImagesInputRef.current?.click()}
              className="border-2 border-dashed border-gray-800 rounded-lg p-6 w-full text-center hover:border-gray-600 transition-colors"
            >
              <Upload className="mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Add Reference Images</p>
            </button>
            <input
              ref={referenceImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleReferenceImagesChange}
              className="hidden"
            />
          </div>

          <div>
            <Label className="block mb-2">Style Image (Optional)</Label>
            {styleImage ? (
              <div className="relative inline-block">
                <img
                  src={URL.createObjectURL(styleImage.file)}
                  alt="style"
                  className="w-32 h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => setStyleImage(null)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => styleImageInputRef.current?.click()}
                className="border-2 border-dashed border-gray-800 rounded-lg p-6 w-full text-center hover:border-gray-600 transition-colors"
              >
                <Upload className="mx-auto mb-2" />
                <p className="text-sm text-zinc-400">Upload Style Image</p>
              </button>
            )}
            <input
              ref={styleImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleStyleImageChange}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Extend Video Mode */}
      {mode === GenerationModeEnum.EXTEND_VIDEO && (
        <div className="space-y-4 border border-gray-800 p-4 rounded-lg">
          <div>
            <Label className="block mb-2">Input Video</Label>
            {inputVideo ? (
              <div className="relative inline-block">
                <div className="w-32 h-24 bg-zinc-900 rounded-lg flex items-center justify-center">
                  <Play size={32} className="text-zinc-600" />
                </div>
                <button
                  onClick={() => setInputVideo(null)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => inputVideoInputRef.current?.click()}
                className="border-2 border-dashed border-gray-800 rounded-lg p-6 w-full text-center hover:border-gray-600 transition-colors"
              >
                <Upload className="mx-auto mb-2" />
                <p className="text-sm text-zinc-400">Upload Video (MP4)</p>
              </button>
            )}
            <input
              ref={inputVideoInputRef}
              type="file"
              accept="video/mp4"
              onChange={handleInputVideoChange}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Progress Bar */}
      {generating && (
        <div className="space-y-2">
          <div className="text-sm text-zinc-400">Generating: {Math.round(progress)}%</div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerateClick}
        disabled={!canGenerate}
        className="w-full h-10 md:h-12 text-sm md:text-base font-semibold !bg-white !text-black hover:!bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? "Generating Video..." : "Generate Video"}
      </Button>

      {/* Enhance Prompt Dialog */}
      <EnhancePromptDialog
        open={enhanceDialogOpen}
        onOpenChange={setEnhanceDialogOpen}
        prompt={prompt}
        mode={mode}
        onApplyEnhanced={(enhancedPrompt) => setPrompt(enhancedPrompt)}
      />
    </div>
  )
}
