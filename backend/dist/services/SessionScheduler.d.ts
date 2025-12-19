import { WebSocketServer } from './WebSocketServer.js';
export declare class SessionScheduler {
    private currentSessionId;
    private roundOrchestrator;
    private tradingService;
    private wsServer;
    private countdownInterval;
    private currentSessionEndTime;
    private isPaused;
    private sessionEndTimeout;
    private pausedTimeRemaining;
    constructor(wsServer: WebSocketServer);
    start(): void;
    private checkActiveSession;
    startSession(): Promise<string>;
    endSession(sessionId: string): Promise<void>;
    private calculateLeaderboard;
    getCurrentSessionId(): string | null;
    getNextSessionTime(): Promise<Date>;
    getCurrentCountdown(): number | null;
    pauseSession(): void;
    resumeSession(): Promise<void>;
    getIsPaused(): boolean;
}
//# sourceMappingURL=SessionScheduler.d.ts.map