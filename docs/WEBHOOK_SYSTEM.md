# Sistema de Webhooks UGC

Este documento descreve como funciona o sistema assíncrono de processamento de vídeos UGC com n8n.

## Arquitetura

```
Frontend → Dispatcher API → n8n (processamento) → Webhook Receiver → Database
                    ↓                                      ↑
                Database                                   |
                (pending)                            (completed/failed)
```

## Fluxo de Trabalho

### 1. Dispatcher (POST /api/dispatch-ugc)

**Responsabilidades:**
- Recebe solicitação do frontend com `productId`, `model`, `videoSetting`
- Busca dados do produto no banco
- Gera `batch_id` único (UUID v4)
- Cria registro com status `pending` no banco
- Envia payload para n8n (fire-and-forget)
- Retorna sucesso imediato ao frontend

**Payload enviado ao n8n:**
```json
{
  "batchId": "uuid-gerado",
  "Product": "Nome do Produto",
  "ICP": "Público-alvo",
  "Product Features": "Descrição...",
  "Product Photo": "https://...",
  "Video Setting": "Cenário do vídeo",
  "Model": "Nano + Veo 3.1"
}
```

**Resposta ao Frontend:**
```json
{
  "success": true,
  "message": "Processing started",
  "data": {
    "id": 123,
    "batch_id": "uuid-gerado",
    "status": "pending",
    ...
  }
}
```

### 2. Processamento n8n

O n8n recebe o payload, processa o vídeo usando IA e, quando completo:
- Faz POST para `/api/webhooks/ugc-completed`
- Inclui o mesmo `batch_id` recebido
- Envia URLs do vídeo e thumbnail gerados

### 3. Webhook Receiver (POST /api/webhooks/ugc-completed)

**Responsabilidades:**
- Valida autenticação via header `x-secret-key`
- Recebe resultado do n8n
- Atualiza registro no banco baseado no `batch_id`
- Marca como `completed` ou `failed`

**Payload recebido do n8n:**
```json
{
  "batch_id": "uuid-gerado",
  "video_url": "https://...",
  "thumbnail_url": "https://...",
  "final_prompt": "Prompt usado",
  "status": "success" // ou "error"
}
```

## Variáveis de Ambiente

Configure no `.env.local`:

```bash
# N8N Webhook
N8N_WEBHOOK_URL=https://n8n.blackboxinovacao.com.br/webhook-test/generate-ugc
N8N_AUTH_TOKEN=seu-token-aqui (opcional)

# Segurança do Webhook Receiver
CRON_SECRET=sua-senha-secreta-aqui

# Database
DATABASE_URL=postgresql://...
```

## Segurança

### Dispatcher → n8n
- Opcional: Header `x-api-key` com `N8N_AUTH_TOKEN`

### n8n → Receiver
- **Obrigatório**: Header `x-secret-key` com valor de `CRON_SECRET`
- Se não coincidir, retorna 401 Unauthorized

## Configuração do n8n

No seu workflow n8n, configure:

1. **Webhook Node (Trigger)**
   - URL Path: `/webhook-test/generate-ugc`
   - Método: POST
   - Recebe payload do Dispatcher

2. **HTTP Request Node (Final)**
   - URL: `https://seu-dominio.com/api/webhooks/ugc-completed`
   - Método: POST
   - Headers:
     ```
     x-secret-key: {{ $env.CRON_SECRET }}
     Content-Type: application/json
     ```
   - Body:
     ```json
     {
       "batch_id": "{{ $json.batchId }}",
       "video_url": "{{ $json.video_url }}",
       "thumbnail_url": "{{ $json.thumbnail_url }}",
       "final_prompt": "{{ $json.final_prompt }}",
       "status": "success"
     }
     ```

## Tratamento de Erros

### No Dispatcher
- Se produto não existe: 404
- Se falha na criação do registro: 500
- Erro no n8n é logado mas não bloqueia (fire-and-forget)

### No Receiver
- Se `batch_id` ausente: 400
- Se autenticação falha: 401
- Se status é 'error' ou `video_url` ausente: marca como 'failed'

## Testando

### 1. Testar Dispatcher
```bash
curl -X POST http://localhost:3000/api/dispatch-ugc \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "model": "Nano + Veo 3.1",
    "videoSetting": "A casual home environment"
  }'
```

### 2. Testar Receiver (Simular n8n)
```bash
curl -X POST http://localhost:3000/api/webhooks/ugc-completed \
  -H "Content-Type: application/json" \
  -H "x-secret-key: minha-senha-secreta" \
  -d '{
    "batch_id": "uuid-do-teste",
    "video_url": "https://example.com/video.mp4",
    "thumbnail_url": "https://example.com/thumb.jpg",
    "final_prompt": "Teste",
    "status": "success"
  }'
```

## Monitoramento

Para monitorar o status das gerações:

```sql
SELECT
  id,
  batch_id,
  product_name,
  status,
  created_at,
  updated_at
FROM ugc_generations
WHERE status = 'pending'
ORDER BY created_at DESC;
```

## FAQ

**Q: O que acontece se o n8n nunca chamar o webhook?**
A: O registro ficará como `pending` indefinidamente. Recomenda-se implementar um cron job para marcar como `failed` após timeout (ex: 1 hora).

**Q: Posso chamar o dispatcher várias vezes para o mesmo produto?**
A: Sim! Cada chamada gera um `batch_id` único e cria um novo registro.

**Q: Como o frontend sabe quando o vídeo ficou pronto?**
A: Implemente polling ou WebSockets para verificar o status periodicamente consultando a API GET `/api/ugc-generations/{id}`.
