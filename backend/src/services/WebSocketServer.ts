import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { Server as HTTPServer, IncomingMessage } from 'http';

export enum WSEventType {
  COUNTDOWN_TICK = 'countdown_tick',
  SESSION_STATUS = 'session_status',
  SESSION_PAUSED = 'session_paused',
  SESSION_RESUMED = 'session_resumed',
  ROUND_START = 'round_start',
  PROPOSAL_CREATED = 'proposal_created',
  TRADE_EXECUTED = 'trade_executed',
  AGENT_STATE_UPDATE = 'agent_state_update',
}

// Payload type definitions
export interface CountdownTickPayload {
  secondsRemaining: number;
}

export interface SessionStatusPayload {
  status?: 'active' | 'completed';
  sessionId?: string;
  connected?: boolean;
}

export interface RoundStartPayload {
  roundNumber: number;
  sessionId: string;
}

export interface ProposalPayload {
  id: string;
  roundId?: string;
  fromAgentId?: string;
  toAgentId?: string;
  goodId?: string;
  fromAgentName?: string;
  toAgentName?: string;
  goodName?: string;
  quantity: number;
  price: number;
  explanation: string;
  status: string;
  createdAt: Date;
}

export interface TradePayload {
  id: string;
  proposalId?: string;
  sessionId?: string;
  fromAgentId?: string;
  toAgentId?: string;
  goodId?: string;
  fromAgentName?: string;
  toAgentName?: string;
  goodName?: string;
  quantity: number;
  price: number;
  settledAt?: Date;
}

export interface AgentStatePayload {
  agentId: string;
  state: {
    cash: number;
    inventory: Record<string, number>;
    tradesCompleted: number;
    tradesRequired: number;
  };
}

// Union type for all possible payloads
export type WSPayload =
  | CountdownTickPayload
  | SessionStatusPayload
  | RoundStartPayload
  | ProposalPayload
  | TradePayload
  | AgentStatePayload
  | Record<string, never>; // Empty object for events with no payload

export interface WSEvent {
  type: WSEventType;
  payload: WSPayload;
}

// Interface for SessionScheduler to avoid circular dependency
interface ISessionScheduler {
  getCurrentCountdown(): number | null;
}

export class WebSocketServer {
  private wss: WSServer;
  private clients: Set<WebSocket> = new Set();
  private sessionScheduler: ISessionScheduler | null = null;

  // Define allowed origins for WebSocket
  private allowedOrigins = [
    'http://localhost:5173',
    'https://skillful-cat-production.up.railway.app',
    'https://agent-eval-arena-production.up.railway.app',
  ];

  constructor(server: HTTPServer) {
    this.wss = new WSServer({
      server,
      path: '/ws',
      verifyClient: (info) => this.verifyClient(info),
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: WSEventType.SESSION_STATUS,
        payload: { connected: true },
      });

      // Send current countdown if session is active
      if (this.sessionScheduler) {
        const currentCountdown = this.sessionScheduler.getCurrentCountdown();
        if (currentCountdown !== null) {
          this.sendToClient(ws, {
            type: WSEventType.COUNTDOWN_TICK,
            payload: { secondsRemaining: currentCountdown },
          });
        }
      }
    });

    console.log('WebSocket server initialized');
  }

  private verifyClient(info: { origin: string; req: IncomingMessage }): boolean {
    const origin = info.origin || info.req.headers.origin;

    // Allow connections with no origin (for testing)
    if (!origin) return true;

    // Check if origin is in allowed list
    if (this.allowedOrigins.includes(origin)) {
      return true;
    }

    console.warn(`WebSocket connection rejected from origin: ${origin}`);
    return false;
  }

  setSessionScheduler(scheduler: ISessionScheduler) {
    this.sessionScheduler = scheduler;
  }

  private sendToClient(ws: WebSocket, event: WSEvent) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  broadcast(event: WSEvent) {
    const message = JSON.stringify(event);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sentCount++;
      }
    });

    console.log(`Broadcasted ${event.type} to ${sentCount} clients`);
  }

  broadcastCountdownTick(secondsRemaining: number) {
    this.broadcast({
      type: WSEventType.COUNTDOWN_TICK,
      payload: { secondsRemaining },
    });
  }

  broadcastSessionStatus(status: 'active' | 'completed', sessionId: string) {
    this.broadcast({
      type: WSEventType.SESSION_STATUS,
      payload: { status, sessionId },
    });
  }

  broadcastRoundStart(roundNumber: number, sessionId: string) {
    this.broadcast({
      type: WSEventType.ROUND_START,
      payload: { roundNumber, sessionId },
    });
  }

  broadcastProposalCreated(proposal: ProposalPayload) {
    this.broadcast({
      type: WSEventType.PROPOSAL_CREATED,
      payload: proposal,
    });
  }

  broadcastTradeExecuted(trade: TradePayload) {
    this.broadcast({
      type: WSEventType.TRADE_EXECUTED,
      payload: trade,
    });
  }

  broadcastAgentStateUpdate(agentId: string, state: {
    cash: number;
    inventory: Record<string, number>;
    tradesCompleted: number;
    tradesRequired: number;
  }) {
    this.broadcast({
      type: WSEventType.AGENT_STATE_UPDATE,
      payload: { agentId, state },
    });
  }

  broadcastSessionPaused() {
    this.broadcast({
      type: WSEventType.SESSION_PAUSED,
      payload: {},
    });
  }

  broadcastSessionResumed() {
    this.broadcast({
      type: WSEventType.SESSION_RESUMED,
      payload: {},
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
