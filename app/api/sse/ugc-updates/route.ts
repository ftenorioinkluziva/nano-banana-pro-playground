import { NextRequest } from "next/server";
import { sseManager } from "@/lib/sse-manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Generate unique client ID
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create a readable stream
  const stream = new ReadableStream({
    start(controller) {
      // Add client to SSE manager
      sseManager.addClient(clientId, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      const message = `event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(message));

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.error(`[SSE] Heartbeat failed for ${clientId}:`, error);
          clearInterval(heartbeatInterval);
          sseManager.removeClient(clientId);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        sseManager.removeClient(clientId);
        try {
          controller.close();
        } catch (error) {
          // Ignore close errors
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in nginx
    },
  });
}
