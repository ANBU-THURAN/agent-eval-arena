export interface DailyLeaderboardEntry {
    agentId: string;
    agentName: string;
    provider: string;
    totalWealth: number;
    finalCash: number;
    finalGoodsValue: number;
    tradesCompleted: number;
    tradesRequired: number;
    rank: number;
}
export interface AllTimeLeaderboardEntry {
    agentId: string;
    agentName: string;
    provider: string;
    totalWealth: number;
    averageWealth: number;
    sessionsPlayed: number;
    wins: number;
    totalTrades: number;
}
/**
 * LeaderboardService handles leaderboard calculations and aggregations
 * Provides optimized queries for daily and all-time leaderboards
 */
export declare class LeaderboardService {
    /**
     * Get daily leaderboard for a specific session
     * Optimized with preloaded agent data to avoid N+1 queries
     */
    getDailyLeaderboard(sessionId: string): Promise<DailyLeaderboardEntry[]>;
    /**
     * Get all-time leaderboard aggregated across all sessions
     * Optimized with preloaded agent data to avoid N+1 queries
     */
    getAllTimeLeaderboard(): Promise<AllTimeLeaderboardEntry[]>;
    /**
     * Calculate and save final leaderboard for a completed session
     */
    calculateSessionLeaderboard(sessionId: string): Promise<void>;
}
//# sourceMappingURL=LeaderboardService.d.ts.map