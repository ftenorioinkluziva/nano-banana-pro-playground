// Video Generation Types

/**
 * Video Model IDs
 * These correspond to the model IDs in video-models-config.ts
 */
export type VideoModelId = "veo-fast" | "veo" | "wan-2-6" | "sora-2-pro"

/**
 * Generation Type IDs
 * These are generic and work across different models
 */
export type GenerationTypeId =
  | "text-to-video"
  | "image-to-video"
  | "video-to-video"
  | "frames-to-video"
  | "references-to-video"
  | "extend-video"

/**
 * @deprecated Use VideoModelId instead. Kept for backwards compatibility.
 */
export enum VeoModel {
  VEO_FAST = "veo3_fast",
  VEO = "veo3",
}

export enum AspectRatio {
  LANDSCAPE = "16:9",
  PORTRAIT = "9:16",
}

export enum Resolution {
  P720 = "720p",
  P1080 = "1080p",
}

/**
 * Duration values - supports both Veo (4s, 6s, 8s) and Wan (5, 10, 15)
 */
export type DurationValue = "4s" | "6s" | "8s" | "5" | "10" | "15"

/**
 * @deprecated Use DurationValue instead. Kept for backwards compatibility.
 */
export enum Duration {
  FOUR_SECONDS = "4s",
  SIX_SECONDS = "6s",
  EIGHT_SECONDS = "8s",
}

/**
 * @deprecated Use GenerationTypeId instead. Kept for backwards compatibility.
 */
export enum GenerationMode {
  TEXT_TO_VIDEO = "Text to Video",
  FRAMES_TO_VIDEO = "Frames to Video",
  REFERENCES_TO_VIDEO = "References to Video",
  EXTEND_VIDEO = "Extend Video",
}

export interface ImageFile {
  file: File
  base64: string
}

export interface VideoFile {
  file: File
  base64: string
}

/**
 * New flexible video generation params that work with any model
 */
export interface GenerateVideoParams {
  // Model and generation type
  modelId: VideoModelId
  generationTypeId: GenerationTypeId

  // Core parameters
  prompt: string
  negativePrompt?: string
  resolution: string // "720p" | "1080p"
  duration: DurationValue
  aspectRatio?: string // Optional, some models don't support it

  // Input files (conditional based on generation type)
  images?: ImageFile[]
  videos?: VideoFile[]
  taskId?: string // For extend-video type

  // Legacy fields for backwards compatibility
  startFrame?: ImageFile | null
  endFrame?: ImageFile | null
  referenceImages?: ImageFile[]
  styleImage?: ImageFile | null
  inputVideo?: VideoFile | null
  originalTaskId?: string
  isLooping?: boolean

  // Legacy model field
  model?: VeoModel
  mode?: GenerationMode
}

export interface VideoGeneration {
  id: string
  user_id?: string
  prompt: string
  negative_prompt?: string

  // New flexible fields
  model_id?: VideoModelId
  generation_type_id?: GenerationTypeId

  // Legacy field for backwards compatibility
  mode: GenerationMode | string
  model?: VeoModel | string

  status: "loading" | "complete" | "error"
  video_url?: string
  video_uri?: string
  task_id?: string
  duration?: string
  resolution: Resolution | string
  aspect_ratio?: AspectRatio | string
  error_message?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export enum AppState {
  IDLE = "IDLE",
  LOADING = "LOADING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}
