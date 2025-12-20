-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tone TEXT, -- Tom de voz da marca (casual, professional, energetic, etc.)
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create index for soft delete
CREATE INDEX IF NOT EXISTS idx_brands_deleted_at ON brands(deleted_at) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE brands IS 'Marcas para associação com produtos e geração de conteúdo UGC';
COMMENT ON COLUMN brands.tone IS 'Tom de voz da marca usado pelo Director Agent (casual, professional, energetic)';
