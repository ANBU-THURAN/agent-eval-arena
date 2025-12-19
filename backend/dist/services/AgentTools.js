import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
/**
 * AgentTools provides stateful tool functions that agents can call
 * to directly interact with the trading system and update the database.
 */
export class AgentTools {
    tradingService;
    sessionId;
    roundId;
    agentId;
    constructor(tradingService, sessionId, roundId, agentId) {
        this.tradingService = tradingService;
        this.sessionId = sessionId;
        this.roundId = roundId;
        this.agentId = agentId;
    }
    /**
     * Make a proposal to another agent to trade goods
     */
    async makeProposal(toAgentId, goodName, quantity, price, explanation) {
        try {
            // Validate inputs
            if (!toAgentId || !goodName || quantity <= 0 || price <= 0 || !explanation) {
                return {
                    success: false,
                    message: 'Invalid proposal parameters. All fields are required and quantity/price must be positive.',
                };
            }
            // Check if target agent exists
            const targetAgent = await db.query.agents.findFirst({
                where: eq(schema.agents.id, toAgentId),
            });
            if (!targetAgent) {
                return {
                    success: false,
                    message: `Agent ${toAgentId} not found`,
                };
            }
            // Get good ID from name
            const goods = await db.query.goods.findMany();
            const good = goods.find((g) => g.name.toLowerCase() === goodName.toLowerCase());
            if (!good) {
                return {
                    success: false,
                    message: `Good '${goodName}' not found. Available goods: ${goods.map(g => g.name).join(', ')}`,
                };
            }
            // Validate agent has enough inventory (for selling) or cash (for buying)
            const state = await this.tradingService.getAgentState(this.sessionId, this.agentId);
            const inventory = await this.tradingService.getAgentInventory(this.sessionId, this.agentId, good.id);
            // Check if agent is selling (has goods) or buying (has cash)
            if (inventory.quantity >= quantity) {
                // Agent is selling goods
                console.log(`Agent ${this.agentId} proposing to sell ${quantity} ${goodName} for ₹${price}`);
            }
            else if (state.cash >= price) {
                // Agent is buying goods
                console.log(`Agent ${this.agentId} proposing to buy ${quantity} ${goodName} for ₹${price}`);
            }
            else {
                return {
                    success: false,
                    message: `Insufficient resources. You have ${inventory.quantity} ${goodName} and ₹${state.cash} cash. Cannot propose to trade ${quantity} ${goodName} for ₹${price}.`,
                };
            }
            // Create proposal
            const proposalId = await this.tradingService.createProposal({
                roundId: this.roundId,
                fromAgentId: this.agentId,
                toAgentId,
                goodId: good.id,
                quantity,
                price,
                explanation,
            });
            console.log(`✓ Proposal ${proposalId} created: ${this.agentId} → ${toAgentId}`);
            return {
                success: true,
                message: `Proposal created successfully to ${targetAgent.name}`,
                data: { proposalId, goodName, quantity, price },
            };
        }
        catch (error) {
            console.error('Error in makeProposal:', error);
            return {
                success: false,
                message: `Error creating proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Accept a pending proposal and settle the trade
     */
    async acceptProposal(proposalId, explanation) {
        try {
            if (!proposalId || !explanation) {
                return {
                    success: false,
                    message: 'Proposal ID and explanation are required',
                };
            }
            // Get proposal
            const proposal = await db.query.proposals.findFirst({
                where: eq(schema.proposals.id, proposalId),
            });
            if (!proposal) {
                return {
                    success: false,
                    message: `Proposal ${proposalId} not found`,
                };
            }
            // Verify this agent is the recipient
            if (proposal.toAgentId !== this.agentId) {
                return {
                    success: false,
                    message: 'You can only accept proposals sent to you',
                };
            }
            // Check if proposal is still pending
            if (proposal.status !== 'pending') {
                return {
                    success: false,
                    message: `Proposal is ${proposal.status}, cannot accept`,
                };
            }
            // Validate trade is feasible
            const fromInventory = await this.tradingService.getAgentInventory(this.sessionId, proposal.fromAgentId, proposal.goodId);
            const toInventory = await this.tradingService.getAgentInventory(this.sessionId, proposal.toAgentId, proposal.goodId);
            if (fromInventory.quantity < proposal.quantity) {
                return {
                    success: false,
                    message: 'Seller has insufficient goods for this trade',
                };
            }
            if (toInventory.cashBalance < proposal.price) {
                return {
                    success: false,
                    message: 'You have insufficient cash for this trade',
                };
            }
            // Accept and settle trade
            await this.tradingService.acceptProposal(proposalId);
            await this.tradingService.settleTrade({
                proposalId,
                sessionId: this.sessionId,
            });
            // Get good name for message
            const good = await db.query.goods.findFirst({
                where: eq(schema.goods.id, proposal.goodId),
            });
            console.log(`✓ Trade settled: ${proposalId}`);
            return {
                success: true,
                message: `Trade accepted! You purchased ${proposal.quantity} ${good?.name} for ₹${proposal.price}`,
                data: { proposalId, explanation },
            };
        }
        catch (error) {
            console.error('Error in acceptProposal:', error);
            return {
                success: false,
                message: `Error accepting proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Reject a pending proposal
     */
    async rejectProposal(proposalId, explanation) {
        try {
            if (!proposalId || !explanation) {
                return {
                    success: false,
                    message: 'Proposal ID and explanation are required',
                };
            }
            // Get proposal
            const proposal = await db.query.proposals.findFirst({
                where: eq(schema.proposals.id, proposalId),
            });
            if (!proposal) {
                return {
                    success: false,
                    message: `Proposal ${proposalId} not found`,
                };
            }
            // Verify this agent is the recipient
            if (proposal.toAgentId !== this.agentId) {
                return {
                    success: false,
                    message: 'You can only reject proposals sent to you',
                };
            }
            // Check if proposal is still pending
            if (proposal.status !== 'pending') {
                return {
                    success: false,
                    message: `Proposal is ${proposal.status}, cannot reject`,
                };
            }
            // Reject proposal
            await this.tradingService.rejectProposal(proposalId);
            console.log(`✓ Proposal rejected: ${proposalId} - ${explanation}`);
            return {
                success: true,
                message: `Proposal rejected: ${explanation}`,
                data: { proposalId, explanation },
            };
        }
        catch (error) {
            console.error('Error in rejectProposal:', error);
            return {
                success: false,
                message: `Error rejecting proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Counter a proposal with different terms
     */
    async counterProposal(proposalId, quantity, price, explanation) {
        try {
            if (!proposalId || quantity <= 0 || price <= 0 || !explanation) {
                return {
                    success: false,
                    message: 'All parameters are required and quantity/price must be positive',
                };
            }
            // Get original proposal
            const originalProposal = await db.query.proposals.findFirst({
                where: eq(schema.proposals.id, proposalId),
            });
            if (!originalProposal) {
                return {
                    success: false,
                    message: `Proposal ${proposalId} not found`,
                };
            }
            // Verify this agent is the recipient
            if (originalProposal.toAgentId !== this.agentId) {
                return {
                    success: false,
                    message: 'You can only counter proposals sent to you',
                };
            }
            // Check if proposal is still pending
            if (originalProposal.status !== 'pending') {
                return {
                    success: false,
                    message: `Proposal is ${originalProposal.status}, cannot counter`,
                };
            }
            // Create counter proposal (reverse direction)
            const counterProposalId = await this.tradingService.counterProposal(proposalId, {
                roundId: this.roundId,
                fromAgentId: this.agentId,
                toAgentId: originalProposal.fromAgentId,
                goodId: originalProposal.goodId,
                quantity,
                price,
                explanation,
            });
            // Get good name
            const good = await db.query.goods.findFirst({
                where: eq(schema.goods.id, originalProposal.goodId),
            });
            console.log(`✓ Counter proposal created: ${counterProposalId}`);
            return {
                success: true,
                message: `Counter proposal created: ${quantity} ${good?.name} for ₹${price}`,
                data: { counterProposalId, originalProposalId: proposalId, quantity, price },
            };
        }
        catch (error) {
            console.error('Error in counterProposal:', error);
            return {
                success: false,
                message: `Error creating counter proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Get current states of all agents in the market
     * Returns inventory and cash balance for all agents
     */
    async getAgentStates() {
        try {
            // Fetch all agents
            const allAgents = await db.query.agents.findMany({
                columns: {
                    id: true,
                    name: true,
                    provider: true,
                },
            });
            // Fetch agent states for the current session
            const agentStates = await Promise.all(allAgents.map(async (agent) => {
                const state = await this.tradingService.getAgentState(this.sessionId, agent.id);
                return {
                    id: agent.id,
                    name: agent.name,
                    provider: agent.provider,
                    cash: state.cash,
                    inventory: state.inventory,
                    isYou: agent.id === this.agentId,
                };
            }));
            return {
                success: true,
                message: `Retrieved states for ${agentStates.length} agents`,
                data: {
                    agents: agentStates,
                    totalAgents: agentStates.length,
                    timestamp: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            console.error('Error fetching agent states:', error);
            return {
                success: false,
                message: `Error fetching agent states: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
}
//# sourceMappingURL=AgentTools.js.map