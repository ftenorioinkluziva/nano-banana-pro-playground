# Video Generation - Prompt Best Practices

## 📝 Estrutura de Prompt Efetivo

### 1. **Subject (Sujeito)**
Comece descrevendo o que/quem será o foco do vídeo.

✅ **Bom:**
```
"A majestic golden eagle soaring through snow-capped mountains"
```

❌ **Ruim:**
```
"Bird flying"
```

### 2. **Action (Ação)**
Descreva o que o sujeito está fazendo.

✅ **Bom:**
```
"A dancer gracefully spinning and leaping across a wooden stage floor"
```

❌ **Ruim:**
```
"Person dancing"
```

### 3. **Style (Estilo)**
Especifique a direção artística/cinematográfica.

**Opções:**
- Cinematográfico/Cinematic
- Film noir
- Cartoon
- Sci-fi
- Documentary
- Anime
- Oil painting style
- Hyperrealistic
- Minimalist
- Steampunk

✅ **Exemplo:**
```
"...with a cinematic, film noir aesthetic, dramatic shadows and moody lighting"
```

### 4. **Camera (Câmera)**
Defina ângulos, movimentos e perspectiva.

**Termos úteis:**
- Wide shot (plano geral)
- Close-up (plano aproximado)
- Aerial view (vista aérea)
- Low angle (ângulo baixo)
- Dutch angle (ângulo holandês)
- Tracking shot (movimento lateral)
- Zoom in/out (aproximação/afastamento)
- Pan (movimento de câmera)
- Dolly (câmera em movimento)

✅ **Exemplo:**
```
"...shot from an aerial perspective, camera slowly panning left, wide angle lens"
```

### 5. **Ambiance (Ambientação)**
Descreva cores, iluminação, hora do dia, clima.

**Elementos:**
- Lighting: Golden hour, neon, candlelit, sunlit, moonlit
- Weather: Rainy, snowy, foggy, clear
- Time: Dawn, dusk, midnight, golden hour
- Mood: Serene, energetic, mysterious, joyful

✅ **Exemplo:**
```
"...bathed in warm golden sunlight, with soft bokeh background, peaceful autumn colors"
```

## 🎬 Exemplos Completos

### Exemplo 1: Cena de Ação
```
"A parkour athlete jumping between rooftops in a cyberpunk cityscape,
performing acrobatic flips and twists. Filmed with cinematic camera movements,
wide establishing shots transitioning to dynamic close-ups. Neon blue and purple
lighting with rain-slicked surfaces reflecting the city lights. Fast-paced,
energetic music implied in the motion. Hyperrealistic quality, 4K cinema."
```

### Exemplo 2: Cena Serena
```
"A lone figure sitting on a cliff overlooking a misty mountain valley at sunrise.
Soft golden light filtering through clouds. Camera slowly pans to reveal the
expansive landscape. Peaceful, contemplative atmosphere. Warm earth tones with
blue undertones in the shadows. Wide landscape shots with shallow depth of field.
Documentary style, peaceful and meditative."
```

### Exemplo 3: Produto
```
"A sleek modern smartphone rotating slowly on a white marble surface,
showcasing its metallic finish and elegant design. Soft studio lighting creates
subtle reflections and shadows. Camera orbits smoothly around the device.
Minimalist composition with plenty of negative space. Professional product
photography style, ultra-sharp focus, gallery-worthy presentation."
```

### Exemplo 4: Natureza
```
"A herd of wild horses galloping freely through a golden wheat field at sunset.
Dust particles catch the warm orange and golden light. Wide cinematic shots
with dynamic camera movement following the herd. Epic, breathtaking atmosphere.
Natural cinematography style, professional documentary quality, golden hour
lighting, shallow focus on lead horses."
```

## 🚫 Negative Prompt - O que Evitar

Use negative prompts para excluir elementos indesejáveis.

✅ **Exemplo bem formado:**
```
Negative: "cartoon, drawing, painting, animation, low quality, blurry,
distorted, out of focus, watermark, text, 3D rendered, fake, artificial"
```

### Elementos Comuns para Evitar:
- **Qualidade:** low quality, blurry, distorted, pixelated
- **Estilo:** cartoon, drawing, painting, animation
- **Tecnologia:** 3D render, CGI, video game, digital art
- **Erros:** mutated, deformed, disfigured, ugly
- **Outros:** text, watermark, logo, cut off, duplicate

## 💡 Dicas Avançadas

### 1. **Ser Específico com Cores**
```
❌ "A car driving"
✅ "A glossy crimson sports car speeding along a coastal highway,
   metallic paint catching golden sunlight"
```

### 2. **Detalhar Expressões (Pessoas)**
```
❌ "A person smiling"
✅ "A woman with a genuine, joyful smile, eyes crinkled with happiness,
   warm and approachable expression"
```

### 3. **Especificar Movimento**
```
❌ "Water flowing"
✅ "Crystal clear water flowing gently downstream, creating delicate
   white foam, sunlight creating rainbow refractions through the spray"
```

### 4. **Descrever Detalhes Texturais**
```
"...with intricate details visible, velvet fabric with deep texture,
rough stone surfaces, smooth polished wood, weathered leather..."
```

## 📊 Duração vs Qualidade

| Duration | Ideal Para | Processamento |
|----------|-----------|----------------|
| **4 seg** | Loops curtos, sociais | Rápido (2-5 min) |
| **6 seg** | Histórias curtas, anúncios | Moderado (5-10 min) |
| **8 seg** | Vídeos completos | Longo (8-15 min) |

**Dica:** Use 8 segundos para máxima qualidade com resolução 1080p

## 🎯 Checklist para Prompts Efetivos

- [ ] Sujeito claramente identificado
- [ ] Ação/movimento descrito
- [ ] Estilo artístico definido
- [ ] Ângulo/movimento de câmera especificado
- [ ] Iluminação e ambiente descritos
- [ ] Adjetivos e advérbios utilizados (não apenas nomes)
- [ ] Detalhes específicos incluídos
- [ ] Negative prompt criado se necessário
- [ ] Duração apropriada selecionada
- [ ] Modelo apropriado escolhido

## 🔧 Ajustes por Modo

### Text to Video
- Máxima liberdade criativa
- Seja o mais descritivo possível
- Inclua atmosfera completa

### Frames to Video
- Relate movimento ao frame inicial
- Mantenha consistência visual
- Descreva transições

### References to Video
- Mencione características das imagens de referência
- Descreva como combiná-las
- Mantenha coesão visual

### Extend Video
- Seja coerente com o vídeo anterior
- Descreva transição suave
- Mantenha o mesmo tom/estilo

## 📈 Otimizações para Qualidade

1. **Use "cinematic" liberalmente** - Melhora qualidade geral
2. **Especifique lentes de câmera** - "Wide angle", "telephoto", "macro"
3. **Defina composição** - "Rule of thirds", "centered", "leading lines"
4. **Mencione materiais** - "Metallic", "matte", "translucent"
5. **Inclua profundidade** - "Foreground", "background", "depth of field"

## 🎨 Exemplos por Gênero

### Ação/Aventura
"...fast-paced cinematography, dynamic camera movements, professional action film quality"

### Documentário
"...natural lighting, observational camera work, authentic and immersive"

### Fantasy/Sci-Fi
"...otherworldly, magical atmosphere, vibrant neon colors, dramatic lighting"

### Romance
"...soft focus, intimate framing, warm color grading, emotional atmosphere"

### Horror
"...ominous atmosphere, low-key lighting, suspenseful camera work, dark tones"

