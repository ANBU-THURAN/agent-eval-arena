import { Server as HTTPServer } from 'http';
export declare enum WSEventType {
    COUNTDOWN_TICK = "countdown_tick",
    SESSION_STATUS = "session_status",
    SESSION_PAUSED = "session_paused",
    SESSION_RESUMED = "session_resumed",
    ROUND_START = "round_start",
    PROPOSAL_CREATED = "proposal_created",
    TRADE_EXECUTED = "trade_executed",
    AGENT_STATE_UPDATE = "agent_state_update"
}
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
    roundId: string;
    fromAgentId: string;
    toAgentId: string;
    goodId: string;
    quantity: number;
    price: number;
    explanation: string;
    status: string;
    createdAt: Date;
}
export interface TradePayload {
    id: string;
    proposalId: string;
    sessionId: string;
    fromAgentId: string;
    toAgentId: string;
    goodId: string;
    quantity: number;
    price: number;
    settledAt: Date;
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
export type WSPayload = CountdownTickPayload | SessionStatusPayload | RoundStartPayload | ProposalPayload | TradePayload | AgentStatePayload | Record<string, never>;
export interface WSEvent {
    type: WSEventType;
    payload: WSPayload;
}
interface ISessionScheduler {
    getCurrentCountdown(): number | null;
}
export declare class WebSocketServer {
    private wss;
    private clients;
    private sessionScheduler;
    constructor(server: HTTPServer);
    setSessionScheduler(scheduler: ISessionScheduler): void;
    private sendToClient;
    broadcast(event: WSEvent): void;
    broadcastCountdownTick(secondsRemaining: number): void;
    broadcastSessionStatus(status: 'active' | 'completed', sessionId: string): void;
    broadcastRoundStart(roundNumber: number, sessionId: string): void;
    broadcastProposalCreated(proposal: ProposalPayload): void;
    broadcastTradeExecuted(trade: TradePayload): void;
    broadcastAgentStateUpdate(agentId: string, state: {
        cash: number;
        inventory: Record<string, number>;
        tradesCompleted: number;
        tradesRequired: number;
    }): void;
    broadcastSessionPaused(): void;
    broadcastSessionResumed(): void;
    getClientCount(): number;
}
export {};
//# sourceMappingURL=WebSocketServer.d.ts.map