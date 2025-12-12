-- Creato - Image Generation History Schema
-- Execute this SQL file in your Neon PostgreSQL database

-- Create generations table
CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('text-to-image', 'image-editing')),
  status TEXT NOT NULL CHECK (status IN ('loading', 'complete', 'error')) DEFAULT 'complete',
  image_url TEXT,
  image_urls TEXT[], -- Array of image URLs for multiple generations
  aspect_ratio TEXT DEFAULT '1:1',
  model TEXT DEFAULT 'gemini-2.5-flash-image',
  description TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create images table for storing actual image data
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  generation_id TEXT NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  image_data BYTEA NOT NULL,
  mime_type TEXT DEFAULT 'image/png',
  size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create videos table for video generation history
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('Text to Video', 'Frames to Video', 'References to Video', 'Extend Video')),
  status TEXT NOT NULL CHECK (status IN ('loading', 'complete', 'error')) DEFAULT 'complete',
  video_uri TEXT,
  video_url TEXT,
  resolution TEXT DEFAULT '720p' CHECK (resolution IN ('720p', '1080p')),
  aspect_ratio TEXT DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16')),
  duration TEXT DEFAULT '6s' CHECK (duration IN ('4s', '6s', '8s')),
  model TEXT DEFAULT 'veo-3.1-fast-generate-preview',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_deleted_at ON generations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_images_generation_id ON images(generation_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_deleted_at ON videos(deleted_at) WHERE deleted_at IS NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_generations_updated_at BEFORE UPDATE ON generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON generations TO neondb_owner;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON images TO neondb_owner;
