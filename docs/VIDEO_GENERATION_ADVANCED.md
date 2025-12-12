# Geração de Vídeos - Guia Técnico Avançado

## 🎯 Parâmetros Avançados do Veo 3.1

### 1. **Duração (Duration)**

O Veo 3.1 suporta 3 durações fixas:

| Duration | Resolução Máxima | Tempo de Processamento | Ideal Para |
|----------|------------------|------------------------|-----------|
| **4s** | 1080p | 1-3 min | Social media, TikTok |
| **6s** | 1080p | 3-6 min | YouTube shorts, reels |
| **8s** | 1080p | 5-12 min | Full videos, cinematic |

**Importante:** 1080p está disponível em TODAS as durações (ao contrário do que a documentação antiga mencionava).

### 2. **Resoluções e Aspect Ratios**

**Resoluções:**
- 720p (padrão, mais rápido)
- 1080p (máxima qualidade, mais lento)

**Aspect Ratios:**
- 16:9 (Landscape) - Padrão, mais versátil
- 9:16 (Portrait) - Para mobile, TikTok, reels

### 3. **Modelos Disponíveis**

```typescript
enum VeoModel {
  VEO_FAST = "veo-3.1-fast-generate-preview",
  VEO = "veo-3.1-generate-preview",
}
```

**Comparação:**

| Modelo | Velocidade | Qualidade | Ideal Para |
|--------|-----------|-----------|-----------|
| **VEO_FAST** | ⚡ Rápido | Bom | Prototipos, testes |
| **VEO** | 🚗 Moderado | Excelente | Produção final |

### 4. **Negative Prompts**

Especificar o que NÃO incluir:

```typescript
negativePrompt: "cartoon, drawing, low quality, blurry, distorted, watermark"
```

**Sintaxe correta:**
- ✅ Descrever o que NÃO quer: "cartoon, low quality"
- ❌ Usar "don't" ou "no": "don't include cartoon"

**Elementos comuns a evitar:**
- Qualidade: "low quality, blurry, pixelated, bad quality"
- Estilo: "cartoon, drawing, painting, 3D render"
- Erros: "deformed, mutated, distorted, ugly"
- Artefatos: "watermark, text, logo, artifacts"

## 🎬 Modos de Geração Detalhados

### 1. Text to Video
**Parametros principais:**
- `prompt` (obrigatório)
- `negativePrompt` (opcional)
- `model`, `resolution`, `duration`, `aspectRatio`

**Fluxo:**
```
Prompt Descritivo
    ↓
Análise de conteúdo
    ↓
Geração de frames de base
    ↓
Interpolação suave entre frames
    ↓
Vídeo final com áudio
```

**Estratégia:**
1. Seja extremamente descritivo
2. Inclua estilo cinematográfico
3. Especifique movimento de câmera
4. Defina iluminação e atmosfera

### 2. Frames to Video (Interpolação)
**Parametros:**
- `startFrame` (obrigatório)
- `endFrame` (opcional)
- `prompt` (descrição da transição)
- `isLooping` (opcional)

**Casos de uso:**
- Interpolar entre 2 imagens
- Criar transições suaves
- Loops infinitos

**Exemplo:**
```typescript
params = {
  mode: "Frames to Video",
  startFrame: imageA,
  endFrame: imageB,
  prompt: "Smooth 3D transition between images, camera fly-through",
  isLooping: false
}
```

### 3. References to Video
**Parametros:**
- `referenceImages` (até 3, obrigatório)
- `styleImage` (opcional)
- `prompt` (como usar as referências)

**Tipos de referência:**
- **ASSET**: Imagens para guiar conteúdo visual
- **STYLE**: Imagem para guiar estilo artístico

**Estratégia:**
```
Ref Image 1: Estrutura/Personagem
Ref Image 2: Ambiente/Contexto
Ref Image 3: Detalhes/Props
Style Image: Estilo artístico overall
```

### 4. Extend Video
**Parametros:**
- `inputVideo` (obrigatório)
- `prompt` (como continuar)
- `resolution: 720p` (apenas 720p suportado)
- `duration: 8s` (duração da extensão)

**Capacidades:**
- Estender até 7 segundos
- Manter consistência visual
- Sem emenda perceptível

**Exemplo:**
```typescript
params = {
  mode: "Extend Video",
  inputVideo: previousVideo,
  prompt: "Camera pulls back to reveal the landscape, sunset lighting",
  resolution: "720p",
  duration: "8s"
}
```

## 📊 Performance e Otimizações

### Tempo de Processamento

| Configuração | Tempo Estimado |
|--------------|----------------|
| 4s @ 720p | 1-2 minutos |
| 6s @ 720p | 2-4 minutos |
| 8s @ 720p | 3-6 minutos |
| 4s @ 1080p | 2-3 minutos |
| 6s @ 1080p | 4-6 minutos |
| 8s @ 1080p | 6-12 minutos |

### Otimizações

