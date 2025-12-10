import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { v4 as uuidv4 } from 'uuid';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.blackboxinovacao.com.br/webhook-test/generate-ugc";
const N8N_AUTH_TOKEN = process.env.N8N_AUTH_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, model, videoSetting } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const [product] = await sql`
      SELECT * FROM products
      WHERE id = ${productId}
    `;

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 1. Gerar um ID único para este Job
    const batchId = uuidv4();

    // 2. Preparar Payload para o n8n (INCLUINDO o batchId)
    const n8nPayload = {
      batchId: batchId, // Importante: Enviamos o ID para o n8n devolvê-lo depois
      Product: product.name,
      ICP: product.target_audience || "General Audience",
      "Product Features": product.description?.slice(0, 500) || "High quality product",
      "Product Photo": product.image_url,
      "Video Setting": videoSetting || `A realistic UGC style video of a person using ${product.name} in a casual home environment.`,
      Model: model || "Nano + Veo 3.1"
    };

    // 3. Criar o registro no banco ANTES de chamar o n8n (Status: pending)
    const [generation] = await sql`
      INSERT INTO ugc_generations (
        product_id,
        product_name,
        status,
        ai_model,
        batch_id,
        visual_setting
      ) VALUES (
        ${product.id},
        ${product.name},
        'pending',
        ${model || "Nano + Veo 3.1"},
        ${batchId},
        ${videoSetting || null}
      )
      RETURNING *
    `;

    // 4. Disparar o n8n (Fire and Forget - ou esperar apenas o 'Processing')
    // Não esperamos o video_url aqui!
    fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(N8N_AUTH_TOKEN && { "x-api-key": N8N_AUTH_TOKEN })
      },
      body: JSON.stringify(n8nPayload)
    }).catch(err => console.error("N8N Trigger Error (Async):", err));

    // 5. Retornar Sucesso Imediato para o Frontend
    return NextResponse.json({
      success: true,
      message: "Processing started",
      data: generation
    });

  } catch (error: any) {
    console.error("Error dispatching to n8n:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate UGC" },
      { status: 500 }
    );
  }
}
