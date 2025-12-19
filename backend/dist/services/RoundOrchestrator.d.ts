import { WebSocketServer } from './WebSocketServer.js';
export declare class RoundOrchestrator {
    private sessionId;
    private currentRound;
    private intervalId;
    private agentEngine;
    private tradingService;
    private wsServer;
    private isRunning;
    private isPaused;
    constructor(sessionId: string, wsServer: WebSocketServer);
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    private executeRound;
    private executeAgentRound;
    private formatTimeRemaining;
}
//# sourceMappingURL=RoundOrchestrator.d.ts.map