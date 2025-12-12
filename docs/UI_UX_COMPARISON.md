# Comparação UI/UX das Páginas do Creato

## Visão Geral

O projeto possui 5 páginas principais com diferentes propósitos e experiências de usuário:

| Página | URL | Propósito | Complexidade |
|--------|-----|-----------|--------------|
| **Home** | `/` | Landing page e navegação | ⭐ Simples |
| **Images** | `/images` | Geração e edição de imagens | ⭐⭐⭐⭐⭐ Muito Complexa |
| **Videos** | `/videos` | Geração de vídeos AI | ⭐⭐⭐⭐ Complexa |
| **Products** | `/products` | Gerenciamento de produtos | ⭐⭐⭐ Moderada |
| **UGC** | `/ugc` | Geração de vídeos UGC | ⭐⭐ Simples |

---

## 1. Home Page (`/`)

### Propósito
Landing page que apresenta todas as funcionalidades e direciona para as ferramentas.

### Layout
```
┌─────────────────────────────────────┐
│         HERO SECTION                │
│  AI-Powered Creative Generation     │
│                                     │
│  [Get Started] [Learn More]        │
├─────────────────────────────────────┤
│         FEATURE CARDS               │
│  ┌────────┐ ┌────────┐             │
│  │ Images │ │ Videos │             │
│  └────────┘ └────────┘             │
│  ┌────────┐ ┌────────┐             │
│  │Product │ │  UGC   │             │
│  └────────┘ └────────┘             │
└─────────────────────────────────────┘
```

### Características
- **Fundo**: Gradient preto (`from-black via-black to-zinc-900`)
- **Hero Section**: Texto grande, centralizado com CTAs
- **Feature Cards**: 4 cards com ícones, título, descrição e botão
- **Ícones**: Lucide React (Image, Video, Sparkles, Zap)
- **Navegação**: Buttons com `Link` do Next.js

### UX
✅ **Simples e direta**
✅ **Clara separação de funcionalidades**
✅ **Boa hierarquia visual**
✅ **Responsiva**

---

## 2. Images Page (`/images`)

### Propósito
Ferramenta completa de geração e edição de imagens com IA.

### Layout (Resizable Split View)
```
┌─────────────────────────────────────────────────────┐
│              Navigation Bar (Top)                   │
├──────────────────┬──────────────────────────────────┤
│  INPUT SECTION   │  RESIZE │  OUTPUT SECTION        │
│  (Left Panel)    │   BAR   │  (Right Panel)         │
│                  │         │                        │
│  • Logo          │         │  • Generated Images    │
│  • Prompt        │    ⟷    │  • Image Actions       │
│  • Image Upload  │         │  • Fullscreen View     │
│  • Settings      │         │  • Download/Copy       │
│  • History       │         │                        │
│                  │         │                        │
└──────────────────┴─────────┴────────────────────────┘
```

### Características Únicas

#### 1. **Resizable Split View**
- Divisor arrastável entre painéis esquerdo/direito
- Largura ajustável (min 30%, max 70%)
- Estado preservado durante a sessão

#### 2. **Input Section (Esquerda)**
- **Logo animado** com loading skeleton
- **Prompt textarea** com auto-resize
- **Upload de imagens**:
  - Suporta drag & drop
  - File upload ou URL
  - Conversão automática HEIC → PNG
  - Preview de imagens
- **Aspect Ratio selector**:
  - Portrait (9:16), Landscape (16:9), Wide (21:9)
  - Square (1:1), 4:3, 3:4, 3:2, 2:3, 5:4, 4:5
- **Model selector**: Gemini 2.5 Flash vs Gemini 3 Pro
- **Number of images**: 1-4 imagens por geração
- **Generation History**: Grid de thumbnails com lazy loading

#### 3. **Output Section (Direita)**
- Display de múltiplas imagens geradas
- **Action buttons** por imagem:
  - Download
  - Copy to clipboard
  - Use as input
  - Fullscreen view
  - Delete
- **Image info**: Timestamp, prompt, model

#### 4. **Global Features**
- **Global Drop Zone**: Drop imagens em qualquer lugar
- **Keyboard Shortcuts**:
  - `Cmd/Ctrl + Enter`: Generate
  - `Cmd/Ctrl + C`: Copy image
  - `Cmd/Ctrl + D`: Download
  - `Cmd/Ctrl + U`: Use as input
  - `Escape`: Close fullscreen
- **Paste Detection**: Cola imagens de clipboard
- **Fullscreen Viewer**: Modal com navegação por setas
- **Toast Notifications**: Feedback visual
- **Dithering Effect**: Shader visual (@paper-design/shaders-react)
- **Persistent History**: IndexedDB + Neon Database sync
- **Prompt Enhancement**: AI-powered prompt improvement

