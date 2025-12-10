-- Adicionar coluna target_audience à tabela products
-- Migration: 001_add_target_audience
-- Date: 2025-12-09

ALTER TABLE products
ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- Comentário descrevendo a coluna
COMMENT ON COLUMN products.target_audience IS 'Public-alvo/ICP do produto para geração de conteúdo UGC';

-- Opcional: Popular com valores padrão baseados em produtos existentes
-- UPDATE products
-- SET target_audience = 'General Audience'
-- WHERE target_audience IS NULL;
