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
import { Upload, Trash2, Play, Sparkles } from "lucide-react"
import type {
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  VideoFile,
  VeoModel,
  Resolution,
  AspectRatio,
  Duration,
  VideoModelId,
  GenerationTypeId,
  DurationValue,
} from "@/types/video"
import type { Capability } from "@/types/capability"
import { VeoModel as VeoModelEnum, Resolution as ResolutionEnum, AspectRatio as AspectRatioEnum, GenerationMode as GenerationModeEnum, Duration as DurationEnum } from "@/types/video"
import { AlertCircle, Lightbulb } from "lucide-react"
import { EnhancePromptDialog } from "./enhance-prompt-dialog"
import {
  AVAILABLE_MODELS,
  getModelConfig,
  getGenerationTypeConfig,
  type ModelConfig,
  type GenerationTypeConfig,
} from "@/lib/video-models-config"

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
  progress,
  error,
  products = [],
  selectedProduct = null,
  loadingProducts = false,
  onProductSelect,
  onClearProduct,
  videoHistory = [],
  loadingHistory = false,
}: VideoGenerationFormProps) {
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

  // Legacy fields for backwards compatibility
  const [mode, setMode] = useState<GenerationMode>(GenerationModeEnum.TEXT_TO_VIDEO)
  const [model, setModel] = useState<VeoModel>(VeoModelEnum.VEO_FAST)
  const [startFrame, setStartFrame] = useState<ImageFile | null>(null)
  const [endFrame, setEndFrame] = useState<ImageFile | null>(null)
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>([])
  const [styleImage, setStyleImage] = useState<ImageFile | null>(null)
  const [inputVideo, setInputVideo] = useState<VideoFile | null>(null)
  const [originalTaskId, setOriginalTaskId] = useState("")
  const [isLooping, setIsLooping] = useState(false)

  // Capabilities
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string>("")

  const imagesInputRef = useRef<HTMLInputElement>(null)
  const videosInputRef = useRef<HTMLInputElement>(null)

  // Legacy refs for backwards compatibility
  const startFrameInputRef = useRef<HTMLInputElement>(null)
  const endFrameInputRef = useRef<HTMLInputElement>(null)
  const styleImageInputRef = useRef<HTMLInputElement>(null)
  const inputVideoInputRef = useRef<HTMLInputElement>(null)
  const referenceImagesInputRef = useRef<HTMLInputElement>(null)

  // Update generation type when model changes
  useEffect(() => {
    if (currentModel && currentModel.generationTypes.length > 0) {
      // Check if current generation type is available in the new model
      const isTypeAvailable = currentModel.generationTypes.some(
        (type) => type.id === selectedGenerationTypeId
      )
      if (!isTypeAvailable) {
        // Default to first available type
        setSelectedGenerationTypeId(currentModel.generationTypes[0].id)
      }
    }
  }, [selectedModelId])

  // Update duration options when generation type changes
  useEffect(() => {
    if (currentGenerationType) {
      const availableDurations = currentGenerationType.parameters.durations
      // If current duration is not available, set to first available
      if (!availableDurations.includes(duration)) {
        setDuration(availableDurations[0] as DurationValue)
      }
    }
  }, [selectedGenerationTypeId, currentGenerationType])

  // Fetch capabilities on component mount
  useEffect(() => {
    fetch("/api/capabilities")
      .then((res) => res.json())
      .then((data) => {
        setCapabilities(data.capabilities || [])
      })
      .catch((err) => console.error("Error loading capabilities:", err))
  }, [])

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

    // Auto-fill form fields from capability
    // Map generation_type to GenerationMode enum
    const modeMap: Record<string, GenerationMode> = {
      "TEXT_2_VIDEO": GenerationModeEnum.TEXT_TO_VIDEO,
      "FIRST_AND_LAST_FRAMES_2_VIDEO": GenerationModeEnum.FRAMES_TO_VIDEO,
      "REFERENCE_2_VIDEO": GenerationModeEnum.REFERENCES_TO_VIDEO,
    }

    // Auto-fill mode (generation_type)
    if (capability.generation_type && modeMap[capability.generation_type]) {
      setMode(modeMap[capability.generation_type])
    }

    // Auto-fill aspect ratio
    if (capability.recommended_aspect_ratio) {
      const aspectRatioMap: Record<string, AspectRatio> = {
        "16:9": AspectRatioEnum.LANDSCAPE,
        "9:16": AspectRatioEnum.PORTRAIT,
      }
      const mappedAspectRatio = aspectRatioMap[capability.recommended_aspect_ratio]
      if (mappedAspectRatio) {
        setAspectRatio(mappedAspectRatio)
      }
    }

    // Note: We need to fetch the full capability details to get base_prompt_template and default_negative_prompt
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
      alert("Please select a valid generation type")
      return
    }

    // Validate prompt if required
    if (currentGenerationType.inputs.prompt.required && !prompt.trim()) {
      alert("Please enter a prompt")
      return
    }

    // Validate images if required
    if (currentGenerationType.inputs.images?.required && images.length === 0) {
      alert(`Please upload at least ${currentGenerationType.inputs.images.min || 1} image(s)`)
      return
    }

    // Validate videos if required
    if (currentGenerationType.inputs.videos?.required && videos.length === 0) {
      alert(`Please upload at least ${currentGenerationType.inputs.videos.min || 1} video(s)`)
      return
    }

    // Validate taskId if required
    if (currentGenerationType.inputs.taskId?.required && !taskId.trim()) {
      alert("Please enter a task ID")
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

      // Legacy fields for backwards compatibility
      model: model as VeoModel,
      mode: mode as GenerationMode,
      startFrame,
      endFrame,
      referenceImages,
      styleImage,
      inputVideo,
      originalTaskId,
      isLooping,
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Model Selection - FIRST FIELD */}
      <div className="space-y-2">
        <Label>Model</Label>
        <p className="text-xs text-zinc-500">Choose the AI model for video generation</p>
        <Select
          value={selectedModelId}
          onValueChange={(value) => {
            setSelectedModelId(value as VideoModelId)
            // Reset images, videos, and taskId when changing models
            setImages([])
            setVideos([])
            setTaskId("")
          }}
          disabled={generating}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
        <Label>Generation Type</Label>
        <p className="text-xs text-zinc-500">Select the type of video generation</p>
        <Select
          value={selectedGenerationTypeId}
          onValueChange={(value) => {
            setSelectedGenerationTypeId(value as GenerationTypeId)
            // Reset files when changing generation type
            setImages([])
            setVideos([])
            setTaskId("")
          }}
          disabled={generating}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currentModel?.generationTypes.map((genType) => (
              <SelectItem key={genType.id} value={genType.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{genType.name}</span>
                  <span className="text-xs text-gray-400">{genType.description}</span>
                </div>
              </SelectItem>
            ))}
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

      {/* Capability Selector */}
      {capabilities.length > 0 && (
        <div className="space-y-2">
          <Label>Video Style (Capability)</Label>
          <p className="text-xs text-zinc-500">
            Choose a pre-configured video style to auto-fill prompt template, aspect ratio, and negative prompt
          </p>
          <Select
            value={selectedCapabilityId}
            onValueChange={handleCapabilitySelect}
            disabled={generating}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a video style..." />
            </SelectTrigger>
            <SelectContent>
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
            <div className="p-2 bg-gray-900/50 border border-gray-700 rounded text-xs">
              <p className="text-green-400 flex items-center gap-1">
                <Lightbulb size={14} />
                <span>
                  Style applied: Prompt template, aspect ratio, negative prompt, and generation mode have been auto-filled
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Prompt Input - Dynamic based on config */}
      {currentGenerationType?.inputs.prompt && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>
                Prompt{currentGenerationType.inputs.prompt.required && " *"}
              </Label>
              <button
                onClick={() => setEnhanceDialogOpen(true)}
                disabled={!prompt.trim() || generating}
                className="text-xs flex items-center gap-1 h-7 px-2 md:px-3 rounded bg-black/80 backdrop-blur-sm text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles size={14} />
                Enhance
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Be descriptive: include subject, action, style, camera angle, and ambiance
              {currentGenerationType.inputs.prompt.minLength &&
                ` (min: ${currentGenerationType.inputs.prompt.minLength} chars)`}
              {currentGenerationType.inputs.prompt.maxLength &&
                ` (max: ${currentGenerationType.inputs.prompt.maxLength} chars)`}
            </p>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: A golden retriever running through a sunlit meadow, film noir style, cinematic lighting, warm bokeh background..."
              disabled={generating}
              className="min-h-24 mt-2"
              maxLength={currentGenerationType.inputs.prompt.maxLength}
            />
          </div>

          {/* Negative Prompt - only if supported */}
          {currentGenerationType.inputs.negativePrompt && (
            <div>
              <Label>
                Negative Prompt{currentGenerationType.inputs.negativePrompt.required && " *"}
              </Label>
              <p className="text-xs text-zinc-500 mt-1">
                Describe what you DON'T want (e.g., "low quality, blurry, distorted")
              </p>
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Ex: cartoon, drawing, low quality, blurry, distorted..."
                disabled={generating}
                className="min-h-16 mt-2"
                maxLength={currentGenerationType.inputs.negativePrompt.maxLength}
              />
            </div>
          )}

          {/* Prompt Tip */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 flex gap-2 text-sm">
            <Lightbulb className="text-gray-400 flex-shrink-0" size={18} />
            <p className="text-gray-300">
              <strong>Tip:</strong> More detailed prompts produce better results. Include camera movements, lighting, and atmosphere for cinematic videos.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Parameters Grid: Duration, Resolution, Aspect Ratio */}
      {currentGenerationType && (
        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select
              value={duration}
              onValueChange={(value) => setDuration(value as DurationValue)}
              disabled={generating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentGenerationType.parameters.durations.map((dur) => (
                  <SelectItem key={dur} value={dur}>
                    {dur.endsWith('s') ? dur.replace('s', ' seconds') : `${dur} seconds`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">Longer videos take more time to generate</p>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <Label>Resolution</Label>
            <Select
              value={resolution}
              onValueChange={(value) => setResolution(value)}
              disabled={generating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentGenerationType.parameters.resolutions.map((res) => (
                  <SelectItem key={res} value={res}>
                    {res}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Aspect Ratio - only if supported by the model */}
      {currentGenerationType?.parameters.aspectRatios && currentGenerationType.parameters.aspectRatios.length > 0 && (
        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select
            value={aspectRatio}
            onValueChange={(value) => setAspectRatio(value)}
            disabled={generating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currentGenerationType.parameters.aspectRatios.map((ratio) => (
                <SelectItem key={ratio} value={ratio}>
                  {ratio === "16:9" ? "Landscape (16:9)" : ratio === "9:16" ? "Portrait (9:16)" : ratio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Dynamic Images Input - For image-to-video, frames-to-video, references-to-video */}
      {currentGenerationType?.inputs.images && (
        <div className="space-y-4 border border-gray-800 p-4 rounded-lg">
          <div>
            <Label className="block mb-2">
              {currentGenerationType.inputs.images.required && "* "}
              Images ({images.length}
              {currentGenerationType.inputs.images.max &&
                `/${currentGenerationType.inputs.images.max}`}
              )
            </Label>
            <p className="text-xs text-zinc-500 mb-3">
              {currentGenerationType.inputs.images.required
                ? `Upload at least ${currentGenerationType.inputs.images.min || 1} image(s)`
                : "Upload images (optional)"}
              {currentGenerationType.inputs.images.formats &&
                ` - Supported formats: ${currentGenerationType.inputs.images.formats.join(", ")}`}
              {currentGenerationType.inputs.images.maxSizeMB &&
                ` - Max ${currentGenerationType.inputs.images.maxSizeMB}MB per file`}
            </p>

            {/* Image Grid */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={URL.createObjectURL(img.file)}
                      alt={`image ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {(!currentGenerationType.inputs.images.max ||
              images.length < currentGenerationType.inputs.images.max) && (
              <>
                <button
                  onClick={() => imagesInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-800 rounded-lg p-6 w-full text-center hover:border-gray-600 transition-colors"
                  disabled={generating}
                >
                  <Upload className="mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">
                    {images.length === 0 ? "Upload Images" : "Add More Images"}
                  </p>
                </button>
                <input
                  ref={imagesInputRef}
                  type="file"
                  accept={currentGenerationType.inputs.images.formats?.join(",") || "image/*"}
                  multiple
                  onChange={handleImagesChange}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Videos Input - For video-to-video */}
      {currentGenerationType?.inputs.videos && (
        <div className="space-y-4 border border-gray-800 p-4 rounded-lg">
          <div>
            <Label className="block mb-2">
              {currentGenerationType.inputs.videos.required && "* "}
              Videos ({videos.length}
              {currentGenerationType.inputs.videos.max &&
                `/${currentGenerationType.inputs.videos.max}`}
              )
            </Label>
            <p className="text-xs text-zinc-500 mb-3">
              {currentGenerationType.inputs.videos.required
                ? `Upload at least ${currentGenerationType.inputs.videos.min || 1} video(s)`
                : "Upload videos (optional)"}
              {currentGenerationType.inputs.videos.formats &&
                ` - Supported formats: ${currentGenerationType.inputs.videos.formats.join(", ")}`}
              {currentGenerationType.inputs.videos.maxSizeMB &&
                ` - Max ${currentGenerationType.inputs.videos.maxSizeMB}MB per file`}
            </p>

            {/* Video List */}
            {videos.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {videos.map((vid, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-900/50 rounded">
                    <Play size={16} className="text-gray-400" />
                    <span className="text-sm flex-1 truncate">{vid.file.name}</span>
                    <button
                      onClick={() => removeVideo(idx)}
                      className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {(!currentGenerationType.inputs.videos.max ||
              videos.length < currentGenerationType.inputs.videos.max) && (
              <>
                <button
                  onClick={() => videosInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-800 rounded-lg p-6 w-full text-center hover:border-gray-600 transition-colors"
                  disabled={generating}
                >
                  <Upload className="mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">
                    {videos.length === 0 ? "Upload Videos" : "Add More Videos"}
                  </p>
                </button>
                <input
                  ref={videosInputRef}
                  type="file"
                  accept={currentGenerationType.inputs.videos.formats?.join(",") || "video/*"}
                  multiple
                  onChange={handleVideosChange}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Task ID Input - For extend-video */}
      {currentGenerationType?.inputs.taskId && (
        <div className="space-y-4 border border-gray-800 p-4 rounded-lg bg-black/30">
          {/* Video History Selector */}
          {videoHistory.length > 0 && (
            <div>
              <Label className="block mb-2">Select a Previous Video</Label>
              <p className="text-xs text-zinc-500 mb-3">
                Choose from your previously generated videos
              </p>
              <Select
                value={taskId}
                onValueChange={(value) => setTaskId(value)}
                disabled={loadingHistory || generating}
              >
                <SelectTrigger className="w-full bg-zinc-900 border-gray-700">
                  <SelectValue placeholder={loadingHistory ? "Loading videos..." : "Select a video..."} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-gray-700">
                  {videoHistory
                    .filter((video) => video.task_id)
                    .map((video) => (
                      <SelectItem key={video.id} value={video.task_id!} className="text-white">
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[300px]">
                            {video.prompt.substring(0, 60)}
                            {video.prompt.length > 60 ? "..." : ""}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(video.created_at).toLocaleDateString()} • {video.mode} • {video.resolution}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Manual Task ID Input */}
          <div>
            <Label className="block mb-2">
              {currentGenerationType.inputs.taskId.required && "* "}
              Or Enter Task ID Manually
            </Label>
            {currentGenerationType.inputs.taskId.description && (
              <p className="text-xs text-zinc-500 mb-3">
                {currentGenerationType.inputs.taskId.description}
              </p>
            )}
            <input
              type="text"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="task_abc123..."
              className="w-full px-3 py-2 bg-zinc-900 border border-gray-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
              disabled={generating}
            />
            {taskId && (
              <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
                <Lightbulb size={14} />
                Task ID set successfully
              </p>
            )}
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
