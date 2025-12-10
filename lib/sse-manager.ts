// SSE Connection Manager
// Manages all active SSE connections for real-time updates

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
  createdAt: Date;
};

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();

  addClient(clientId: string, controller: ReadableStreamDefaultController) {
    this.clients.set(clientId, {
      id: clientId,
      controller,
      createdAt: new Date(),
    });

    console.log(`[SSE] Client connected: ${clientId} (Total: ${this.clients.size})`);
  }

  removeClient(clientId: string) {
    this.clients.delete(clientId);
    console.log(`[SSE] Client disconnected: ${clientId} (Total: ${this.clients.size})`);
  }

  broadcast(event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    let sent = 0;
    let failed = 0;

    this.clients.forEach((client, clientId) => {
      try {
        const encoder = new TextEncoder();
        client.controller.enqueue(encoder.encode(message));
        sent++;
      } catch (error) {
        console.error(`[SSE] Failed to send to ${clientId}:`, error);
        this.removeClient(clientId);
        failed++;
      }
    });

    console.log(`[SSE] Broadcast "${event}" - Sent: ${sent}, Failed: ${failed}`);
  }

  sendToClient(clientId: string, event: string, data: any) {
    const client = this.clients.get(clientId);
    if (!client) {
      console.warn(`[SSE] Client not found: ${clientId}`);
      return false;
    }

    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      const encoder = new TextEncoder();
      client.controller.enqueue(encoder.encode(message));
      return true;
    } catch (error) {
      console.error(`[SSE] Failed to send to ${clientId}:`, error);
      this.removeClient(clientId);
      return false;
    }
  }

  getClientCount() {
    return this.clients.size;
  }

  // Cleanup stale connections (older than 1 hour)
  cleanup() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleaned = 0;

    this.clients.forEach((client, clientId) => {
      if (client.createdAt < oneHourAgo) {
        this.removeClient(clientId);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`[SSE] Cleaned up ${cleaned} stale connections`);
    }
  }
}

// Singleton instance
export const sseManager = new SSEManager();

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    sseManager.cleanup();
  }, 10 * 60 * 1000);
}
