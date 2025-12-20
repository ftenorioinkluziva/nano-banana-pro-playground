# Guia de Implementação: Creato AI Factory (Módulo UGC)

**Projeto:** Creato AI Factory (Evolução do MVP)
**Versão:** 1.0
**Objetivo:** Implementar um sistema de Agentes de IA guiados por base de dados para a criação de vídeos UGC (User Generated Content) na rota `/ugc`.

---

## 1. Visão Geral da Arquitetura

O sistema deixará de usar prompts *hardcoded* no código. A nova arquitetura utiliza a Base de Dados para armazenar "Capabilities" (Estilos/Templates).

**O Fluxo de Dados:**
1.  **Frontend (`/ugc`):** O utilizador seleciona um Produto + uma Capability (ex: "Selfie Influencer") + Intenção (ex: "falar sobre o sabor").
2.  **API (`/api/generate-ugc`):** O backend recebe o pedido e procura a "alma" da Capability na base de dados.
3.  **Agente Diretor (LLM):** Um script utiliza a Gemini LLM para fundir o pedido do utilizador com o *System Prompt* da Capability.
4.  **Execução (Kie.ai):** O prompt técnico gerado pelo Diretor é enviado para a Kie.ai com as configurações técnicas (aspect ratio, negative prompt) definidas na Capability.

---

## 2. Base de Dados (Schema Update)

Precisamos de criar tabelas para armazenar as Marcas e as Capabilities dinâmicas.

**Ficheiro:** `db/schema.sql`

Adicionar o seguinte SQL:

```sql
-- 1. Tabela de Marcas (Contexto do Cliente)
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY, -- UUID
  name TEXT NOT NULL,
  industry TEXT, -- ex: "Suplementos", "Moda", "Tech"
  tone_of_voice TEXT, -- ex: "Jovem e Gírias", "Médico e Sério"
  target_audience TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Capabilities (Os Templates de Vídeo)
-- Esta tabela permite criar novos estilos sem mexer no código
CREATE TABLE IF NOT EXISTS capabilities (
  id TEXT PRIMARY KEY, 
  label TEXT NOT NULL, -- Nome no botão (ex: "Selfie Influencer")
  description TEXT NOT NULL, -- Tooltip
  icon_name TEXT NOT NULL, -- ex: "smartphone", "camera", "zap" (mapeado no frontend)
  
  -- A "Inteligência" (System Prompt do Agente)
  base_prompt_template TEXT NOT NULL,
  
  -- As "Regras Técnicas" (Configurações da API de Vídeo)
  recommended_aspect_ratio TEXT DEFAULT '9:16',
  default_negative_prompt TEXT,
  model_mode TEXT DEFAULT 'text_to_video', -- ou 'image_to_video'
  
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Atualizar tabelas existentes
ALTER TABLE generated_videos ADD COLUMN capability_id TEXT REFERENCES capabilities(id);
ALTER TABLE products ADD COLUMN brand_id TEXT REFERENCES brands(id);

```

###2.1 Seed Data (Dados Iniciais)Executar este insert para popular o sistema com os primeiros agentes:

```sql
INSERT INTO capabilities (id, label, description, icon_name, recommended_aspect_ratio, default_negative_prompt, base_prompt_template) VALUES 
(
  'ugc-selfie-v1', 
  'Depoimento Selfie', 
  'Vídeo estilo TikTok com influenciador a falar para a câmara.', 
  'smartphone', 
  '9:16', 
  'cartoon, illustration, 3d render, tripod, professional studio lighting, ugly, deformed',
  'TYPE: Authentic UGC Testimonial.\nCAMERA: Handheld selfie angle, smartphone quality.\nSUBJECT: A realistic person (match target audience) holding the {ProductName}.\nACTION: Speaking directly to camera, enthusiastic facial expressions based on intent: "{UserIntent}".\nLIGHTING: Ring light reflection in eyes, soft indoor bedroom background.\nSTYLE: Raw, unpolished, viral social media aesthetic, 4k.'
),
(
  'cinematic-reveal-v1', 
  'Reveal de Produto', 
  'Foco total no produto com luz dramática e câmara lenta.', 
  'camera', 
  '16:9',
  'hands, face, people, text, overlay, low quality, blurry',
  'TYPE: High-end Commercial Product B-Roll.\nSUBJECT: The {ProductName} centered on a generic surface.\nACTION: Slow motion orbital camera movement around the product. Context: {UserIntent}.\nLIGHTING: Dramatic rim lighting, dark moody background, professional studio setup.\nSTYLE: 8k, sharp focus, macro lens details, luxury aesthetic.'
);

```

---

##3. Backend: Agentes e Lógica###3.1 Tipagem**Ficheiro:** `types/ugc.ts` (Novo)

```typescript
export interface Capability {
  id: string;
  label: string;
  description: string;
  icon_name: string;
  base_prompt_template: string;
  recommended_aspect_ratio: string;
  default_negative_prompt: string;
  model_mode: 'text_to_video' | 'image_to_video';
}

```

###3.2 O Agente Diretor**Ficheiro:** `lib/agents/director.ts` (Novo)

Responsável por montar o prompt final.

