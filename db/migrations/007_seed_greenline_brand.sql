-- Seed Greenline Premium brand
INSERT INTO brands (name, tone, description)
VALUES (
  'Green Line Premium',
  'energetic',
  'E-commerce de suplementos nutricionais e produtos de bem-estar com foco em saúde acessível. Oferece produtos para emagrecimento, vitaminas, cuidados femininos, sono, treino e articulações com mensagens motivacionais e inclusivas.'
)
ON CONFLICT (name) DO UPDATE SET
  tone = EXCLUDED.tone,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Exibir a brand criada
SELECT id, name, tone FROM brands WHERE name = 'Green Line Premium';
