/**
 * Video Models Configuration
 *
 * This file centralizes all video generation model configurations.
 * To add a new model, simply add a new ModelConfig object to the MODELS array.
 */

export interface InputRequirements {
  prompt: {
    required: boolean
    minLength?: number
    maxLength?: number
  }
  negativePrompt?: {
    required: boolean
    maxLength?: number
  }
  images?: {
    required: boolean
    min?: number
    max?: number
    formats?: string[]
    maxSizeMB?: number
  }
  videos?: {
    required: boolean
    min?: number
    max?: number
    formats?: string[]
    maxSizeMB?: number
  }
  taskId?: {
    required: boolean
    description?: string
  }
}

export interface GenerationTypeConfig {
  id: string
  name: string
  description: string
  apiModel: string // The model identifier sent to the API (e.g., "wan/2-6-text-to-video")
  parameters: {
    durations: string[]
    resolutions: string[]
    aspectRatios?: string[]
  }
  inputs: InputRequirements
}

export interface ModelConfig {
  id: string
  name: string
  displayName: string
  description: string
  provider: string // e.g., "Kie AI", "Google"
  generationTypes: GenerationTypeConfig[]
}

/**
 * Veo Model Configuration (Google's Veo via Kie AI)
 */
const VEO_MODEL_CONFIG: ModelConfig = {
  id: "veo",
  name: "veo3",
  displayName: "Veo 3",
  description: "Google's Veo 3 model for high-quality video generation",
  provider: "Google via Kie AI",
  generationTypes: [
    {
      id: "text-to-video",
      name: "Text to Video",
      description: "Generate video from text prompt",
      apiModel: "veo3", // Uses current implementation
      parameters: {
        durations: ["4s", "6s", "8s"],
        resolutions: ["720p", "1080p"],
        aspectRatios: ["16:9", "9:16"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 1,
          maxLength: 2000,
        },
        negativePrompt: {
          required: false,
          maxLength: 2000,
        },
      },
    },
    {
      id: "frames-to-video",
      name: "Frames to Video",
      description: "Generate video from start and end frames",
      apiModel: "veo3",
      parameters: {
        durations: ["4s", "6s", "8s"],
        resolutions: ["720p", "1080p"],
        aspectRatios: ["16:9", "9:16"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 1,
          maxLength: 2000,
        },
        negativePrompt: {
          required: false,
          maxLength: 2000,
        },
        images: {
          required: true,
          min: 1,
          max: 2,
          formats: ["image/jpeg", "image/png", "image/webp"],
          maxSizeMB: 30,
        },
      },
    },
    {
      id: "references-to-video",
      name: "References to Video",
      description: "Generate video from reference images",
      apiModel: "veo3",
      parameters: {
        durations: ["4s", "6s", "8s"],
        resolutions: ["720p", "1080p"],
        aspectRatios: ["16:9", "9:16"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 1,
          maxLength: 2000,
        },
        negativePrompt: {
          required: false,
          maxLength: 2000,
        },
        images: {
          required: true,
          min: 1,
          max: 10,
          formats: ["image/jpeg", "image/png", "image/webp"],
          maxSizeMB: 30,
        },
      },
    },
    {
      id: "extend-video",
      name: "Extend Video",
      description: "Extend an existing video",
      apiModel: "veo3",
      parameters: {
        durations: ["4s", "6s", "8s"],
        resolutions: ["720p", "1080p"],
        aspectRatios: ["16:9", "9:16"],
      },
      inputs: {
        prompt: {
          required: false,
          maxLength: 2000,
        },
        taskId: {
          required: true,
          description: "Task ID from a previously generated video",
        },
      },
    },
  ],
}

/**
 * Veo Fast Model Configuration
 */
const VEO_FAST_MODEL_CONFIG: ModelConfig = {
  id: "veo-fast",
  name: "veo3_fast",
  displayName: "Veo 3 Fast",
  description: "Faster version of Veo 3 for quick video generation",
  provider: "Google via Kie AI",
  generationTypes: [
    {
      id: "text-to-video",
      name: "Text to Video",
      description: "Generate video from text prompt",
      apiModel: "veo3_fast",
      parameters: {
        durations: ["4s", "6s", "8s"],
        resolutions: ["720p", "1080p"],
        aspectRatios: ["16:9", "9:16"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 1,
          maxLength: 2000,
        },
        negativePrompt: {
          required: false,
          maxLength: 2000,
        },
      },
    },
    {
      id: "frames-to-video",
      name: "Frames to Video",
      description: "Generate video from start and end frames",
      apiModel: "veo3_fast",
      parameters: {
        durations: ["4s", "6s", "8s"],
        resolutions: ["720p", "1080p"],
        aspectRatios: ["16:9", "9:16"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 1,
          maxLength: 2000,
        },
        negativePrompt: {
          required: false,
          maxLength: 2000,
        },
        images: {
          required: true,
          min: 1,
          max: 2,
          formats: ["image/jpeg", "image/png", "image/webp"],
          maxSizeMB: 30,
        },
      },
    },
    {
      id: "references-to-video",
      name: "References to Video",
      description: "Generate video from reference images",
      apiModel: "veo3_fast",
      parameters: {
        durations: ["4s", "6s", "8s"],
        resolutions: ["720p", "1080p"],
        aspectRatios: ["16:9", "9:16"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 1,
          maxLength: 2000,
        },
        negativePrompt: {
          required: false,
          maxLength: 2000,
        },
        images: {
          required: true,
          min: 1,
          max: 10,
          formats: ["image/jpeg", "image/png", "image/webp"],
          maxSizeMB: 30,
        },
      },
    },
    {
      id: "extend-video",
      name: "Extend Video",
      description: "Extend an existing video",
      apiModel: "veo3_fast",
      parameters: {
        durations: ["4s", "6s", "8s"],
        resolutions: ["720p", "1080p"],
        aspectRatios: ["16:9", "9:16"],
      },
      inputs: {
        prompt: {
          required: false,
          maxLength: 2000,
        },
        taskId: {
          required: true,
          description: "Task ID from a previously generated video",
        },
      },
    },
  ],
}

