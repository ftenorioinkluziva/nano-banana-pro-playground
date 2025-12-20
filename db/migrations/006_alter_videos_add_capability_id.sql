-- Add capability_id, product_id, and prompt tracking columns to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS capability_id TEXT REFERENCES capabilities(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS enhanced_prompt TEXT,
ADD COLUMN IF NOT EXISTS original_user_request TEXT;

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_videos_capability_id ON videos(capability_id);
CREATE INDEX IF NOT EXISTS idx_videos_product_id ON videos(product_id);

-- Add comments
COMMENT ON COLUMN videos.capability_id IS 'Capability usada para gerar este vídeo UGC';
COMMENT ON COLUMN videos.product_id IS 'Produto associado a este vídeo UGC';
COMMENT ON COLUMN videos.enhanced_prompt IS 'Prompt técnico gerado pelo Director Agent (Gemini)';
COMMENT ON COLUMN videos.original_user_request IS 'Descrição original fornecida pelo usuário antes do enhancement';
