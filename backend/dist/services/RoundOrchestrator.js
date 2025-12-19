import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { TRADING_CONFIG } from '../config/trading.config.js';
import { AgentExecutionEngine } from './AgentExecutionEngine.js';
import { TradingService } from './TradingService.js';
import { AgentTools } from './AgentTools.js';
import { AGENT_DELAY_BETWEEN_ROUNDS_MS, MS_PER_MINUTE, MS_PER_SECOND } from '../constants/index.js';
/**
 * Rotates an array based on round number.
 * Round 1 starts at index 0, Round 2 at index 1, etc.
 */
function rotateAgentsByRound(agents, roundNumber) {
    if (agents.length === 0)
        return agents;
    const startIndex = (roundNumber - 1) % agents.length;
    return [...agents.slice(startIndex), ...agents.slice(0, startIndex)];
}
export class RoundOrchestrator {
    sessionId;
    currentRound = 0;
    intervalId = null;
    agentEngine;
    tradingService;
    wsServer;
    isRunning = false;
    isPaused = false;
    constructor(sessionId, wsServer) {
        this.sessionId = sessionId;
        this.wsServer = wsServer;
        this.tradingService = new TradingService(wsServer);
        this.agentEngine = new AgentExecutionEngine(TRADING_CONFIG.llmApiCallDelay);
    }
    start() {
        if (this.isRunning) {
            console.log('Round orchestrator already running');
            return;
        }
        this.isRunning = true;
        console.log(`Round orchestrator started for session ${this.sessionId}`);
        // Execute first round immediately
        this.executeRound();
        // Schedule subsequent rounds
        this.intervalId = setInterval(() => {
            this.executeRound();
        }, TRADING_CONFIG.roundInterval);
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('Round orchestrator stopped');
    }
    pause() {
        this.isPaused = true;
        // Stop the interval to prevent new rounds from starting
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('Round orchestrator paused');
    }
    resume() {
        this.isPaused = false;
        // Restart the interval
        if (!this.intervalId) {
            this.intervalId = setInterval(() => {
                this.executeRound();
            }, TRADING_CONFIG.roundInterval);
        }
        console.log('Round orchestrator resumed');
    }
    async executeRound() {
        // Check if paused before executing
        if (this.isPaused) {
            console.log('Round execution skipped (paused)');
            return;
        }
        this.currentRound++;
        const roundId = randomUUID();
        const startTime = new Date();
        console.log(`\n=== Round ${this.currentRound} started ===`);
        // Broadcast round start to frontend
        this.wsServer.broadcastRoundStart(this.currentRound, this.sessionId);
        // Create round record
        await db.insert(schema.rounds).values({
            id: roundId,
            sessionId: this.sessionId,
            roundNumber: this.currentRound,
            startTime,
            endTime: null,
        });
        // Get all agents
        const allAgents = await db.query.agents.findMany();
        // Rotate agents based on round number for fair rotation
        const agents = rotateAgentsByRound(allAgents, this.currentRound);
        console.log(`Round ${this.currentRound} agent order: ${agents.map(a => a.name).join(' → ')}`);
        // Execute agents sequentially with delays to avoid rate limiting
        for (const agent of agents) {
            // Check if paused before each agent execution
            if (this.isPaused) {
                console.log('Round execution interrupted (paused during agent loop)');
                break;
            }
            try {
                await this.executeAgentRound(roundId, agent.id, agent.modelId, agent.provider);
                // Add small delay between agents for logging clarity
                // (Rate limiting now handled within AgentExecutionEngine)
                await new Promise(resolve => setTimeout(resolve, AGENT_DELAY_BETWEEN_ROUNDS_MS));
            }
            catch (error) {
                console.error(`Error executing agent ${agent.id}:`, error);
            }
        }
        // Mark round as complete
        await db
            .update(schema.rounds)
            .set({ endTime: new Date() })
            .where(eq(schema.rounds.id, roundId));
        console.log(`=== Round ${this.currentRound} completed ===\n`);
    }
    async executeAgentRound(roundId, agentId, modelId, provider) {
        // Get agent's current state
        const state = await this.tradingService.getAgentState(this.sessionId, agentId);
        // Get pending proposals for this agent
        const pendingProposals = await this.tradingService.getPendingProposals(agentId, roundId);
        // Calculate time remaining
        const session = await db.query.sessions.findFirst({
            where: eq(schema.sessions.id, this.sessionId),
        });
        const timeRemaining = session?.endTime
            ? this.formatTimeRemaining(new Date(), session.endTime)
            : 'Unknown';
        // Get model details
        const model = await db.query.models.findFirst({
            where: eq(schema.models.id, modelId),
        });
        if (!model) {
            throw new Error(`Model ${modelId} not found`);
        }
        // Create tools instance for this agent
        const tools = new AgentTools(this.tradingService, this.sessionId, roundId, agentId);
        // Execute agent with tools (agent now calls tools directly)
        await this.agentEngine.executeAgent(agentId, model.name, provider, {
            currentState: {
                ...state,
                tradesRequired: TRADING_CONFIG.minTradesPerDay,
            },
            pendingProposals,
            roundNumber: this.currentRound,
            timeRemaining,
        }, tools);
        // Note: No need to process actions anymore - tools handle everything!
    }
    formatTimeRemaining(now, endTime) {
        const diff = endTime.getTime() - now.getTime();
        const minutes = Math.floor(diff / MS_PER_MINUTE);
        const seconds = Math.floor((diff % MS_PER_MINUTE) / MS_PER_SECOND);
        return `${minutes}m ${seconds}s`;
    }
}
//# sourceMappingURL=RoundOrchestrator.js.map