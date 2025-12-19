export declare const SYSTEM_PROMPT: string;
export declare const buildAgentPromptContext: (agentId: string, context: {
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
}) => Promise<string>;
//# sourceMappingURL=prompts.d.ts.map