**Para velocidade:**
- Use VEO_FAST
- Duração 4s
- Resolução 720p
- Aspect ratio 16:9

**Para qualidade:**
- Use VEO
- Duração 8s
- Resolução 1080p
- Prompt detalhado + negative prompt

## 🔄 Polling e Assincronismo

A geração é assíncrona via operações de longa duração:

```typescript
// 1. Enviar request
POST /api/generate-video
Response: { operationId, ... }

// 2. Polling
GET /operations/{operationId}
Repeat every 10 seconds until done=true

// 3. Resultado
{ done: true, response: { generatedVideos: [...] } }
```

**Implementação no Creato:**
- Polling automático a cada 10s
- Progress tracking visual (0-80% durante geração, 80-100% finalização)
- Cancel via AbortController

## 🎨 Técnicas Cinematográficas

### Movimento de Câmera
```
"Camera slowly pans left to right"
"Tracking shot following the subject"
"Dolly zoom effect, camera moving backward while zooming in"
"Aerial drone footage circling the landscape"
"First-person perspective, immersive POV"
```

### Composição Visual
```
"Rule of thirds composition"
"Subject centered in frame"
"Leading lines drawing eye across frame"
"Symmetrical composition"
"Negative space for emphasis"
```

### Efeitos Especiais
```
"Depth of field with soft blur background"
"Shallow focus on subject"
"Motion blur on moving elements"
"Lens flare and light artifacts"
"Film grain for cinematic texture"
```

## 🌟 Prompt Engineering Avançado

### Técnica 1: Estratificação
```
"[SUBJECT] [ACTION] [SETTING],
 [CINEMATOGRAPHY] [STYLE] [MOOD],
 [TECHNICAL_DETAILS] [QUALITY]"

Exemplo:
"A majestic white horse galloping through misty meadow,
 wide cinematic shot with tracking camera, epic fantasy style with mystical mood,
 cinematic color grading with golden hour lighting, 4K professional quality"
```

### Técnica 2: Direção de Câmera Explícita
```
"..., camera: [ANGLE] [MOVEMENT] [DISTANCE],
 aperture [F-NUMBER], [LENS_TYPE]"

Exemplo:
"..., camera: wide angle, panning left, medium distance,
 aperture f/2.8, 35mm lens"
```

### Técnica 3: Atmosfera e Clima
```
"..., atmosphere: [TIME] [WEATHER] [LIGHTING],
 mood: [EMOTION] [TONE]"

Exemplo:
"..., atmosphere: golden hour sunrise, light fog with mist,
 warm diffused lighting, mood: peaceful and contemplative, serene"
```

## 🔧 Resolução de Problemas

### Problema: Vídeo parece "cartoon" ou "artificial"

**Solução:**
- Adicione ao prompt: "photorealistic, hyperrealistic, professional cinematography"
- Use negative prompt: "cartoon, 3D render, animated, artificial"
- Aumentar duração de 4s para 6-8s

### Problema: Movimento é entrecortado

**Solução:**
- Aumentar duração (mais frames para interpolar)
- Ser mais específico com movimento: "smooth flowing motion, seamless transitions"
- Usar "cinematic" para suavização automática

### Problema: Consistência visual entre frames

**Solução:**
- Usar `referenceImages` para guiar visual
- Ser consistente no prompt
- Usar `styleImage` para manter estilo

### Problema: Geração muito lenta

**Solução:**
- Usar `VEO_FAST` ao invés de `VEO`
- Reduzir duração para 4s
- Usar 720p ao invés de 1080p
- Simplificar prompt (menos detalhes)

## 📈 Boas Práticas

1. **Sempre incluir "cinematic" para melhor qualidade**
2. **Especificar iluminação explicitamente**
3. **Usar negative prompts para eliminar artefatos**
4. **Testar duração: 6s é bom balance entre velocidade/qualidade**
5. **Para 1080p, sempre usar 8s**
6. **Frames to Video funciona melhor com imagens de alta qualidade**
7. **Extend Video mantém melhor consistência que regenerar tudo**
8. **References to Video ideal para manter consistência de personagem**

## 🎬 Templates por Tipo de Conteúdo

### Social Media (TikTok/Reels)
```
Duration: 4-6s
Aspect: 9:16
Quality: VEO_FAST, 720p
Prompt style: Energetic, fast-paced, trending, hook in first 2 seconds
```

### Marketing/Advertising
```
Duration: 6-8s
Aspect: 16:9
Quality: VEO, 1080p
Prompt style: Professional, polished, product-focused, call-to-action implied
```

### Cinematic/Storytelling
```
Duration: 8s
Aspect: 16:9
Quality: VEO, 1080p
Prompt style: Narrative-driven, atmospheric, emotional, high production value
```

### Product Showcase
```
Duration: 6-8s
Aspect: 16:9
Quality: VEO, 1080p
Use: References to Video com imagens do produto
Prompt: "Rotating, highlighting features, studio lighting, professional product photography"
```