#### 5. **Advanced Features**
- **Enhanced Prompt Dialog**:
  - Suggestions categorized (subject, action, style, camera, composition, ambiance)
  - Regenerate suggestions
  - Apply/discard
- **Image Analysis**: Analisa imagens uploaded para melhorar prompt
- **HEIC Conversion**: Converte HEIC para PNG client-side
- **Progress Bar**: Mostra progresso de upload/geração

### UX
✅ **Altamente interativa**
✅ **Workflow profissional**
✅ **Muitos atalhos de teclado**
✅ **Drag & drop global**
✅ **Persistent state**
✅ **Visual feedback em tempo real**
⚠️ **Curva de aprendizado média** (muitas features)

### Problemas Identificados
⚠️ **Complexidade**: Muitas features podem confundir novos usuários
⚠️ **Performance**: Dithering shader pode impactar performance
⚠️ **Mobile**: Resizable split view difícil em mobile

---

## 3. Videos Page (`/videos`)

### Propósito
Geração de vídeos profissionais usando Google Veo AI.

### Layout (State-based)
```
┌─────────────────────────────────────┐
│         Navigation Bar              │
├─────────────────────────────────────┤
│                                     │
│  STATE: IDLE                        │
│  ┌───────────────────────────────┐  │
│  │  VideoGenerationForm          │  │
│  │  • Mode Selector              │  │
│  │  • Prompt Textarea            │  │
│  │  • Media Uploads              │  │
│  │  • Settings Panel             │  │
│  │  • [Generate Button]          │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  STATE: LOADING                     │
│  ┌───────────────────────────────┐  │
│  │  Loading Indicator            │  │
│  │  • Progress Bar (0-100%)      │  │
│  │  • Status Message             │  │
│  │  • Spinner Animation          │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  STATE: SUCCESS                     │
│  ┌───────────────────────────────┐  │
│  │  VideoResult Component        │  │
│  │  • Video Player               │  │
│  │  • Metadata Display           │  │
│  │  • [Retry] [New Video]        │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  STATE: ERROR                       │
│  ┌───────────────────────────────┐  │
│  │  Error Message                │  │
│  │  • Error Details              │  │
│  │  • [Try Again]                │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Características

#### 1. **Mode Selector**
- **Text to Video**: Apenas prompt
- **Frames to Video**: Start frame + End frame (com opção looping)
- **References to Video**: Até 3 imagens de referência + estilo
- **Extend Video**: (não implementado)

#### 2. **Prompt Enhancement**
- **AI-powered enhancement dialog**
- Categorias de sugestões
- Regenerate/Apply/Discard

#### 3. **Settings Panel**
- **Model**: VEO Fast vs VEO Standard
- **Resolution**: 720p vs 1080p
- **Aspect Ratio**: 16:9 vs 9:16
- **Duration**: 4s, 6s, 8s
- **Validações automáticas** (ex: 1080p = 8s apenas)

#### 4. **Media Uploads**
Dependendo do modo:
- **Frames to Video**: 2 upload boxes (Start/End frame)
- **References to Video**: Multiple upload boxes (até 3 refs + 1 style)
- Preview de imagens com delete button

#### 5. **Video Result**
- HTML5 video player com controles
- Metadata: Mode, Resolution, Aspect Ratio, Model
- Botões: Retry, New Video
- Auto-play com loop

#### 6. **Progress Tracking**
- Simulated progress (0-80% durante upload)
- Real progress (80-100% durante polling)
- Visual progress bar

### UX
✅ **Workflow linear claro** (Form → Loading → Result)
✅ **Validações em tempo real**
✅ **Feedback visual constante**
✅ **States bem definidos**
⚠️ **Tempo de espera longo** (2-10 minutos por vídeo)
⚠️ **Sem histórico visual** (apenas último vídeo)

### Diferenças vs Images
| Feature | Images | Videos |
|---------|--------|--------|
| **Layout** | Split view resizable | Single view state-based |
| **History** | Grid de thumbnails | Nenhum |
| **Multi-output** | 1-4 imagens | 1 vídeo |
| **Upload** | Global drag & drop | Per-mode specific |
| **Preview** | Múltiplas imagens lado a lado | Single video player |
| **Generation Time** | 5-30 segundos | 2-10 minutos |
| **Persistent State** | IndexedDB + DB | Apenas in-memory |

---

## 4. Products Page (`/products`)

### Propósito
CRUD de produtos para catálogo de e-commerce.

### Layout (Vertical Stack)
```
┌─────────────────────────────────────┐
│         Navigation Bar              │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  ProductForm Component        │  │
│  │  (Create/Edit Mode)           │  │
│  │                               │  │
│  │  • Product Name               │  │
│  │  • Description                │  │
│  │  • Price, Category, Format    │  │
│  │  • Ingredients, Benefits      │  │
│  │  • Image URL                  │  │
│  │  • Nutritional Info (JSON)    │  │
│  │                               │  │
│  │  [Save] [Cancel]              │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  ProductList Component        │  │
│  │                               │  │
│  │  • Search Bar                 │  │
│  │  • Filter by Category         │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Product Card 1          │  │  │
│  │  │ [Edit] [Delete]         │  │  │
│  │  └─────────────────────────┘  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Product Card 2          │  │  │
│  │  └─────────────────────────┘  │  │
│  │  ...                          │  │
│  │                               │  │
│  │  [Load More]                  │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Características