/**
 * Sora 2 Pro Model Configuration
 */
const SORA_2_PRO_MODEL_CONFIG: ModelConfig = {
  id: "sora-2-pro",
  name: "sora-2-pro",
  displayName: "Sora 2 Pro",
  description: "OpenAI's Sora 2 Pro model for high-quality video generation",
  provider: "OpenAI via Kie AI",
  generationTypes: [
    {
      id: "text-to-video",
      name: "Text to Video",
      description: "Generate video from text prompt only",
      apiModel: "sora-2-pro-text-to-video",
      parameters: {
        durations: ["10", "15"], // n_frames: 10 (10s), 15 (15s)
        resolutions: ["standard", "high"], // size parameter
        aspectRatios: ["portrait", "landscape"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 1,
          maxLength: 10000,
        },
      },
    },
    {
      id: "image-to-video",
      name: "Image to Video",
      description: "Generate video from image and text prompt",
      apiModel: "sora-2-pro-image-to-video",
      parameters: {
        durations: ["10", "15"], // n_frames: 10 (10s), 15 (15s)
        resolutions: ["standard", "high"], // size parameter
        aspectRatios: ["portrait", "landscape"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 1,
          maxLength: 10000,
        },
        images: {
          required: true,
          min: 1,
          max: 1, // Only one image for starting frame
          formats: ["image/jpeg", "image/png", "image/webp"],
          maxSizeMB: 10,
        },
      },
    },
    {
      id: "storyboard",
      name: "Storyboard",
      description: "Generate multi-scene video from script",
      apiModel: "sora-2-pro-storyboard",
      parameters: {
        durations: ["10s", "15s", "25s"],
        resolutions: ["standard", "high"],
        aspectRatios: ["portrait", "landscape"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 1,
          maxLength: 20000,
        },
      },
    },
  ],
}

/**
 * Wan 2.6 Model Configuration
 */
const WAN_2_6_MODEL_CONFIG: ModelConfig = {
  id: "wan-2-6",
  name: "wan/2-6",
  displayName: "Wan 2.6",
  description: "Wan 2.6 model for versatile video generation",
  provider: "Kie AI",
  generationTypes: [
    {
      id: "text-to-video",
      name: "Text to Video",
      description: "Generate video from text prompt only",
      apiModel: "wan/2-6-text-to-video",
      parameters: {
        durations: ["5", "10", "15"],
        resolutions: ["720p", "1080p"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 1,
          maxLength: 5000,
        },
      },
    },
    {
      id: "image-to-video",
      name: "Image to Video",
      description: "Generate video from images and text prompt",
      apiModel: "wan/2-6-image-to-video",
      parameters: {
        durations: ["5", "10", "15"],
        resolutions: ["720p", "1080p"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 2,
          maxLength: 5000,
        },
        images: {
          required: true,
          min: 1,
          max: 10,
          formats: ["image/jpeg", "image/png", "image/webp"],
          maxSizeMB: 10,
        },
      },
    },
    {
      id: "video-to-video",
      name: "Video to Video",
      description: "Generate video from input videos and text prompt",
      apiModel: "wan/2-6-video-to-video",
      parameters: {
        durations: ["5", "10"], // Note: video-to-video only supports 5 and 10
        resolutions: ["720p", "1080p"],
      },
      inputs: {
        prompt: {
          required: true,
          minLength: 2,
          maxLength: 5000,
        },
        videos: {
          required: true,
          min: 1,
          max: 10,
          formats: ["video/mp4", "video/quicktime", "video/x-matroska"],
          maxSizeMB: 10,
        },
      },
    },
  ],
}

/**
 * All available models
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  VEO_FAST_MODEL_CONFIG,
  VEO_MODEL_CONFIG,
  WAN_2_6_MODEL_CONFIG,
  SORA_2_PRO_MODEL_CONFIG,
]

/**
 * Helper function to get model config by ID
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === modelId)
}

/**
 * Helper function to get generation type config
 */
export function getGenerationTypeConfig(
  modelId: string,
  generationTypeId: string
): GenerationTypeConfig | undefined {
  const model = getModelConfig(modelId)
  return model?.generationTypes.find((type) => type.id === generationTypeId)
}

/**
 * Helper function to validate if a model supports a generation type
 */
export function isGenerationTypeSupported(
  modelId: string,
  generationTypeId: string
): boolean {
  return getGenerationTypeConfig(modelId, generationTypeId) !== undefined
}
