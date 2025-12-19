import { TradingService } from './TradingService.js';
export interface ToolResult {
    success: boolean;
    message: string;
    data?: any;
}
/**
 * AgentTools provides stateful tool functions that agents can call
 * to directly interact with the trading system and update the database.
 */
export declare class AgentTools {
    private tradingService;
    private sessionId;
    private roundId;
    private agentId;
    constructor(tradingService: TradingService, sessionId: string, roundId: string, agentId: string);
    /**
     * Make a proposal to another agent to trade goods
     */
    makeProposal(toAgentId: string, goodName: string, quantity: number, price: number, explanation: string): Promise<ToolResult>;
    /**
     * Accept a pending proposal and settle the trade
     */
    acceptProposal(proposalId: string, explanation: string): Promise<ToolResult>;
    /**
     * Reject a pending proposal
     */
    rejectProposal(proposalId: string, explanation: string): Promise<ToolResult>;
    /**
     * Counter a proposal with different terms
     */
    counterProposal(proposalId: string, quantity: number, price: number, explanation: string): Promise<ToolResult>;
    /**
     * Get current states of all agents in the market
     * Returns inventory and cash balance for all agents
     */
    getAgentStates(): Promise<ToolResult>;
}
//# sourceMappingURL=AgentTools.d.ts.map