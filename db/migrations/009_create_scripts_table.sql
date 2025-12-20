-- Migration: Create scripts table for UGC Script Generator
-- This table stores structured video scripts with persona images, product info, and generated scenes

CREATE TABLE IF NOT EXISTS scripts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,

  -- Input data
  persona_image_base64 TEXT NOT NULL, -- Base64 data URL of persona photo
  product_name TEXT NOT NULL,
  pain_point TEXT NOT NULL,
  context TEXT, -- Optional, AI will infer from photo if null
  tone TEXT NOT NULL CHECK (tone IN ('natural_friendly', 'energetic', 'serious')),

  -- Generated output
  project_summary TEXT NOT NULL,
  script_json JSONB NOT NULL, -- Full structured script with scenes array

  -- Metadata
  status TEXT NOT NULL CHECK (status IN ('generating', 'complete', 'error')) DEFAULT 'complete',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scripts_product_id ON scripts(product_id);
CREATE INDEX IF NOT EXISTS idx_scripts_created_at ON scripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scripts_status ON scripts(status) WHERE status != 'complete';

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scripts_updated_at
  BEFORE UPDATE ON scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_scripts_updated_at();