```typescript
import OpenAI from 'openai';
import { Capability } from '@/types/ugc';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DirectorInput {
  userIntent: string;
  productName: string;
  capability: Capability;
}

export async function directVideoProduction(input: DirectorInput): Promise<string> {
  const { capability, productName, userIntent } = input;

  const systemMessage = `
    ATUE COMO: Um Especialista em Engenharia de Prompt para IA de Vídeo (Kling/Sora).
    OBJETIVO: Converter o pedido do utilizador num prompt visual técnico em INGLÊS.
    
    TEMPLATE DO ESTILO SELECIONADO:
    """
    ${capability.base_prompt_template}
    """
    
    INSTRUÇÕES:
    1. Substitua {ProductName} por "${productName}".
    2. Integre a intenção do utilizador ("${userIntent}") na descrição da ação.
    3. Mantenha as definições de CÂMARA e ILUMINAÇÃO do template.
    4. O output final deve ser APENAS o texto do prompt em Inglês, sem aspas.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: systemMessage }],
    temperature: 0.7,
  });

  return response.choices[0].message.content || "";
}

```

###3.3 API Route: Listar Capabilities**Ficheiro:** `app/api/capabilities/route.ts` (Novo)

```typescript
import { NextResponse } from 'next/server';
// Adaptar para a sua lib de DB atual
const db = require('better-sqlite3')('generate.db'); 

export async function GET() {
  try {
    const capabilities = db.prepare('SELECT * FROM capabilities WHERE is_active = 1').all();
    return NextResponse.json(capabilities);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar capabilities" }, { status: 500 });
  }
}

```

###3.4 API Route: Gerar Vídeo UGC**Ficheiro:** `app/api/generate-ugc/route.ts` (Novo)

```typescript
import { NextResponse } from 'next/server';
import { directVideoProduction } from '@/lib/agents/director';
import { createVideo } from '@/lib/kieai-service';
const db = require('better-sqlite3')('generate.db');

export async function POST(req: Request) {
  try {
    const { prompt, capabilityId, productName } = await req.json();

    // 1. Buscar Capability na DB
    const capability = db.prepare('SELECT * FROM capabilities WHERE id = ?').get(capabilityId);
    if (!capability) return NextResponse.json({ error: "Estilo não encontrado" }, { status: 400 });

    // 2. O Agente cria o Roteiro Visual
    const technicalPrompt = await directVideoProduction({
      userIntent: prompt,
      productName: productName,
      capability: capability
    });

    console.log("Prompt Otimizado:", technicalPrompt);

    // 3. Enviar para a Kie.ai com parâmetros da DB
    const videoData = await createVideo({
      prompt: technicalPrompt,
      aspect_ratio: capability.recommended_aspect_ratio,
      negative_prompt: capability.default_negative_prompt,
      model: '' // Padrão do sistema atual
    });

    // 4. Salvar na tabela generated_videos (Adaptar campos conforme schema existente)
    // ...

    return NextResponse.json({ success: true, data: videoData });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha na geração" }, { status: 500 });
  }
}

```

---

##4. Frontend (A Interface)**Ficheiro:** `app/ugc/page.tsx`

Criar uma interface focada em "Seleção de Estilo" e não em engenharia técnica.

```tsx
'use client'
import { useState, useEffect } from 'react';
import { Smartphone, Camera, Zap, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Mapeamento de Ícones
const iconMap: any = { smartphone: Smartphone, camera: Camera, zap: Zap, user: User };

export default function UGCPage() {
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [selectedCap, setSelectedCap] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/capabilities').then(r => r.json()).then(setCapabilities);
  }, []);

  const handleGenerate = async () => {
    if (!selectedCap || !prompt) return toast.error("Preencha todos os campos");
    
    setLoading(true);
    try {
      const res = await fetch('/api/generate-ugc', {
        method: 'POST',
        body: JSON.stringify({ prompt, capabilityId: selectedCap, productName })
      });
      const data = await res.json();
      if (data.success) toast.success("Criação iniciada!");
    } catch (e) {
      toast.error("Erro na criação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Creato AI Factory</h1>
        <p className="text-gray-500">Selecione um estilo e descreva o vídeo.</p>
      </div>

      {/* 1. Produto (Simplificado para o exemplo) */}
      <div className="space-y-2">
        <label className="font-medium">Nome do Produto</label>
        <input 
          className="w-full p-2 border rounded-md" 
          value={productName}
          onChange={e => setProductName(e.target.value)}
          placeholder="Ex: Creatina Turbo..."
        />
      </div>

      {/* 2. Grid de Capabilities (Vindo da DB) */}
      <div className="space-y-2">
        <label className="font-medium">Estilo do Vídeo (Capability)</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {capabilities.map((cap) => {
            const Icon = iconMap[cap.icon_name] || iconMap.zap;
            return (
              <div 
                key={cap.id}
                onClick={() => setSelectedCap(cap.id)}
                className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md
                  ${selectedCap === cap.id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200'}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-white rounded-lg border">
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <span className="font-semibold text-sm">{cap.label}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{cap.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Intenção do Utilizador */}
      <div className="space-y-2">
        <label className="font-medium">O que acontece no vídeo?</label>
        <Textarea 
          placeholder="Ex: Ele segura o pote e diz que é a melhor creatina que já tomou."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={4}
        />
      </div>

      <Button onClick={handleGenerate} disabled={loading} className="w-full h-12 text-lg">
        {loading ? "Agente Criando Roteiro..." : "Gerar Criativo"}
      </Button>
    </div>
  );
}

```

---

##5. Checklist de VerificaçãoPara considerar a tarefa concluída:

* [ ] A tabela `capabilities` existe na DB e tem pelo menos 2 registos.
* [ ] A página `/ugc` carrega os estilos dinamicamente da API.
* [ ] Ao clicar em "Gerar", o log do servidor mostra o "Prompt Otimizado" em inglês (gerado pelo Agente), diferente do input simples do utilizador.
* [ ] O vídeo é despachado para o Kie.ai com o `aspect_ratio` correto vindo da DB (ex: 9:16 para selfie).

```

```