#### 1. **ProductForm Component**
- **Dual Mode**: Create new or Edit existing
- **Rich Fields**:
  - Text inputs (name, slug, price, category, format)
  - Textareas (description, usage, contraindications, ingredients)
  - JSON editors (benefits, nutritional_info)
  - Image URL input
  - Active/Inactive toggle
- **Auto-scroll**: Scroll to top quando edita produto
- **Validation**: Client-side validation
- **Success Callback**: Refresh list após save

#### 2. **ProductList Component**
- **Search**: Busca por nome/descrição
- **Filter**: Por categoria
- **Product Cards**: Grid responsivo
  - Image thumbnail
  - Name, price, category
  - Description preview
  - Edit/Delete buttons
- **Infinite Scroll**: Load more on demand
- **Empty State**: Mensagem quando sem produtos

#### 3. **State Management**
- `editingProduct`: Produto sendo editado
- `refreshTrigger`: Força refresh da lista
- Comunicação via callbacks entre Form ↔ List

### UX
✅ **CRUD tradicional**
✅ **Fácil de entender**
✅ **Formulário completo**
✅ **Search & filter**
⚠️ **Sem drag & drop para images**
⚠️ **JSON manual** (não tem UI helper)

### Diferenças vs Images/Videos
- **Não tem IA** - Gerenciamento manual puro
- **Formulário extenso** vs wizard/steps
- **List view** vs grid/gallery
- **Database-driven** (Neon PostgreSQL)

---

## 5. UGC Page (`/ugc`)

### Propósito
Geração rápida de vídeos UGC (User-Generated Content) para produtos via webhook assíncrono.

### Layout (Card-based)
```
┌─────────────────────────────────────┐
│         Navigation Bar              │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Product Selection Card       │  │
│  │                               │  │
│  │  Select Product: [Dropdown]   │  │
│  │                               │  │
│  │  Selected Product Info:       │  │
│  │  • Image                      │  │
│  │  • Name                       │  │
│  │  • Description                │  │
│  │  • Target Audience            │  │
│  │                               │  │
│  │  [Generate Video]             │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  UGCGenerationHistory         │  │
│  │                               │  │
│  │  Tabs: All | Pending |        │  │
│  │        Completed | Failed     │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Video Card (Pending)    │  │  │
│  │  │ • Spinner               │  │  │
│  │  │ • Product info          │  │  │
│  │  └─────────────────────────┘  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Video Card (Complete)   │  │  │
│  │  │ • Thumbnail             │  │  │
│  │  │ • Play button           │  │  │
│  │  │ • Download              │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Características

#### 1. **Product Selection**
- **Dropdown**: Lista todos produtos do catálogo
- **Product Preview**: Mostra info do produto selecionado
- **Quick Generate**: Um clique para gerar

#### 2. **GenerateVideoDialog**
- **Modal dialog** quando clica Generate
- **Visual Setting Selection**: Kitchen, Living Room, etc.
- **AI Scene Description**: Auto-gera descrição da cena
- **Dispatch**: Fire-and-forget para webhook n8n

#### 3. **Real-Time History (SSE)**
- **Server-Sent Events**: Updates em tempo real
- **Connection Status**: Connected/Disconnected indicator
- **Auto-Reconnect**: Exponential backoff (max 5 tentativas)
- **Heartbeat**: Mantém conexão viva (30s)

#### 4. **Video Cards**
Estados diferentes:
- **Pending**: Spinner, "Generating..."
- **Completed**: Thumbnail, Play button, Download
- **Failed**: Error message, Retry button

#### 5. **Tabs Filter**
- **All**: Todos os vídeos
- **Pending**: Em processamento
- **Completed**: Prontos
- **Failed**: Com erro

### UX
✅ **Muito simples** - 2 cliques para gerar
✅ **Real-time updates** via SSE
✅ **Fire-and-forget** - não espera na página
✅ **Status visual claro**
✅ **Background processing**
⚠️ **Depende de n8n** (infraestrutura externa)
⚠️ **Sem preview antes de gerar**

### Diferenças vs Videos Page
| Feature | Videos | UGC |
|---------|--------|-----|
| **Workflow** | Síncrono (espera na página) | Assíncrono (webhook) |
| **Input** | Prompt manual + uploads | Produto pré-cadastrado |
| **Customização** | Alta (4 modos, settings) | Baixa (apenas visual setting) |
| **Feedback** | Progress bar | Real-time status via SSE |
| **Histórico** | Nenhum | Tabbed gallery com filter |
| **Provider** | Google Veo/KIE.AI direto | n8n workflow |
| **Tempo** | Espera 2-10min | Dispara e esquece |

---

## Resumo Comparativo Geral

### Complexidade de UI

```
Simples ──────────────────────────────── Complexo
  │          │          │          │          │
