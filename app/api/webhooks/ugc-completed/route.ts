import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { sseManager } from "@/lib/sse-manager";

// Simples verificação de segurança (opcional, mas recomendado)
const CRON_SECRET = process.env.CRON_SECRET || "minha-senha-secreta";

export async function POST(request: NextRequest) {
  try {
    // 1. Verificação de Segurança (Header)
    const authHeader = request.headers.get("x-secret-key");
    if (authHeader !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { batch_id, video_url, thumbnail_url, final_prompt, status } = body;

    if (!batch_id) {
      return NextResponse.json({ error: "Missing batch_id" }, { status: 400 });
    }

    // 2. Atualizar o Banco de Dados
    const sql = neon(process.env.DATABASE_URL!);

    // Se o n8n mandou erro, atualizamos como 'failed'
    if (status === 'error' || !video_url) {
        const [updated] = await sql`
            UPDATE ugc_generations
            SET status = 'failed'
            WHERE batch_id = ${batch_id}
            RETURNING *
        `;

        // Notify all connected SSE clients
        if (updated) {
          sseManager.broadcast('generation-failed', {
            id: updated.id,
            batch_id: updated.batch_id,
            product_name: updated.product_name,
            status: 'failed'
          });
        }

        return NextResponse.json({ received: true, status: 'marked_as_failed' });
    }

    // Sucesso: Salva URL e marca como 'completed'
    const [updated] = await sql`
      UPDATE ugc_generations
      SET
        video_url = ${video_url},
        thumbnail_url = ${thumbnail_url || null},
        final_prompt = ${final_prompt || null},
        status = 'completed',
        updated_at = NOW()
      WHERE batch_id = ${batch_id}
      RETURNING *
    `;

    // Notify all connected SSE clients
    if (updated) {
      sseManager.broadcast('generation-completed', {
        id: updated.id,
        batch_id: updated.batch_id,
        product_name: updated.product_name,
        video_url: updated.video_url,
        thumbnail_url: updated.thumbnail_url,
        status: 'completed'
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
