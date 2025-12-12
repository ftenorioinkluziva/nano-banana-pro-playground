// Video Generation Types
export enum VeoModel {
  VEO_FAST = "veo-3.1-fast-generate-preview",
  VEO = "veo-3.1-generate-preview",
}

export enum AspectRatio {
  LANDSCAPE = "16:9",
  PORTRAIT = "9:16",
}

export enum Resolution {
  P720 = "720p",
  P1080 = "1080p",
}

export enum Duration {
  FOUR_SECONDS = "4s",
  SIX_SECONDS = "6s",
  EIGHT_SECONDS = "8s",
}

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

export interface GenerateVideoParams {
  prompt: string
  negativePrompt?: string
  model: VeoModel
  aspectRatio: AspectRatio
  resolution: Resolution
  duration?: Duration
  mode: GenerationMode
  startFrame?: ImageFile | null
  endFrame?: ImageFile | null
  referenceImages?: ImageFile[]
  styleImage?: ImageFile | null
  inputVideo?: VideoFile | null
  isLooping?: boolean
}

export interface VideoGeneration {
  id: string
  user_id?: string
  prompt: string
  mode: GenerationMode
  status: "loading" | "complete" | "error"
  video_url?: string
  video_uri?: string
  duration?: number
  resolution: Resolution
  aspect_ratio: AspectRatio
  model: VeoModel
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
