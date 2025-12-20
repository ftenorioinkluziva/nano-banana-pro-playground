Especificação Técnica: Módulo Gerador de Vídeo UGC (AI Agent)
1. Visão GeralEste módulo tem como objetivo permitir que o usuário faça upload de uma foto de persona e uma foto de produto, insira um briefing simples, e receba como saída um roteiro estruturado com prompts prontos para ferramentas de vídeo (Runway/Kling/Nano Banana) e textos para TTS (Text-to-Speech).
2. 2. Fluxo de DadosFrontend: Usuário envia Imagens + Texto.Backend:Converte imagens para URL ou Base64 (conforme suporte do LLM).Monta o Payload JSON.Envia para LLM (GPT-4o / Claude 3.5 Sonnet) com o System Prompt.Processamento (AI): LLM gera o roteiro em JSON.Output: Frontend recebe JSON e exibe os cards das cenas para o usuário gerar os vídeos.
3. 3. Especificação do Frontend (Entrada)A interface deve coletar os seguintes dados para compor o objeto inputs:CampoTipoObrigatórioDescriçãopersona_imageFile (Img)SimFoto da pessoa que será animada.product_imageFile (Img)SimFoto do produto.product_nameStringSimEx: "Greenline Resolvedor"pain_pointTextareaSimEx: "Dores nas costas ao acordar."contextStringNãoEx: "Cozinha, manhã de sol." (Se null, AI infere da foto).toneSelectSimOptions: ["Natural/Amigo", "Enérgico", "Sério"].
4. 4. Integração com LLM (Backend Payload)Ao chamar a API do modelo (ex: OpenAI Chat Completions), a estrutura da mensagem do usuário (user_message) deve ser:JSON{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "Generate a UGC video script based on these inputs:\nProduct: Greenline Resolvedor\nBenefit: Relief for back pain in 40s women.\nContext: Domestic Kitchen.\nTone: Relatable/Friendly."
    },
    {
      "type": "image_url",
      "image_url": { "url": "URL_DA_PERSONA" }
    },
    {
      "type": "image_url",
      "image_url": { "url": "URL_DO_PRODUTO" }
    }
  ]
}
Nota: Certifique-se de configurar o parâmetro response_format: { type: "json_object" } na chamada da API para garantir a integridade do JSON.5. Especificação da Resposta (JSON Schema)O Frontend deve estar preparado para receber e renderizar este JSON exato:JSON{
  "project_summary": "Vídeo estilo selfie focado em alívio de dor nas costas para mães.",
  "scenes": [
    {
      "scene_id": 1,
      "type": "hook",
      "duration_seconds": 5,
      "video_prompt_en": "Subject: A person based on the uploaded reference image of the persona. Action: looking at camera rubbing lower back with a tired expression. Context: Domestic kitchen with morning light. Camera: Vertical 9:16, handheld shake.",
      "audio_script_pt": "Gente... sério. Cês não tem noção de como minhas costas tavam travadas hoje cedo.",
      "direction_notes": "Expressão de dor inicial, mudando para contato visual direto."
    },
    {
      "scene_id": 2,
      "type": "solution",
      "duration_seconds": 6,
      "video_prompt_en": "Subject: A person based on the uploaded reference image of the persona, holding the product based on the uploaded reference image of the product. Action: smiling with relief, showing the bottle to the camera lens. Context: Domestic kitchen with morning light. Camera: Vertical 9:16, focus on bottle.",
      "audio_script_pt": "Aí eu tomei o Resolvedor, né? E olha... parece mágica, destravou total!",
      "direction_notes": "Sorriso genuíno de alívio. O produto deve entrar em foco."
    },
    {
      "scene_id": 3,
      "type": "cta",
      "duration_seconds": 4,
      "video_prompt_en": "Subject: A person based on the uploaded reference image of the persona. Action: gesturing 'call me' or pointing down enthusiastically holding the product. Context: Domestic kitchen. Camera: Vertical 9:16.",
      "audio_script_pt": "Se você tá sofrendo com isso, clica aqui embaixo. Salva a vida!",
      "direction_notes": "Gesto claro de chamada para ação."
    }
  ]
}


O System Prompt (Backend)
Este prompt deve ser enviado ao seu modelo da Gemini que já estamos utilizando. Ele garante que a resposta seja um JSON puro, facilitando que seu código pegue os textos e prompts automaticamente.

# SYSTEM ROLE
Você é um Diretor de Criação de Vídeo IA e Especialista em UGC (User Generated Content). Sua função é receber dados estruturados de uma campanha (Persona, Produto, Contexto) e gerar um roteiro técnico dividido em cenas modulares.

# INPUT DATA
Você receberá um JSON contendo:
- `product_name`: Nome do produto.
- `core_benefit`: A principal dor ou benefício.
- `tone`: O tom de voz desejado.
- `visual_refs`: Confirmação de que imagens de referência da persona e do produto foram enviadas.

# TASK
Criar um roteiro de 3 a 4 cenas (máximo 8 segundos cada) otimizado para geração "Image-to-Video".

# CRITICAL RULES
1. **Output Format**: Você deve responder APENAS com um objeto JSON válido. Não use Markdown, não converse.
2. **Video Prompts (English)**:
   - Os prompts de vídeo devem ser em INGLÊS.
   - JAMAIS descreva a aparência física da persona ou do produto.
   - USE ESTRITAMENTE estes placeholders para ativar o Image-to-Video:
     - Para a pessoa: "based on the uploaded reference image of the persona"
     - Para o produto: "holding the product based on the uploaded reference image of the product"
3. **Audio Script (Portuguese)**:
   - O texto deve ser em Português do Brasil (PT-BR).
   - Use linguagem coloquial, pausas (...) e naturalidade.
   - O texto deve ser curto o suficiente para caber na duração da cena.

# JSON OUTPUT STRUCTURE
{
  "project_summary": "Resumo de 1 frase",
  "scenes": [
    {
      "scene_id": 1,
      "duration_seconds": 5,
      "video_prompt_en": "Subject: [PLACEHOLDERS]... Action: ... Context: ...",
      "audio_script_pt": "Texto falado...",
      "direction_notes": "Nota de direção"
    }
  ]
}