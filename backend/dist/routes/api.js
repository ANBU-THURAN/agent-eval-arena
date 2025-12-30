import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { SessionService } from '../services/SessionService.js';
import { LeaderboardService } from '../services/LeaderboardService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
export const apiRouter = Router();
// Initialize services
const sessionService = new SessionService();
const leaderboardService = new LeaderboardService();
// Get all sessions
apiRouter.get('/sessions', asyncHandler(async (req, res) => {
    const sessions = await sessionService.getAllSessions();
    res.json(sessions);
}));
// Get current/next session - MUST come BEFORE :id route
apiRouter.get('/sessions/current', asyncHandler(async (req, res) => {
    const currentSession = await sessionService.getCurrentSession();
    res.json(currentSession);
}));
// Get session by ID
apiRouter.get('/sessions/:id', asyncHandler(async (req, res) => {
    const session = await sessionService.getSessionById(req.params.id);
    res.json(session);
}));
// Get all agents
apiRouter.get('/agents', async (req, res) => {
    try {
        const agents = await db.query.agents.findMany();
        res.json(agents);
    }
    catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
});
// Get all goods
apiRouter.get('/goods', async (req, res) => {
    try {
        const goods = await db.query.goods.findMany();
        res.json(goods);
    }
    catch (error) {
        console.error('Error fetching goods:', error);
        res.status(500).json({ error: 'Failed to fetch goods' });
    }
});
// Get agent states for a session
apiRouter.get('/agents/states/:sessionId', async (req, res) => {
    try {
        const agents = await db.query.agents.findMany();
        const goods = await db.query.goods.findMany();
        const agentStates = await Promise.all(agents.map(async (agent) => {
            // Get agent's inventories for this session
            const inventories = await db.query.inventories.findMany({
                where: eq(schema.inventories.agentId, agent.id),
            });
            // Build inventory map
            const inventory = {};
            let cash = 10000; // Default
            for (const inv of inventories) {
                const good = goods.find(g => g.id === inv.goodId);
                if (good) {
                    inventory[good.name] = inv.quantity;
                }
                cash = inv.cashBalance; // All inventories have same cash balance
            }
            // Count completed trades for this agent in this session
            const trades = await db.query.trades.findMany({
                where: eq(schema.trades.sessionId, req.params.sessionId),
            });
            const tradesCompleted = trades.filter(t => t.fromAgentId === agent.id || t.toAgentId === agent.id).length;
            return {
                ...agent,
                cash,
                inventory,
                tradesCompleted,
                tradesRequired: 5,
            };
        }));
        res.json(agentStates);
    }
    catch (error) {
        console.error('Error fetching agent states:', error);
        res.status(500).json({ error: 'Failed to fetch agent states' });
    }
});
// Get daily leaderboard
apiRouter.get('/leaderboard/daily/:sessionId', asyncHandler(async (req, res) => {
    const leaderboard = await leaderboardService.getDailyLeaderboard(req.params.sessionId);
    res.json(leaderboard);
}));
// Get all-time leaderboard
apiRouter.get('/leaderboard/alltime', asyncHandler(async (req, res) => {
    const leaderboard = await leaderboardService.getAllTimeLeaderboard();
    res.json(leaderboard);
}));
// Get trades for session
apiRouter.get('/trades/:sessionId', async (req, res) => {
    try {
        const trades = await db.query.trades.findMany({
            where: eq(schema.trades.sessionId, req.params.sessionId),
            orderBy: [desc(schema.trades.settledAt)],
        });
        // Enrich with agent and good details
        const enriched = await Promise.all(trades.map(async (trade) => {
            const fromAgent = await db.query.agents.findFirst({
                where: eq(schema.agents.id, trade.fromAgentId),
            });
            const toAgent = await db.query.agents.findFirst({
                where: eq(schema.agents.id, trade.toAgentId),
            });
            const good = await db.query.goods.findFirst({
                where: eq(schema.goods.id, trade.goodId),
            });
            return {
                ...trade,
                fromAgentName: fromAgent?.name || 'Unknown',
                toAgentName: toAgent?.name || 'Unknown',
                goodName: good?.name || 'Unknown',
                goodUnit: good?.unit || '',
            };
        }));
        res.json(enriched);
    }
    catch (error) {
        console.error('Error fetching trades:', error);
        res.status(500).json({ error: 'Failed to fetch trades' });
    }
});
// Get proposals for session
apiRouter.get('/proposals/:sessionId', async (req, res) => {
    try {
        // Get rounds for session
        const rounds = await db.query.rounds.findMany({
            where: eq(schema.rounds.sessionId, req.params.sessionId),
        });
        const roundIds = rounds.map((r) => r.id);
        // Get all proposals for these rounds
        const proposals = await db.query.proposals.findMany({
            orderBy: [desc(schema.proposals.createdAt)],
        });
        // Filter proposals that belong to this session's rounds
        const sessionProposals = proposals.filter((p) => roundIds.includes(p.roundId));
        // Enrich with details
        const enriched = await Promise.all(sessionProposals.map(async (proposal) => {
            const fromAgent = await db.query.agents.findFirst({
                where: eq(schema.agents.id, proposal.fromAgentId),
            });
            const toAgent = await db.query.agents.findFirst({
                where: eq(schema.agents.id, proposal.toAgentId),
            });
            const good = await db.query.goods.findFirst({
                where: eq(schema.goods.id, proposal.goodId),
            });
            return {
                ...proposal,
                fromAgentName: fromAgent?.name || 'Unknown',
                toAgentName: toAgent?.name || 'Unknown',
                goodName: good?.name || 'Unknown',
                goodUnit: good?.unit || '',
            };
        }));
        res.json(enriched);
    }
    catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
});
// Get logs for session
apiRouter.get('/logs/:sessionId', async (req, res) => {
    try {
        const logs = await db.query.logs.findMany({
            where: eq(schema.logs.sessionId, req.params.sessionId),
            orderBy: [desc(schema.logs.timestamp)],
        });
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});
// POST /api/sessions/start - Manually start a new session (protected with API key)
apiRouter.post('/sessions/start', requireApiKey, async (req, res) => {
    try {
        const sessionScheduler = req.app.get('sessionScheduler');
        if (!sessionScheduler) {
            return res.status(500).json({ error: 'Session scheduler not available' });
        }
        // Check if there's already an active session
        const activeSession = await db.query.sessions.findFirst({
            where: eq(schema.sessions.status, 'active'),
        });
        if (activeSession) {
            return res.status(400).json({
                error: 'A session is already active',
                sessionId: activeSession.id
            });
        }
        // Start new session
        const sessionId = await sessionScheduler.startSession();
        res.json({
            success: true,
            sessionId,
            message: 'Trading session started successfully'
        });
    }
    catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});
// POST /api/agents/comparison - Compare multiple agents
apiRouter.post('/agents/comparison', async (req, res) => {
    try {
        const { agentIds, sessionId } = req.body;
        // Validate input
        if (!Array.isArray(agentIds) || agentIds.length < 2 || agentIds.length > 3) {
            return res.status(400).json({ error: 'Must provide 2-3 agent IDs' });
        }
        // Fetch basic agent info
        const agents = await Promise.all(agentIds.map(async (agentId) => {
            const agent = await db.query.agents.findFirst({
                where: eq(schema.agents.id, agentId),
            });
            return agent;
        }));
        // Check if all agents exist
        if (agents.some((a) => !a)) {
            return res.status(404).json({ error: 'One or more agents not found' });
        }
        // Fetch all-time stats from leaderboard
        const allLeaderboardEntries = await db.query.leaderboard.findMany();
        // Fetch goods for inventory value calculation
        const goods = await db.query.goods.findMany();
        // Build comparison data for each agent
        const comparisonData = await Promise.all(agents.map(async (agent) => {
            if (!agent)
                return null;
            // Calculate all-time stats
            const agentLeaderboardEntries = allLeaderboardEntries.filter((entry) => entry.agentId === agent.id);
            const totalWealth = agentLeaderboardEntries.reduce((sum, entry) => sum + entry.totalWealth, 0);
            const sessionsPlayed = agentLeaderboardEntries.length;
            const wins = agentLeaderboardEntries.filter((entry) => entry.rank === 1).length;
            const totalTrades = agentLeaderboardEntries.reduce((sum, entry) => sum + entry.tradesCompleted, 0);
            const allTimeStats = {
                totalWealth,
                averageWealth: sessionsPlayed > 0 ? totalWealth / sessionsPlayed : 0,
                sessionsPlayed,
                wins,
                totalTrades,
                winRate: sessionsPlayed > 0 ? wins / sessionsPlayed : 0,
            };
            // If sessionId is provided, get current session state
            let currentSession = null;
            if (sessionId) {
                const inventories = await db.query.inventories.findMany({
                    where: eq(schema.inventories.agentId, agent.id),
                });
                const inventory = {};
                let cash = 10000; // Default
                for (const inv of inventories) {
                    const good = goods.find((g) => g.id === inv.goodId);
                    if (good) {
                        inventory[good.name] = inv.quantity;
                    }
                    cash = inv.cashBalance;
                }
                // Count trades in this session
                const sessionTrades = await db.query.trades.findMany({
                    where: eq(schema.trades.sessionId, sessionId),
                });
                const tradesCompleted = sessionTrades.filter((t) => t.fromAgentId === agent.id || t.toAgentId === agent.id).length;
                // Calculate wealth
                const inventoryValue = Object.entries(inventory).reduce((sum, [goodName, qty]) => {
                    const good = goods.find((g) => g.name === goodName);
                    return sum + (good ? good.referencePrice * qty : 0);
                }, 0);
                currentSession = {
                    cash,
                    inventory,
                    tradesCompleted,
                    tradesRequired: 5,
                    wealth: cash + inventoryValue,
                };
            }
            // Calculate head-to-head stats with other agents
            const headToHead = {};
            for (const otherAgent of agents) {
                if (!otherAgent || otherAgent.id === agent.id)
                    continue;
                const allTrades = await db.query.trades.findMany();
                const tradesBetween = allTrades.filter((t) => (t.fromAgentId === agent.id && t.toAgentId === otherAgent.id) ||
                    (t.fromAgentId === otherAgent.id && t.toAgentId === agent.id));
                let totalValueSent = 0;
                let totalValueReceived = 0;
                for (const trade of tradesBetween) {
                    if (trade.fromAgentId === agent.id) {
                        // Agent sold goods
                        totalValueReceived += trade.price;
                    }
                    else {
                        // Agent bought goods
                        totalValueSent += trade.price;
                    }
                }
                headToHead[otherAgent.id] = {
                    tradesWithAgent: tradesBetween.length,
                    totalValueSent,
                    totalValueReceived,
                    netProfit: totalValueReceived - totalValueSent,
                };
            }
            return {
                agent: {
                    id: agent.id,
                    name: agent.name,
                    provider: agent.provider,
                },
                currentSession,
                allTimeStats,
                headToHead,
            };
        }));
        res.json({
            agents: comparisonData.filter((a) => a !== null),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error in agents comparison:', error);
        res.status(500).json({ error: 'Failed to fetch comparison data' });
    }
});
// GET /api/agents/:agentId/head-to-head/:otherAgentId - Get detailed head-to-head stats
apiRouter.get('/agents/:agentId/head-to-head/:otherAgentId', async (req, res) => {
    try {
        const { agentId, otherAgentId } = req.params;
        // Validate agents exist
        const agent1 = await db.query.agents.findFirst({
            where: eq(schema.agents.id, agentId),
        });
        const agent2 = await db.query.agents.findFirst({
            where: eq(schema.agents.id, otherAgentId),
        });
        if (!agent1 || !agent2) {
            return res.status(404).json({ error: 'One or both agents not found' });
        }
        // Get all trades between these two agents
        const allTrades = await db.query.trades.findMany({
            orderBy: [desc(schema.trades.settledAt)],
        });
        const tradesBetween = allTrades.filter((t) => (t.fromAgentId === agentId && t.toAgentId === otherAgentId) ||
            (t.fromAgentId === otherAgentId && t.toAgentId === agentId));
        // Enrich trades with details
        const goods = await db.query.goods.findMany();
        const tradesHistory = await Promise.all(tradesBetween.map(async (trade) => {
            const good = goods.find((g) => g.id === trade.goodId);
            return {
                tradeId: trade.id,
                timestamp: trade.settledAt,
                good: good?.name || 'Unknown',
                quantity: trade.quantity,
                price: trade.price,
                buyer: trade.toAgentId,
                seller: trade.fromAgentId,
            };
        }));
        // Calculate summary
        let agent1ValueSent = 0;
        let agent1ValueReceived = 0;
        for (const trade of tradesBetween) {
            if (trade.fromAgentId === agentId) {
                // Agent1 sold, received money
                agent1ValueReceived += trade.price;
            }
            else {
                // Agent1 bought, sent money
                agent1ValueSent += trade.price;
            }
        }
        const netProfit = agent1ValueReceived - agent1ValueSent;
        res.json({
            fromAgent: agentId,
            toAgent: otherAgentId,
            totalTrades: tradesBetween.length,
            tradesHistory,
            summary: {
                totalValueExchanged: agent1ValueSent + agent1ValueReceived,
                agentAdvantage: netProfit > 0 ? agentId : netProfit < 0 ? otherAgentId : 'even',
                netProfitDifference: Math.abs(netProfit),
            },
        });
    }
    catch (error) {
        console.error('Error fetching head-to-head stats:', error);
        res.status(500).json({ error: 'Failed to fetch head-to-head statistics' });
    }
});
//# sourceMappingURL=api.js.map