"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
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
import { Upload, Trash2, Sparkles } from "lucide-react"
import type {
  GenerateVideoParams,
  ImageFile,
  VideoFile,
  VideoModelId,
  GenerationTypeId,
  DurationValue,
} from "@/types/video"
import type { Capability } from "@/types/capability"
import { Lightbulb } from "lucide-react"
import { EnhancePromptDialog } from "./enhance-prompt-dialog"
import {
  AVAILABLE_MODELS,
  getModelConfig,
  getGenerationTypeConfig,
} from "@/lib/video-models-config"
import { useLanguage } from "@/components/language-provider"

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
  videoHistory?: any[]
  loadingHistory?: boolean
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
  products = [],
  selectedProduct = null,
  loadingProducts = false,
  onProductSelect,
  onClearProduct,
}: VideoGenerationFormProps) {
  const { t } = useLanguage()

  // Model and Generation Type selection (new parametrized approach)
  const [selectedModelId, setSelectedModelId] = useState<VideoModelId>("veo-fast")
  const [selectedGenerationTypeId, setSelectedGenerationTypeId] = useState<GenerationTypeId>("text-to-video")

  // Get current model and generation type configs
  const currentModel = getModelConfig(selectedModelId)
  const currentGenerationType = getGenerationTypeConfig(selectedModelId, selectedGenerationTypeId)

  // Core parameters
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [enhanceDialogOpen, setEnhanceDialogOpen] = useState(false)
  const [resolution, setResolution] = useState<string>("720p")
  const [duration, setDuration] = useState<DurationValue>("6s")
  const [aspectRatio, setAspectRatio] = useState<string>("16:9")

  // Input files (images and videos)
  const [images, setImages] = useState<ImageFile[]>([])
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [taskId, setTaskId] = useState("")

  // Capabilities
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string>("")

  const imagesInputRef = useRef<HTMLInputElement>(null)
  const videosInputRef = useRef<HTMLInputElement>(null)

  // Update generation type when model changes
  useEffect(() => {
    if (currentModel && currentModel.generationTypes.length > 0) {
      // Check if current generation type is available in the new model
      const isTypeAvailable = currentModel.generationTypes.some(
        (type) => type.id === selectedGenerationTypeId
      )
      if (!isTypeAvailable) {
        // Default to first available type
        setSelectedGenerationTypeId(currentModel.generationTypes[0].id as GenerationTypeId)
      }
    } else if (currentModel) {
      // Should not happen with valid config, but safe fallback
      setSelectedGenerationTypeId("text-to-video" as GenerationTypeId)
    }
  }, [selectedModelId, currentModel, selectedGenerationTypeId])

  // Update duration options when generation type changes
  useEffect(() => {
    if (currentGenerationType) {
      const availableDurations = currentGenerationType.parameters.durations
      // If current duration is not available, set to first available
      if (!availableDurations.includes(duration)) {
        setDuration(availableDurations[0] as DurationValue)
      }
    }
  }, [selectedGenerationTypeId, currentGenerationType, duration])

  // Fetch capabilities on component mount
  useEffect(() => {
    fetch("/api/capabilities")
      .then((res) => res.json())
      .then((data) => {
        setCapabilities(data.capabilities || [])
      })
      .catch((err) => console.error("Error loading capabilities:", err))
  }, [])

  // New generic handlers for images and videos
  const handleImagesChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      try {
        const imageFiles = await Promise.all(
          Array.from(files).map((file) => fileToImageFile(file))
        )
        setImages((prev) => [...prev, ...imageFiles])
      } catch (error) {
        console.error("Error converting files:", error)
      }
    }
  }, [])

  const handleVideosChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      try {
        const videoFiles = await Promise.all(
          Array.from(files).map((file) => fileToVideoFile(file))
        )
        setVideos((prev) => [...prev, ...videoFiles])
      } catch (error) {
        console.error("Error converting files:", error)
      }
    }
  }, [])

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const removeVideo = useCallback((index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Handle capability selection and auto-fill form fields
  const handleCapabilitySelect = useCallback((capabilityId: string) => {
    setSelectedCapabilityId(capabilityId)

    const capability = capabilities.find((c) => c.id === capabilityId)
    if (!capability) return

    // Auto-fill aspect ratio
    if (capability.recommended_aspect_ratio) {
      setAspectRatio(capability.recommended_aspect_ratio)
    }

    // Fetch full capability details
    fetch(`/api/capabilities/${capabilityId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.capability) {
          // Auto-fill prompt with base_prompt_template
          if (data.capability.base_prompt_template) {
            setPrompt(data.capability.base_prompt_template)
          }

          // Auto-fill negative prompt with default_negative_prompt
          if (data.capability.default_negative_prompt) {
            setNegativePrompt(data.capability.default_negative_prompt)
          }
        }
      })
      .catch((err) => console.error("Error loading capability details:", err))
  }, [capabilities])

  const handleGenerateClick = async () => {
    if (!currentGenerationType) {
      alert(t.selectGenType)
      return
    }

    // Validate prompt if required
    if (currentGenerationType.inputs.prompt.required && !prompt.trim()) {
      alert(t.promptPlaceholder)
      return
    }

    // Validate images if required
    if (currentGenerationType.inputs.images?.required && images.length === 0) {
      alert(t.uploadAtLeastImages.replace('{min}', (currentGenerationType.inputs.images.min || 1).toString()))
      return
    }

    // Validate videos if required
    if (currentGenerationType.inputs.videos?.required && videos.length === 0) {
      alert(t.uploadAtLeastVideos.replace('{min}', (currentGenerationType.inputs.videos.min || 1).toString()))
      return
    }

    // Validate taskId if required
    if (currentGenerationType.inputs.taskId?.required && !taskId.trim()) {
      alert(t.enterTaskId)
      return
    }

    const params: GenerateVideoParams = {
      // New parametrized fields
      modelId: selectedModelId,
      generationTypeId: selectedGenerationTypeId,

      // Core parameters
      prompt,
      negativePrompt,
      resolution,
      duration,
      aspectRatio,

      // Input files
      images: images.length > 0 ? images : undefined,
      videos: videos.length > 0 ? videos : undefined,
      taskId: taskId || undefined,
    }

    await onGenerate(params)
  }

  // Dynamic canGenerate based on current generation type config
  const canGenerate = React.useMemo(() => {
    if (generating || !currentGenerationType) return false

    // Check prompt requirement
    if (currentGenerationType.inputs.prompt.required && !prompt.trim()) {
      return false
    }

    // Check images requirement
    if (currentGenerationType.inputs.images?.required && images.length === 0) {
      return false
    }

    // Check videos requirement
    if (currentGenerationType.inputs.videos?.required && videos.length === 0) {
      return false
    }

    // Check taskId requirement
    if (currentGenerationType.inputs.taskId?.required && !taskId.trim()) {
      return false
    }

    return true
  }, [generating, currentGenerationType, prompt, images, videos, taskId])

  const formatGenTypeName = (id: string) => {
    switch (id) {
      case "text-to-video": return t.textToVideo || id
      case "image-to-video": return t.imageToVideo || id
      case "video-to-video": return t.videoToVideo || id
      case "frames-to-video": return t.framesToVideo || id
      case "references-to-video": return t.referencesToVideo || id
      case "extend-video": return t.extendVideo || id
      default: return id
    }
  }

  const formatGenTypeDesc = (id: string) => {
    switch (id) {
      case "text-to-video": return t.textToVideoDesc || ""
      case "image-to-video": return t.imageToVideoDesc || ""
      case "video-to-video": return t.videoToVideoDesc || ""
      case "frames-to-video": return t.framesToVideoDesc || ""
      case "references-to-video": return t.referencesToVideoDesc || ""
      case "extend-video": return t.extendVideoDesc || ""
      default: return ""
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Model Selection - FIRST FIELD */}
      <div className="space-y-2">
        <Label>{t.model.charAt(0).toUpperCase() + t.model.slice(1)}</Label>
        <p className="text-xs text-zinc-500">{t.chooseModel}</p>
        <Select
          value={selectedModelId}
          onValueChange={(value) => {
            setSelectedModelId(value as VideoModelId)
            setImages([])
            setVideos([])
            setTaskId("")
          }}
          disabled={generating}
        >
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            {AVAILABLE_MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{model.displayName}</span>
                  <span className="text-xs text-gray-400">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Generation Type Selection - SECOND FIELD */}
      <div className="space-y-2">
        <Label>{t.generationType}</Label>
        <p className="text-xs text-zinc-500">{t.selectGenType}</p>
        <Select
          value={selectedGenerationTypeId}
          onValueChange={(value) => {
            setSelectedGenerationTypeId(value as GenerationTypeId)
            setImages([])
            setVideos([])
            setTaskId("")
          }}
          disabled={generating}
        >
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            {currentModel?.generationTypes.map((genType) => (
              <SelectItem key={genType.id} value={genType.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{formatGenTypeName(genType.id)}</span>
                  <span className="text-xs text-gray-400">{formatGenTypeDesc(genType.id)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Selector */}
      {products && products.length > 0 && (
        <div className="space-y-2">
          <Label>{t.selectProductOptional}</Label>
          <p className="text-xs text-zinc-500">{t.chooseProductToEnrich}</p>
          <div className="flex gap-2">
            <Select
              value={selectedProduct?.id?.toString() || ""}
              onValueChange={(value) => {
                if (value && onProductSelect) {
                  onProductSelect(value)
                  const product = products.find((p) => p.id.toString() === value)
                  if (product) {
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
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder={loadingProducts ? (t.loadingProducts || "Loading...") : (t.selectAProduct || "Select a product")} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
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
                className="bg-transparent border-zinc-800 text-white hover:bg-zinc-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Capability Selector */}
      {capabilities.length > 0 && (
        <div className="space-y-2">
          <Label>{t.videoStyleCapability}</Label>
          <p className="text-xs text-zinc-500">{t.choosePreconfiguredStyle}</p>
          <Select
            value={selectedCapabilityId}
            onValueChange={handleCapabilitySelect}
            disabled={generating}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder={t.selectAVideoStyle || "Select a video style"} />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              {capabilities.map((cap) => (
                <SelectItem key={cap.id} value={cap.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{cap.label}</span>
                    {cap.description && (
                      <span className="text-xs text-gray-400">{cap.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCapabilityId && (
            <div className="p-2 bg-zinc-900/50 border border-zinc-800 rounded text-xs">
              <p className="text-green-400 flex items-center gap-1">
                <Lightbulb size={14} />
                <span>{t.styleAppliedMessage}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Prompt Input */}
      {currentGenerationType?.inputs.prompt && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>
                {t.prompt.charAt(0).toUpperCase() + t.prompt.slice(1)}{currentGenerationType.inputs.prompt.required && " *"}
              </Label>
              <button
                onClick={() => setEnhanceDialogOpen(true)}
                disabled={!prompt.trim() || generating}
                className="text-xs flex items-center gap-1 h-7 px-3 rounded bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                <Sparkles size={14} />
                {t.enhancePrompt}
              </button>
            </div>
            <p className="text-xs text-zinc-500">{t.beDescriptive}</p>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: A cinematic shot of a sunset over the mountains..."
              disabled={generating}
              className="min-h-24 mt-2 bg-zinc-900 border-zinc-800 text-white"
            />
          </div>

          {currentGenerationType.inputs.negativePrompt && (
            <div>
              <Label>{t.negativePrompt}</Label>
              <p className="text-xs text-zinc-500 mt-1">{t.negativePromptDescription}</p>
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder={t.negativePromptPlaceholder}
                disabled={generating}
                className="min-h-16 mt-2 bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
          )}
        </div>
      )}

      {/* Parameters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t.duration}</Label>
          <Select
            value={duration}
            onValueChange={(value) => setDuration(value as DurationValue)}
            disabled={generating}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              {currentGenerationType?.parameters.durations.map((dur) => (
                <SelectItem key={dur} value={dur}>{dur}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t.resolution}</Label>
          <Select
            value={resolution}
            onValueChange={setResolution}
            disabled={generating}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              {currentGenerationType?.parameters.resolutions.map((res) => (
                <SelectItem key={res} value={res}>{res}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentGenerationType?.parameters.aspectRatios && (
        <div className="space-y-2">
          <Label>{t.aspectRatio}</Label>
          <Select
            value={aspectRatio}
            onValueChange={setAspectRatio}
            disabled={generating}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              {currentGenerationType.parameters.aspectRatios.map((ratio) => (
                <SelectItem key={ratio} value={ratio}>{ratio}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Files */}
      {currentGenerationType?.inputs.images && (
        <div className="space-y-4 border border-zinc-800 p-4 rounded-lg">
          <Label>{t.images}</Label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20">
                <img src={URL.createObjectURL(img.file)} className="w-full h-full object-cover rounded" alt="Upload" />
                <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><Trash2 size={12} /></button>
              </div>
            ))}
            <button
              onClick={() => imagesInputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-zinc-800 rounded flex items-center justify-center hover:border-zinc-700"
            >
              <Upload size={20} className="text-zinc-500" />
            </button>
          </div>
          <input ref={imagesInputRef} type="file" multiple className="hidden" onChange={handleImagesChange} accept="image/*" />
        </div>
      )}

      <Button
        onClick={handleGenerateClick}
        disabled={!canGenerate}
        className="w-full !bg-white !text-black hover:!bg-gray-200"
      >
        {generating ? t.generating : `✨ ${t.generate}`}
      </Button>

      <EnhancePromptDialog
        open={enhanceDialogOpen}
        onOpenChange={setEnhanceDialogOpen}
        prompt={prompt}
        mode={selectedGenerationTypeId}
        onApplyEnhanced={setPrompt}
      />
    </div>
  )
}
