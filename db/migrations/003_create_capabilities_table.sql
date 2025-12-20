-- Create capabilities table
CREATE TABLE IF NOT EXISTS capabilities (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT DEFAULT 'video',
  base_prompt_template TEXT NOT NULL,
  recommended_aspect_ratio TEXT DEFAULT '9:16' CHECK (recommended_aspect_ratio IN ('16:9', '9:16')),
  default_negative_prompt TEXT,
  model_mode TEXT DEFAULT 'text_to_video' CHECK (model_mode IN ('text_to_video', 'image_to_video')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_capabilities_is_active ON capabilities(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_capabilities_deleted_at ON capabilities(deleted_at) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_capabilities_updated_at BEFORE UPDATE ON capabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE capabilities IS 'Templates de capabilities para geração de vídeos UGC';
COMMENT ON COLUMN capabilities.base_prompt_template IS 'Template de prompt técnico usado pelo Director Agent';
COMMENT ON COLUMN capabilities.model_mode IS 'Define se usa text_to_video ou image_to_video';
