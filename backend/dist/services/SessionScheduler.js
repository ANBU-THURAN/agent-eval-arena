import cron from 'node-cron';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { TRADING_CONFIG } from '../config/trading.config.js';
import { TradingService } from './TradingService.js';
import { RoundOrchestrator } from './RoundOrchestrator.js';
import { MS_PER_SECOND } from '../constants/index.js';
export class SessionScheduler {
    currentSessionId = null;
    roundOrchestrator = null;
    tradingService;
    wsServer;
    countdownInterval = null;
    currentSessionEndTime = null;
    isPaused = false;
    sessionEndTimeout = null;
    pausedTimeRemaining = null;
    constructor(wsServer) {
        this.wsServer = wsServer;
        this.tradingService = new TradingService(wsServer);
    }
    start() {
        console.log('Session Scheduler started');
        // Schedule daily session at configured time
        const [hour, minute] = TRADING_CONFIG.sessionStartTime.split(':').map(Number);
        const cronSchedule = `${minute} ${hour} * * *`; // Daily at specified time
        cron.schedule(cronSchedule, async () => {
            console.log('Starting scheduled trading session...');
            await this.startSession();
        });
        // Check if there's an active session on startup
        this.checkActiveSession();
    }
    async checkActiveSession() {
        const activeSessions = await db.query.sessions.findMany({
            where: eq(schema.sessions.status, 'active'),
        });
        if (activeSessions.length > 0) {
            const session = activeSessions[0];
            const now = new Date();
            // Mark expired sessions as completed instead of resuming
            if (session.endTime && now >= session.endTime) {
                console.log(`Active session ${session.id} expired, marking as completed`);
                await db
                    .update(schema.sessions)
                    .set({ status: 'completed' })
                    .where(eq(schema.sessions.id, session.id));
                return;
            }
            console.log(`Found active session: ${session.id}`);
            this.currentSessionId = session.id;
            this.currentSessionEndTime = session.endTime;
            console.log('Resuming active session...');
            this.roundOrchestrator = new RoundOrchestrator(session.id, this.wsServer);
            this.roundOrchestrator.start();
            // Restart countdown interval for resumed session
            if (session.endTime) {
                // Broadcast initial countdown
                const now = new Date();
                const initialSecondsRemaining = Math.max(0, Math.floor((session.endTime.getTime() - now.getTime()) / MS_PER_SECOND));
                this.wsServer.broadcastCountdownTick(initialSecondsRemaining);
                // Start countdown interval
                this.countdownInterval = setInterval(() => {
                    const now = new Date();
                    const secondsRemaining = Math.max(0, Math.floor((session.endTime.getTime() - now.getTime()) / MS_PER_SECOND));
                    if (secondsRemaining > 0) {
                        this.wsServer.broadcastCountdownTick(secondsRemaining);
                    }
                    else {
                        if (this.countdownInterval) {
                            clearInterval(this.countdownInterval);
                            this.countdownInterval = null;
                        }
                    }
                }, MS_PER_SECOND);
                // Schedule session end if time remaining
                const timeRemaining = session.endTime.getTime() - now.getTime();
                if (timeRemaining > 0) {
                    setTimeout(async () => {
                        if (this.countdownInterval) {
                            clearInterval(this.countdownInterval);
                            this.countdownInterval = null;
                        }
                        await this.endSession(session.id);
                    }, timeRemaining);
                }
            }
        }
    }
    async startSession() {
        const sessionId = randomUUID();
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + TRADING_CONFIG.sessionDuration);
        this.currentSessionEndTime = endTime;
        // Create session
        await db.insert(schema.sessions).values({
            id: sessionId,
            startTime,
            endTime,
            status: 'active',
        });
        // Initialize inventories for all agents
        await this.tradingService.initializeSessionInventories(sessionId);
        console.log(`Session ${sessionId} started at ${startTime}`);
        // Start round orchestrator
        this.currentSessionId = sessionId;
        this.roundOrchestrator = new RoundOrchestrator(sessionId, this.wsServer);
        this.roundOrchestrator.start();
        // Broadcast initial countdown immediately
        const initialSecondsRemaining = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / MS_PER_SECOND));
        this.wsServer.broadcastCountdownTick(initialSecondsRemaining);
        // Start countdown timer
        this.countdownInterval = setInterval(() => {
            const now = new Date();
            const secondsRemaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / MS_PER_SECOND));
            if (secondsRemaining > 0) {
                this.wsServer.broadcastCountdownTick(secondsRemaining);
            }
            else {
                if (this.countdownInterval) {
                    clearInterval(this.countdownInterval);
                    this.countdownInterval = null;
                }
            }
        }, MS_PER_SECOND);
        // Schedule session end
        this.sessionEndTimeout = setTimeout(async () => {
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
            await this.endSession(sessionId);
        }, TRADING_CONFIG.sessionDuration);
        return sessionId;
    }
    async endSession(sessionId) {
        console.log(`Ending session ${sessionId}...`);
        // Stop round orchestrator
        if (this.roundOrchestrator) {
            this.roundOrchestrator.stop();
            this.roundOrchestrator = null;
        }
        // Stop countdown timer
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        // Clear session end timeout if it exists
        if (this.sessionEndTimeout) {
            clearTimeout(this.sessionEndTimeout);
            this.sessionEndTimeout = null;
        }
        // Update session status
        await db
            .update(schema.sessions)
            .set({ status: 'completed' })
            .where(eq(schema.sessions.id, sessionId));
        // Calculate final leaderboard
        await this.calculateLeaderboard(sessionId);
        // Broadcast session completion to all connected clients
        this.wsServer.broadcastSessionStatus('completed', sessionId);
        console.log(`Session ${sessionId} completed`);
        this.currentSessionId = null;
        this.currentSessionEndTime = null;
    }
    async calculateLeaderboard(sessionId) {
        const agents = await db.query.agents.findMany();
        const goods = await db.query.goods.findMany();
        const goodsPriceMap = new Map(goods.map((g) => [g.id, g.referencePrice]));
        const leaderboardEntries = [];
        for (const agent of agents) {
            // Get agent's final state
            const state = await this.tradingService.getAgentState(sessionId, agent.id);
            // Calculate goods value
            const inventories = await db.query.inventories.findMany({
                where: eq(schema.inventories.agentId, agent.id),
            });
            let goodsValue = 0;
            for (const inv of inventories) {
                const price = goodsPriceMap.get(inv.goodId) || 0;
                goodsValue += inv.quantity * price;
            }
            const totalWealth = state.cash + goodsValue;
            leaderboardEntries.push({
                agentId: agent.id,
                finalCash: state.cash,
                finalGoodsValue: goodsValue,
                totalWealth,
                tradesCompleted: state.tradesCompleted,
            });
        }
        // Sort by total wealth
        leaderboardEntries.sort((a, b) => b.totalWealth - a.totalWealth);
        // Insert into leaderboard with ranks
        for (let i = 0; i < leaderboardEntries.length; i++) {
            const entry = leaderboardEntries[i];
            await db.insert(schema.leaderboard).values({
                id: randomUUID(),
                sessionId,
                agentId: entry.agentId,
                finalCash: entry.finalCash,
                finalGoodsValue: entry.finalGoodsValue,
                totalWealth: entry.totalWealth,
                tradesCompleted: entry.tradesCompleted,
                tradesRequired: TRADING_CONFIG.minTradesPerDay,
                rank: i + 1,
            });
        }
        console.log(`Leaderboard calculated for session ${sessionId}`);
    }
    getCurrentSessionId() {
        return this.currentSessionId;
    }
    async getNextSessionTime() {
        const now = new Date();
        const [hour, minute] = TRADING_CONFIG.sessionStartTime.split(':').map(Number);
        const nextSession = new Date(now);
        nextSession.setHours(hour, minute, 0, 0);
        // If the time has passed today, schedule for tomorrow
        if (nextSession <= now) {
            nextSession.setDate(nextSession.getDate() + 1);
        }
        return nextSession;
    }
    getCurrentCountdown() {
        if (!this.currentSessionEndTime) {
            return null;
        }
        const now = new Date();
        const secondsRemaining = Math.max(0, Math.floor((this.currentSessionEndTime.getTime() - now.getTime()) / MS_PER_SECOND));
        return secondsRemaining;
    }
    pauseSession() {
        if (!this.roundOrchestrator || !this.currentSessionId) {
            throw new Error('No active session to pause');
        }
        this.isPaused = true;
        // Pause round orchestrator
        if (this.roundOrchestrator) {
            this.roundOrchestrator.pause();
        }
        // Calculate and store remaining time
        if (this.currentSessionEndTime) {
            const now = new Date();
            this.pausedTimeRemaining = Math.max(0, this.currentSessionEndTime.getTime() - now.getTime());
            console.log(`Session paused with ${Math.floor(this.pausedTimeRemaining / MS_PER_SECOND)}s remaining`);
        }
        // Stop countdown timer
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        // Cancel session end timeout
        if (this.sessionEndTimeout) {
            clearTimeout(this.sessionEndTimeout);
            this.sessionEndTimeout = null;
        }
        // Broadcast pause event
        this.wsServer.broadcastSessionPaused();
        console.log('Session paused');
    }
    async resumeSession() {
        if (!this.roundOrchestrator || !this.currentSessionId) {
            throw new Error('No active session to resume');
        }
        if (!this.isPaused) {
            return; // Already running
        }
        if (this.pausedTimeRemaining === null) {
            throw new Error('No paused time remaining stored');
        }
        this.isPaused = false;
        // Calculate new end time based on remaining time
        const now = new Date();
        const newEndTime = new Date(now.getTime() + this.pausedTimeRemaining);
        this.currentSessionEndTime = newEndTime;
        console.log(`Session resumed with ${Math.floor(this.pausedTimeRemaining / MS_PER_SECOND)}s remaining, new end time: ${newEndTime.toISOString()}`);
        // Update session end time in database
        await db
            .update(schema.sessions)
            .set({ endTime: newEndTime })
            .where(eq(schema.sessions.id, this.currentSessionId));
        // Resume round orchestrator
        if (this.roundOrchestrator) {
            this.roundOrchestrator.resume();
        }
        // Restart countdown timer with new end time
        this.countdownInterval = setInterval(() => {
            const now = new Date();
            const secondsRemaining = Math.max(0, Math.floor((this.currentSessionEndTime.getTime() - now.getTime()) / MS_PER_SECOND));
            if (secondsRemaining > 0) {
                this.wsServer.broadcastCountdownTick(secondsRemaining);
            }
            else {
                if (this.countdownInterval) {
                    clearInterval(this.countdownInterval);
                    this.countdownInterval = null;
                }
            }
        }, MS_PER_SECOND);
        // Broadcast current countdown immediately
        const secondsRemaining = Math.max(0, Math.floor(this.pausedTimeRemaining / MS_PER_SECOND));
        this.wsServer.broadcastCountdownTick(secondsRemaining);
        // Schedule new session end timeout with remaining time
        const sessionIdToEnd = this.currentSessionId;
        this.sessionEndTimeout = setTimeout(async () => {
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
            await this.endSession(sessionIdToEnd);
        }, this.pausedTimeRemaining);
        // Clear paused time remaining
        this.pausedTimeRemaining = null;
        // Broadcast resume event
        this.wsServer.broadcastSessionResumed();
        console.log('Session resumed');
    }
    getIsPaused() {
        return this.isPaused;
    }
}
//# sourceMappingURL=SessionScheduler.js.map