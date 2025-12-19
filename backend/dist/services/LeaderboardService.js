import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
/**
 * LeaderboardService handles leaderboard calculations and aggregations
 * Provides optimized queries for daily and all-time leaderboards
 */
export class LeaderboardService {
    /**
     * Get daily leaderboard for a specific session
     * Optimized with preloaded agent data to avoid N+1 queries
     */
    async getDailyLeaderboard(sessionId) {
        // Fetch leaderboard entries for this session
        const leaderboard = await db.query.leaderboard.findMany({
            where: eq(schema.leaderboard.sessionId, sessionId),
            orderBy: [desc(schema.leaderboard.totalWealth)],
        });
        // Preload all agents once for O(1) lookup instead of N queries
        const agents = await db.query.agents.findMany();
        const agentMap = new Map(agents.map(a => [a.id, a]));
        // Enrich with agent details using Map lookup
        const enriched = leaderboard.map((entry) => {
            const agent = agentMap.get(entry.agentId);
            return {
                agentId: entry.agentId,
                agentName: agent?.name || 'Unknown',
                provider: agent?.provider || 'Unknown',
                totalWealth: entry.totalWealth,
                finalCash: entry.finalCash,
                finalGoodsValue: entry.finalGoodsValue,
                tradesCompleted: entry.tradesCompleted,
                tradesRequired: entry.tradesRequired,
                rank: entry.rank,
            };
        });
        return enriched;
    }
    /**
     * Get all-time leaderboard aggregated across all sessions
     * Optimized with preloaded agent data to avoid N+1 queries
     */
    async getAllTimeLeaderboard() {
        // Fetch all leaderboard entries
        const allEntries = await db.query.leaderboard.findMany();
        // Group by agent and calculate aggregates
        const agentStats = new Map();
        for (const entry of allEntries) {
            const existing = agentStats.get(entry.agentId) || {
                totalWealth: 0,
                sessionsPlayed: 0,
                wins: 0,
                totalTrades: 0,
            };
            agentStats.set(entry.agentId, {
                totalWealth: existing.totalWealth + entry.totalWealth,
                sessionsPlayed: existing.sessionsPlayed + 1,
                wins: existing.wins + (entry.rank === 1 ? 1 : 0),
                totalTrades: existing.totalTrades + entry.tradesCompleted,
            });
        }
        // Preload all agents once for O(1) lookup instead of N queries
        const agents = await db.query.agents.findMany();
        const agentMap = new Map(agents.map(a => [a.id, a]));
        // Convert to array and enrich using Map lookup
        const leaderboard = Array.from(agentStats.entries()).map(([agentId, stats]) => {
            const agent = agentMap.get(agentId);
            return {
                agentId,
                agentName: agent?.name || 'Unknown',
                provider: agent?.provider || 'Unknown',
                totalWealth: stats.totalWealth,
                averageWealth: stats.totalWealth / stats.sessionsPlayed,
                sessionsPlayed: stats.sessionsPlayed,
                wins: stats.wins,
                totalTrades: stats.totalTrades,
            };
        });
        // Sort by average wealth (descending)
        leaderboard.sort((a, b) => b.averageWealth - a.averageWealth);
        return leaderboard;
    }
    /**
     * Calculate and save final leaderboard for a completed session
     */
    async calculateSessionLeaderboard(sessionId) {
        // Get all agents
        const agents = await db.query.agents.findMany();
        // Get all trades for this session
        const trades = await db.query.trades.findMany({
            where: eq(schema.trades.sessionId, sessionId),
        });
        // Get all inventories for this session
        const inventories = await db.query.inventories.findMany({
            where: eq(schema.inventories.sessionId, sessionId),
        });
        // Get all goods for price calculations
        const goods = await db.query.goods.findMany();
        const goodsMap = new Map(goods.map(g => [g.id, g]));
        // Calculate wealth for each agent
        const agentWealths = [];
        for (const agent of agents) {
            // Get agent's inventories
            const agentInventories = inventories.filter(inv => inv.agentId === agent.id);
            // Calculate cash (should be same for all inventories)
            const finalCash = agentInventories.length > 0 ? agentInventories[0].cashBalance : 0;
            // Calculate goods value
            let finalGoodsValue = 0;
            for (const inv of agentInventories) {
                const good = goodsMap.get(inv.goodId);
                if (good) {
                    finalGoodsValue += inv.quantity * good.referencePrice;
                }
            }
            // Count trades
            const tradesCompleted = trades.filter(t => t.fromAgentId === agent.id || t.toAgentId === agent.id).length;
            const totalWealth = finalCash + finalGoodsValue;
            agentWealths.push({
                agentId: agent.id,
                totalWealth,
                finalCash,
                finalGoodsValue,
                tradesCompleted,
            });
        }
        // Sort by wealth (descending) to assign ranks
        agentWealths.sort((a, b) => b.totalWealth - a.totalWealth);
        // Save to leaderboard table
        for (let i = 0; i < agentWealths.length; i++) {
            const entry = agentWealths[i];
            await db.insert(schema.leaderboard).values({
                id: `${sessionId}-${entry.agentId}`,
                sessionId,
                agentId: entry.agentId,
                finalCash: entry.finalCash,
                finalGoodsValue: entry.finalGoodsValue,
                totalWealth: entry.totalWealth,
                tradesCompleted: entry.tradesCompleted,
                tradesRequired: 5, // From TRADING_CONFIG
                rank: i + 1, // 1-indexed rank
            });
        }
    }
}
//# sourceMappingURL=LeaderboardService.js.map