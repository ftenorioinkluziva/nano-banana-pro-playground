export interface Capability {
  id: string
  label: string
  description: string
  icon_name: string
  recommended_aspect_ratio: "16:9" | "9:16"
  generation_type: "TEXT_2_VIDEO" | "FIRST_AND_LAST_FRAMES_2_VIDEO" | "REFERENCE_2_VIDEO"
  is_active: boolean
}

export interface CapabilityFull extends Capability {
  base_prompt_template: string
  default_negative_prompt: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}