Home       UGC     Products    Videos    Images
```

### Interatividade

```
Estática ──────────────────────────────── Dinâmica
  │          │          │          │          │
Home    Products     UGC       Videos    Images
```

### Features Únicas por Página

| Página | Features Únicas |
|--------|----------------|
| **Home** | • Hero section<br>• Feature cards<br>• Gradient background |
| **Images** | • Resizable split view<br>• Global drag & drop<br>• Dithering shader<br>• Keyboard shortcuts<br>• Fullscreen viewer<br>• Persistent history (IndexedDB + DB)<br>• HEIC conversion<br>• Multiple images per generation<br>• Prompt enhancement with image analysis |
| **Videos** | • Multiple generation modes<br>• State machine (IDLE/LOADING/SUCCESS/ERROR)<br>• Long-running operations (2-10min)<br>• Progress simulation<br>• Prompt enhancement dialog<br>• Fallback providers (Google/KIE.AI) |
| **Products** | • CRUD tradicional<br>• Search & filter<br>• JSON editors<br>• Infinite scroll<br>• Edit/Create dual mode |
| **UGC** | • SSE real-time updates<br>• Fire-and-forget workflow<br>• Webhook integration (n8n)<br>• Tabbed history filter<br>• Auto-reconnection<br>• Product-driven generation |

### Padrões de Design Compartilhados

✅ **Todas as páginas:**
- Background preto/dark theme
- shadcn/ui components
- Lucide icons
- Toast notifications (sonner)
- Responsiveness

✅ **3 páginas usam Cards:**
- Home (feature cards)
- Products (product cards)
- UGC (video cards)

✅ **2 páginas têm prompt enhancement:**
- Images
- Videos

✅ **2 páginas persistem dados:**
- Images (IndexedDB + Neon)
- Products (Neon)
- UGC (Neon via webhook)

### Navegação Entre Páginas

```
       Home (/)
         │
    ┌────┼────┬────┐
    │    │    │    │
 Images Videos Products UGC
    │
  (pode ir para qualquer uma via menu)
```

**Navigation Bar** está presente em todas as páginas com links para todas as seções.

---

## Recomendações de Melhoria

### Para /images
1. **Simplificar UI inicial**: Esconder features avançadas em accordion/tabs
2. **Onboarding**: Tutorial de primeira visita
3. **Mobile**: Adaptar split view para stack vertical em mobile

### Para /videos
1. **Adicionar histórico persistente**: Igual ao /images
2. **Preview antes de gerar**: Mostrar estimativa de custo/tempo
3. **Queue system**: Permitir múltiplas gerações em paralelo

### Para /products
1. **Upload de imagens**: Drag & drop em vez de URL manual
2. **Rich text editor**: Para description/ingredients
3. **Bulk operations**: Editar múltiplos produtos de uma vez

### Para /ugc
1. **Preview de cena**: Mostrar como será o vídeo antes de gerar
2. **Customização**: Mais opções de visual settings
3. **Batch generation**: Gerar vídeos para múltiplos produtos de uma vez

### Geral
1. **Design System unificado**: Criar component library consistente
2. **Loading states**: Skeletons em vez de spinners
3. **Error boundaries**: Melhor handling de erros
4. **Analytics**: Tracking de uso de cada feature
5. **Accessibility**: Melhorar suporte para screen readers

---

## Conclusão

Cada página tem uma **UX única** otimizada para seu propósito:

- **Home**: Marketing/Navegação
- **Images**: Professional creative tool
- **Videos**: Wizard-based generation
- **Products**: Database management
- **UGC**: Automated content factory

A **inconsistência de UX** entre páginas é **intencional** - cada uma serve um workflow diferente. Porém, há oportunidade de **unificar padrões visuais** mantendo workflows distintos.
