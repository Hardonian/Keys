import { WebSocketServer as WSWebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger';

interface WebSocketClient extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class WebSocketServer {
  private wss: WSWebSocketServer | null = null;
  private clients: Map<string, Set<WebSocketClient>> = new Map();

  initialize(server: Server): void {
    this.wss = new WSWebSocketServer({
      server,
      path: '/ws',
    });

    this.wss.on('connection', (ws: WebSocketClient, req) => {
      // Extract user ID from query params or headers
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId') || undefined;

      if (userId) {
        ws.userId = userId;
        if (!this.clients.has(userId)) {
          this.clients.set(userId, new Set());
        }
        this.clients.get(userId)!.add(ws);
      }

      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error('WebSocket message parse error', error as Error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          const userClients = this.clients.get(ws.userId);
          if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
              this.clients.delete(ws.userId);
            }
          }
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error', error);
      });

      logger.info('WebSocket client connected', { userId });
    });

    // Ping/pong to keep connections alive
    const interval = setInterval(() => {
      this.wss?.clients.forEach((ws: WebSocketClient) => {
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });

    logger.info('WebSocket server initialized');
  }

  private handleMessage(ws: WebSocketClient, message: any): void {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      case 'subscribe':
        // Handle subscription to events
        ws.send(JSON.stringify({ type: 'subscribed', channel: message.channel }));
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  /**
   * Broadcast message to all clients for a specific user
   */
  broadcastToUser(userId: string, message: any): void {
    const userClients = this.clients.get(userId);
    if (!userClients) {
      return;
    }

    const data = JSON.stringify(message);
    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.wss?.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  /**
   * Get number of connected clients for a user
   */
  getUserClientCount(userId: string): number {
    return this.clients.get(userId)?.size || 0;
  }

  /**
   * Get total number of connected clients
   */
  getTotalClientCount(): number {
    return this.wss?.clients.size || 0;
  }
}
