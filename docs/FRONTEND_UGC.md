# Frontend UGC - Documentação

Interface completa para geração e gerenciamento de vídeos UGC usando IA.

## 📁 Estrutura de Arquivos

```
app/
  └── ugc/
      └── page.tsx                 # Página principal

components/
  └── ugc/
      ├── generation-history.tsx   # Histórico com polling
      ├── generate-video-dialog.tsx # Diálogo de configuração
      └── video-player-dialog.tsx   # Player de vídeo

api/
  └── ugc-generations/
      └── route.ts                 # API GET para listar gerações
```

## 🎯 Funcionalidades

### 1. Página Principal (`/ugc`)
- **Lista de Produtos**: Cards clicáveis com imagem, nome e target audience
- **Botão "Generate Video"**: Abre diálogo de configuração
- **Histórico de Gerações**: Painel lateral com status em tempo real

### 2. Geração de Vídeo
**Dialog de Configuração:**
- Preview do produto selecionado
- Seleção de modelo IA:
  - Nano + Veo 3.1 (Recomendado)
  - Nano + Veo 3.0
  - Standard
- Campo de texto para descrever cenário/setting
- Botão "Generate Video" que dispara a API

**Fluxo:**
```typescript
// 1. Usuário clica em "Generate Video"
// 2. Dialog abre com configurações
// 3. POST /api/dispatch-ugc
// 4. Backend cria registro 'pending'
// 5. n8n processa em background
// 6. Webhook atualiza para 'completed'
// 7. Polling detecta mudança e atualiza UI
```

### 3. Histórico com Polling

**Componente: `generation-history.tsx`**

Características:
- ✅ Auto-refresh a cada 5 segundos
- ✅ Tabs filtráveis: All, Pending, Completed, Failed
- ✅ Status visual com ícones animados
- ✅ Thumbnails dos vídeos
- ✅ Botões de ação (Play, Download)

**Código de Polling:**
```typescript
useEffect(() => {
  fetchGenerations();

  const interval = setInterval(() => {
    fetchGenerations(true); // Silent refresh
  }, 5000);

  return () => clearInterval(interval);
}, [activeTab]);
```

### 4. Video Player

**Componente: `video-player-dialog.tsx`**

Funcionalidades:
- Player HTML5 nativo com controles
- Exibição de metadados:
  - Scene description
  - Final prompt usado
  - AI model
  - Batch ID
- Ações:
  - Copy URL
  - Download
  - Open in New Tab

## 🎨 UI/UX

### Status Badges

```typescript
// Pending - Badge secundário, ícone pulsante
<Badge variant="secondary">
  <Clock className="animate-pulse" />
  pending
</Badge>

// Completed - Badge padrão, checkmark
<Badge variant="default">
  <CheckCircle2 />
  completed
</Badge>

// Failed - Badge destrutivo, X
<Badge variant="destructive">
  <XCircle />
  failed
</Badge>
```

### Cards de Produto
- Hover effect com border-primary
- Imagem 64x64px
- Truncate em 2 linhas para descrição
- Badge com target_audience

### Cards de Geração
- Thumbnail 128x80px
- Skeleton loader durante pending
- Informações: data criação/atualização
- Ações condicionais baseadas em status

## 🔌 API Endpoints Usados

### GET /api/products
Retorna lista de produtos disponíveis
```typescript
Response: {
  products: Product[]
}
```

### GET /api/ugc-generations
Lista gerações com filtros opcionais
```typescript
Query Params:
  - status?: "pending" | "completed" | "failed"
  - productId?: number
  - limit?: number (default: 50)

Response: {
  success: true,
  data: Generation[],
  count: number
}
```

### POST /api/dispatch-ugc
Dispara geração de vídeo
```typescript
Request Body: {
  productId: number,
  model: string,
  videoSetting: string
}

Response: {
  success: true,
  message: "Processing started",
  data: Generation
}
```

