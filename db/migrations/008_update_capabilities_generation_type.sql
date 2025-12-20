-- Atualizar o campo model_mode para usar os valores corretos da API Veo 3

-- 1. Remover constraint antigo
ALTER TABLE capabilities DROP CONSTRAINT IF EXISTS capabilities_model_mode_check;

-- 2. Renomear coluna para refletir melhor o propósito
ALTER TABLE capabilities RENAME COLUMN model_mode TO generation_type;

-- 3. PRIMEIRO atualizar valores existentes para os novos formatos
UPDATE capabilities
SET generation_type = 'TEXT_2_VIDEO'
WHERE generation_type IN ('text_to_video', 'TEXT_TO_VIDEO');

UPDATE capabilities
SET generation_type = 'FIRST_AND_LAST_FRAMES_2_VIDEO'
WHERE generation_type IN ('image_to_video', 'IMAGE_TO_VIDEO');

-- 4. DEPOIS adicionar constraint com os valores corretos da API Veo 3
ALTER TABLE capabilities
ADD CONSTRAINT capabilities_generation_type_check
CHECK (generation_type IN ('TEXT_2_VIDEO', 'FIRST_AND_LAST_FRAMES_2_VIDEO', 'REFERENCE_2_VIDEO'));

-- 5. Adicionar comentário
COMMENT ON COLUMN capabilities.generation_type IS 'Tipo de geração da API Veo 3: TEXT_2_VIDEO, FIRST_AND_LAST_FRAMES_2_VIDEO, ou REFERENCE_2_VIDEO';

-- 6. Verificar capabilities atualizadas
SELECT id, label, generation_type FROM capabilities ORDER BY created_at;
