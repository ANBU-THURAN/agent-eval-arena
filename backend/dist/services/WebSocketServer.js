import { WebSocketServer as WSServer, WebSocket } from 'ws';
export var WSEventType;
(function (WSEventType) {
    WSEventType["COUNTDOWN_TICK"] = "countdown_tick";
    WSEventType["SESSION_STATUS"] = "session_status";
    WSEventType["SESSION_PAUSED"] = "session_paused";
    WSEventType["SESSION_RESUMED"] = "session_resumed";
    WSEventType["ROUND_START"] = "round_start";
    WSEventType["PROPOSAL_CREATED"] = "proposal_created";
    WSEventType["TRADE_EXECUTED"] = "trade_executed";
    WSEventType["AGENT_STATE_UPDATE"] = "agent_state_update";
})(WSEventType || (WSEventType = {}));
export class WebSocketServer {
    wss;
    clients = new Set();
    sessionScheduler = null;
    constructor(server) {
        this.wss = new WSServer({ server, path: '/ws' });
        this.wss.on('connection', (ws) => {
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
    setSessionScheduler(scheduler) {
        this.sessionScheduler = scheduler;
    }
    sendToClient(ws, event) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(event));
        }
    }
    broadcast(event) {
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
    broadcastCountdownTick(secondsRemaining) {
        this.broadcast({
            type: WSEventType.COUNTDOWN_TICK,
            payload: { secondsRemaining },
        });
    }
    broadcastSessionStatus(status, sessionId) {
        this.broadcast({
            type: WSEventType.SESSION_STATUS,
            payload: { status, sessionId },
        });
    }
    broadcastRoundStart(roundNumber, sessionId) {
        this.broadcast({
            type: WSEventType.ROUND_START,
            payload: { roundNumber, sessionId },
        });
    }
    broadcastProposalCreated(proposal) {
        this.broadcast({
            type: WSEventType.PROPOSAL_CREATED,
            payload: proposal,
        });
    }
    broadcastTradeExecuted(trade) {
        this.broadcast({
            type: WSEventType.TRADE_EXECUTED,
            payload: trade,
        });
    }
    broadcastAgentStateUpdate(agentId, state) {
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
    getClientCount() {
        return this.clients.size;
    }
}
//# sourceMappingURL=WebSocketServer.js.map