import { AgentTools } from './AgentTools.js';
export interface AgentContext {
    currentState: {
        cash: number;
        inventory: Record<string, number>;
        tradesCompleted: number;
        tradesRequired: number;
    };
    pendingProposals: Array<{
        id: string;
        fromAgent: string;
        fromAgentName: string;
        good: string;
        quantity: number;
        price: number;
        explanation: string;
    }>;
    roundNumber: number;
    timeRemaining: string;
}
/**
 * AgentExecutionEngine integrates with Google Gemini API
 * to execute agents with function calling capabilities.
 *
 * Agents can call tools directly to perform trades, which update
 * the database in real-time, making them truly stateful.
 */
export declare class AgentExecutionEngine {
    private genAI;
    private lastApiCallTime;
    private readonly minApiCallDelay;
    constructor(minDelayMs?: number);
    /**
     * Ensures minimum delay between API calls to respect rate limits
     */
    private enforceRateLimit;
    /**
     * Define tools (functions) that agents can call
     */
    private getFunctionDeclarations;
    /**
     * Execute an agent for one round with Gemini function calling
     */
    executeAgent(agentId: string, modelName: string, provider: string, context: AgentContext, tools: AgentTools): Promise<void>;
    /**
     * Execute a tool function called by the agent
     */
    private executeTool;
}
//# sourceMappingURL=AgentExecutionEngine.d.ts.map