import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export interface DirectorInput {
  userRequest: string // O que o usuário digitou na caixa de texto
  productName: string
  productDescription: string
  brandTone?: string
  capabilityTemplate: string // Template vindo do banco de dados
  capabilityName: string // Nome da capability para contexto
}

export async function generateDirectorPrompt(input: DirectorInput): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY não configurada")
  }

  const systemMessage = `
ATUE COMO: Um Diretor de Arte Sênior especializado em Vídeos Generativos.

SEU OBJETIVO: Escrever um prompt técnico otimizado para gerar um vídeo AI de alta qualidade.

DADOS DE ENTRADA:
- Produto: ${input.productName} (${input.productDescription})
- Pedido do Usuário: "${input.userRequest}"
- Estilo/Capability: ${input.capabilityName}
- Tom de Voz da Marca: ${input.brandTone || 'Neutro/Padrão'}

ESTRUTURA DO TEMPLATE (USE COMO BASE RÍGIDA):
${input.capabilityTemplate}

REGRAS DE CRIAÇÃO DO PROMPT:
  Sujeito (Subject):
  Seja específico, mas conciso. O Veo 3.1 entende bem descritores de estilo.
  Exemplos: "Latina woman, 20s, curly hair, casual streetwear" ou "Fitness influencer male, 30s, sweating slightly, tank top".

  Produto/Objeto:
  Descreva a física do objeto se necessário.
  Exemplos: "a sweating can of soda", "a matte black skincare bottle", "a fluffy colorful pillow".

  Ação (Action):
  O Veo 3.1 brilha em "micro-expressões". Use verbos que denotem sutileza para evitar o efeito "vale da estranheza".
  Boas palavras-chave: "subtle nod", "adjusting hair", "genuine laughter", "eyebrow raise".

  Iluminação (Context/Lighting):
  Para selfies realistas, a iluminação é crucial.
  Sugestões: "Natural window light" (mais suave), "Harsh sunlight" (mais verão/praia), "Neon signs background" (mais urbano/noite).
  
  Exemplo de Prompt Gerado (Variação Fitness)
  Cinematography: Vertical 9:16 format, handheld selfie camera... Subject: A hyper-realistic fitness coach (male, 30s) holding a phone... holding a protein shaker bottle close to his face... Action: Wiping sweat from forehead, panting slightly with a smile, shaking the bottle... Context: Blurred gym background with equipment... Style: High energy, sweat texture visible, vibrant colors.

  `

  try {
    const model = google("gemini-2.5-flash-lite")

    const result = await generateText({
      model,
      system: systemMessage,
      prompt: "Gere o prompt técnico agora.",
      temperature: 0.7,
    })

    return result.text.trim()
  } catch (error) {
    console.error("Error calling Gemini Director Agent:", error)
    throw new Error(`Failed to generate director prompt: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
