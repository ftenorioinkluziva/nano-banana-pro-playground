-- Add brand_id to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;

-- Create index for foreign key
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);

-- Add comment
COMMENT ON COLUMN products.brand_id IS 'Associação do produto com uma marca para geração de conteúdo UGC com tom de voz personalizado';
