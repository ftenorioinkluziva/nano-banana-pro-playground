-- Migration: Create scene_videos table for storing generated videos from UGC scripts
-- This table stores video generation results linked to specific scenes in scripts

CREATE TABLE IF NOT EXISTS scene_videos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  script_id TEXT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  scene_id INTEGER NOT NULL, -- Reference to scene_id in script_json

  -- Video generation metadata
  video_url TEXT, -- URL from KieAI CDN
  video_base64 TEXT, -- Base64 data URL for offline storage (MVP)
  task_id TEXT, -- KieAI task ID for tracking

  -- Generation parameters (stored for reference)
  prompt_used TEXT NOT NULL, -- video_prompt_en used for generation
  model TEXT NOT NULL DEFAULT 'veo3_fast', -- veo3_fast or veo3
  aspect_ratio TEXT NOT NULL DEFAULT '9:16', -- Video aspect ratio
  resolution TEXT NOT NULL DEFAULT '720p', -- Video resolution
  duration TEXT NOT NULL, -- e.g., "5s" based on scene.duration_seconds
  mode TEXT NOT NULL DEFAULT 'TEXT_2_VIDEO', -- Generation mode

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('generating', 'complete', 'error')) DEFAULT 'generating',
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_scene_videos_script_id ON scene_videos(script_id);
CREATE INDEX idx_scene_videos_script_scene ON scene_videos(script_id, scene_id);
CREATE INDEX idx_scene_videos_status ON scene_videos(status);

-- Unique constraint: only one video per scene in MVP
-- Allows future versioning by dropping this constraint
CREATE UNIQUE INDEX idx_scene_videos_unique_scene ON scene_videos(script_id, scene_id)
  WHERE status IN ('complete', 'generating');

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_scene_videos_updated_at
  BEFORE UPDATE ON scene_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE scene_videos IS 'Stores generated videos for individual scenes in UGC scripts';
COMMENT ON COLUMN scene_videos.video_base64 IS 'Base64 encoded video for offline storage, limited to ~50MB';
COMMENT ON COLUMN scene_videos.prompt_used IS 'The video_prompt_en from the scene used to generate this video';
COMMENT ON INDEX idx_scene_videos_unique_scene IS 'Ensures only one video per scene (can be dropped for versioning)';