## 🔄 Ciclo de Vida Completo

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário seleciona produto                            │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│ 2. Configura modelo e cenário                           │
│    - Model: "Nano + Veo 3.1"                            │
│    - Setting: "Casual home environment..."              │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│ 3. POST /api/dispatch-ugc                               │
│    - Gera batch_id (UUID)                               │
│    - Cria registro 'pending'                            │
│    - Envia para n8n (fire-and-forget)                   │
│    - Retorna sucesso imediato                           │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│ 4. Frontend exibe card 'pending'                        │
│    - Ícone de relógio pulsante                          │
│    - Skeleton loader no thumbnail                       │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│ 5. Polling a cada 5s                                    │
│    - GET /api/ugc-generations?status=pending            │
│    - Detecta mudanças no backend                        │
└─────────────┬───────────────────────────────────────────┘
              │
              │ [Background: n8n processa vídeo]
              │ [Background: Webhook atualiza DB]
              │
┌─────────────▼───────────────────────────────────────────┐
│ 6. Polling detecta status = 'completed'                 │
│    - Atualiza UI automaticamente                        │
│    - Mostra thumbnail                                   │
│    - Ativa botões Play/Download                         │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│ 7. Usuário clica "Play"                                 │
│    - Abre VideoPlayerDialog                             │
│    - Player HTML5 com video_url                         │
└─────────────────────────────────────────────────────────┘
```

## 🎬 Exemplo de Uso

### 1. Acessar Página
```
http://localhost:3000/ugc
```

### 2. Selecionar Produto
- Clique em qualquer card de produto
- Ou clique no botão "Generate Video"

### 3. Configurar Geração
```
Model: Nano + Veo 3.1
Setting: "A young woman in her 20s reviewing the product
          in a bright, modern kitchen with natural lighting.
          She's smiling and pointing at the product features."
```

### 4. Aguardar Processamento
- Status muda automaticamente
- Nenhuma ação necessária
- Polling atualiza a cada 5s

### 5. Assistir Vídeo
- Clique em "Play" quando status = completed
- Use controles do player
- Copie URL ou faça download

## ⚙️ Configurações

### Intervalo de Polling
```typescript
// generation-history.tsx
const POLLING_INTERVAL = 5000; // 5 segundos
```

Para alterar:
```typescript
const POLLING_INTERVAL = 10000; // 10 segundos
```

### Limite de Gerações Exibidas
```typescript
// Default: 50
const limit = parseInt(searchParams.get("limit") || "50");
```

## 🐛 Debugging

### Ver Network Requests
1. Abra DevTools → Network
2. Filtre por "ugc"
3. Veja polling requests a cada 5s

### Ver Console Logs
```typescript
console.log("Fetching generations...");
console.log("Generations updated:", data);
```

### Testar Estados

**Simular Pending:**
- Gere um vídeo
- Status fica 'pending' até n8n completar

**Simular Completed:**
- Use webhook manual para atualizar
- Ou aguarde n8n processar

**Simular Failed:**
```bash
curl -X POST http://localhost:3000/api/webhooks/ugc-completed \
  -H "x-secret-key: sua-senha" \
  -H "Content-Type: application/json" \
  -d '{"batch_id": "xxx", "status": "error"}'
```

## 📱 Responsividade

- Desktop: Grid 3 colunas (1 produto + 2 histórico)
- Tablet: Grid 1 coluna
- Mobile: Cards empilhados verticalmente

## 🚀 Performance

### Otimizações Implementadas
- ✅ Polling silencioso (não mostra loader)
- ✅ Cleanup de intervalos no unmount
- ✅ Filtros client-side nas tabs
- ✅ Lazy loading de vídeos (poster + controls)

### Recomendações Futuras
- [ ] Implementar WebSockets para push real-time
- [ ] Adicionar virtual scrolling para +100 items
- [ ] Cache de thumbnails com Service Worker
- [ ] Optimistic UI updates

## 🔐 Segurança

- Webhooks protegidos por `CRON_SECRET`
- URLs de vídeo podem ser públicas (considere signed URLs)
- API não valida permissões (adicionar auth se necessário)

## 📊 Métricas

Para trackear:
- Taxa de conversão: Produtos → Gerações
- Taxa de sucesso: Completed / Total
- Tempo médio de processamento
- Vídeos mais baixados/assistidos
