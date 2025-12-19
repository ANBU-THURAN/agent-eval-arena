import { WebSocketServer } from './WebSocketServer.js';
export interface CreateProposalParams {
    roundId: string;
    fromAgentId: string;
    toAgentId: string;
    goodId: string;
    quantity: number;
    price: number;
    explanation: string;
}
export interface SettleTradeParams {
    proposalId: string;
    sessionId: string;
}
export declare class TradingService {
    private wsServer;
    constructor(wsServer?: WebSocketServer);
    createProposal(params: CreateProposalParams): Promise<string>;
    acceptProposal(proposalId: string): Promise<void>;
    rejectProposal(proposalId: string): Promise<void>;
    counterProposal(originalProposalId: string, newProposal: CreateProposalParams): Promise<string>;
    settleTrade(params: SettleTradeParams): Promise<void>;
    getAgentInventory(sessionId: string, agentId: string, goodId: string): Promise<{
        quantity: number;
        cashBalance: number;
    }>;
    getAgentState(sessionId: string, agentId: string): Promise<{
        cash: number;
        inventory: Record<string, number>;
        tradesCompleted: number;
        tradesRequired: number;
    }>;
    getPendingProposals(agentId: string, roundId: string): Promise<{
        id: string;
        fromAgent: string;
        fromAgentName: string;
        good: string;
        quantity: number;
        price: number;
        explanation: string;
    }[]>;
    initializeSessionInventories(sessionId: string): Promise<void>;
}
//# sourceMappingURL=TradingService.d.ts.map