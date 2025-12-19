import { db, schema } from '../db/index.js';
import { eq, and, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { WebSocketServer } from './WebSocketServer.js';
import { TRADING_CONFIG } from '../config/trading.config.js';
import { INITIAL_CASH, INITIAL_INVENTORY } from '../config/economy.config.js';
import { TRADING_BONUS_PERCENTAGE } from '../constants/index.js';

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

export class TradingService {
  private wsServer: WebSocketServer | null = null;

  constructor(wsServer?: WebSocketServer) {
    this.wsServer = wsServer || null;
  }
  async createProposal(params: CreateProposalParams): Promise<string> {
    // Validate: agent cannot propose to itself
    if (params.fromAgentId === params.toAgentId) {
      throw new Error('Agent cannot make a proposal to itself');
    }

    const proposalId = randomUUID();
    const createdAt = new Date();

    await db.insert(schema.proposals).values({
      id: proposalId,
      roundId: params.roundId,
      fromAgentId: params.fromAgentId,
      toAgentId: params.toAgentId,
      goodId: params.goodId,
      quantity: params.quantity,
      price: params.price,
      explanation: params.explanation,
      status: 'pending',
      createdAt,
    });

    // Broadcast proposal created event
    if (this.wsServer) {
      const fromAgent = await db.query.agents.findFirst({
        where: eq(schema.agents.id, params.fromAgentId),
      });
      const toAgent = await db.query.agents.findFirst({
        where: eq(schema.agents.id, params.toAgentId),
      });
      const good = await db.query.goods.findFirst({
        where: eq(schema.goods.id, params.goodId),
      });

      this.wsServer.broadcastProposalCreated({
        id: proposalId,
        fromAgentName: fromAgent?.name || 'Unknown',
        toAgentName: toAgent?.name || 'Unknown',
        goodName: good?.name || 'Unknown',
        quantity: params.quantity,
        price: params.price,
        explanation: params.explanation,
        status: 'pending',
        createdAt,
      });
    }

    return proposalId;
  }

  async acceptProposal(proposalId: string): Promise<void> {
    await db
      .update(schema.proposals)
      .set({ status: 'accepted' })
      .where(eq(schema.proposals.id, proposalId));
  }

  async rejectProposal(proposalId: string): Promise<void> {
    await db
      .update(schema.proposals)
      .set({ status: 'rejected' })
      .where(eq(schema.proposals.id, proposalId));
  }

  async counterProposal(
    originalProposalId: string,
    newProposal: CreateProposalParams
  ): Promise<string> {
    // Mark original as countered
    await db
      .update(schema.proposals)
      .set({ status: 'countered' })
      .where(eq(schema.proposals.id, originalProposalId));

    // Create new counter proposal
    return this.createProposal(newProposal);
  }

  async settleTrade(params: SettleTradeParams): Promise<void> {
    const { proposalId, sessionId } = params;

    // Get proposal details
    const proposal = await db.query.proposals.findFirst({
      where: eq(schema.proposals.id, proposalId),
    });

    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (proposal.status !== 'accepted') {
      throw new Error(`Proposal ${proposalId} is not accepted`);
    }

    // Atomic transaction for settlement
    // 1. Get current inventories
    const fromAgentInventory = await this.getAgentInventory(
      sessionId,
      proposal.fromAgentId,
      proposal.goodId
    );

    const toAgentInventory = await this.getAgentInventory(
      sessionId,
      proposal.toAgentId,
      proposal.goodId
    );

    // 2. Validate sufficient resources
    if (fromAgentInventory.quantity < proposal.quantity) {
      throw new Error(
        `Agent ${proposal.fromAgentId} has insufficient ${proposal.goodId}`
      );
    }

    if (toAgentInventory.cashBalance < proposal.price) {
      throw new Error(
        `Agent ${proposal.toAgentId} has insufficient cash`
      );
    }

    // 3. Update inventories atomically
    // Calculate new cash balances
    const newFromAgentCash = fromAgentInventory.cashBalance + proposal.price;
    const newToAgentCash = toAgentInventory.cashBalance - proposal.price;

    // Calculate trading bonus for buyer (incentivizes acceptance)
    const bonusQuantity = proposal.quantity * TRADING_BONUS_PERCENTAGE;
    const totalQuantityToReceive = proposal.quantity + bonusQuantity;

    // From agent: loses goods (only the original quantity, not the bonus)
    await db
      .update(schema.inventories)
      .set({
        quantity: fromAgentInventory.quantity - proposal.quantity,
      })
      .where(
        and(
          eq(schema.inventories.sessionId, sessionId),
          eq(schema.inventories.agentId, proposal.fromAgentId),
          eq(schema.inventories.goodId, proposal.goodId)
        )
      );

    // From agent: gains cash (update ALL inventory rows for this agent)
    await db
      .update(schema.inventories)
      .set({
        cashBalance: newFromAgentCash,
      })
      .where(
        and(
          eq(schema.inventories.sessionId, sessionId),
          eq(schema.inventories.agentId, proposal.fromAgentId)
        )
      );

    // To agent: gains goods with 5% bonus
    await db
      .update(schema.inventories)
      .set({
        quantity: toAgentInventory.quantity + totalQuantityToReceive,
      })
      .where(
        and(
          eq(schema.inventories.sessionId, sessionId),
          eq(schema.inventories.agentId, proposal.toAgentId),
          eq(schema.inventories.goodId, proposal.goodId)
        )
      );

    // To agent: loses cash (update ALL inventory rows for this agent)
    await db
      .update(schema.inventories)
      .set({
        cashBalance: newToAgentCash,
      })
      .where(
        and(
          eq(schema.inventories.sessionId, sessionId),
          eq(schema.inventories.agentId, proposal.toAgentId)
        )
      );

    // 4. Record trade
    const tradeId = randomUUID();
    await db.insert(schema.trades).values({
      id: tradeId,
      proposalId,
      sessionId,
      fromAgentId: proposal.fromAgentId,
      toAgentId: proposal.toAgentId,
      goodId: proposal.goodId,
      quantity: proposal.quantity,
      price: proposal.price,
    });

    console.log(`💰 Trade settled: ${proposal.quantity} + ${bonusQuantity.toFixed(2)} bonus (total: ${totalQuantityToReceive.toFixed(2)}) for ₹${proposal.price}`);

    // Broadcast trade executed event
    if (this.wsServer) {
      const fromAgent = await db.query.agents.findFirst({
        where: eq(schema.agents.id, proposal.fromAgentId),
      });
      const toAgent = await db.query.agents.findFirst({
        where: eq(schema.agents.id, proposal.toAgentId),
      });
      const good = await db.query.goods.findFirst({
        where: eq(schema.goods.id, proposal.goodId),
      });

      this.wsServer.broadcastTradeExecuted({
        id: tradeId,
        fromAgentName: fromAgent?.name || 'Unknown',
        toAgentName: toAgent?.name || 'Unknown',
        goodName: good?.name || 'Unknown',
        quantity: proposal.quantity,
        price: proposal.price,
      });

      // Broadcast agent state updates for both agents
      const fromAgentState = await this.getAgentState(sessionId, proposal.fromAgentId);
      this.wsServer.broadcastAgentStateUpdate(proposal.fromAgentId, fromAgentState);

      const toAgentState = await this.getAgentState(sessionId, proposal.toAgentId);
      this.wsServer.broadcastAgentStateUpdate(proposal.toAgentId, toAgentState);
    }
  }

  async getAgentInventory(
    sessionId: string,
    agentId: string,
    goodId: string
  ): Promise<{ quantity: number; cashBalance: number }> {
    const inventory = await db.query.inventories.findFirst({
      where: and(
        eq(schema.inventories.sessionId, sessionId),
        eq(schema.inventories.agentId, agentId),
        eq(schema.inventories.goodId, goodId)
      ),
    });

    if (!inventory) {
      return { quantity: 0, cashBalance: 0 };
    }

    return {
      quantity: inventory.quantity,
      cashBalance: inventory.cashBalance,
    };
  }

  async getAgentState(sessionId: string, agentId: string): Promise<{
    cash: number;
    inventory: Record<string, number>;
    tradesCompleted: number;
    tradesRequired: number;
  }> {
    // Get all inventories for agent
    const inventories = await db.query.inventories.findMany({
      where: and(
        eq(schema.inventories.sessionId, sessionId),
        eq(schema.inventories.agentId, agentId)
      ),
    });

    // Get goods info
    const goods = await db.query.goods.findMany();
    const goodsMap = new Map(goods.map((g) => [g.id, g.name]));

    // Build inventory map
    const inventoryMap: Record<string, number> = {};
    let cash = 0;

    for (const inv of inventories) {
      const goodName = goodsMap.get(inv.goodId) || inv.goodId;
      inventoryMap[goodName] = inv.quantity;
      cash = inv.cashBalance; // All records should have same cash balance
    }

    // Count completed trades (as both buyer and seller)
    const trades = await db.query.trades.findMany({
      where: and(
        eq(schema.trades.sessionId, sessionId),
        or(
          eq(schema.trades.fromAgentId, agentId),  // Trades where agent is seller
          eq(schema.trades.toAgentId, agentId)     // Trades where agent is buyer
        )
      ),
    });

    return {
      cash,
      inventory: inventoryMap,
      tradesCompleted: trades.length,
      tradesRequired: TRADING_CONFIG.minTradesPerDay,
    };
  }

  async getPendingProposals(agentId: string, roundId: string) {
    const proposals = await db.query.proposals.findMany({
      where: and(
        eq(schema.proposals.toAgentId, agentId),
        eq(schema.proposals.roundId, roundId),
        eq(schema.proposals.status, 'pending')
      ),
    });

    // Get agent and good info
    const result = [];
    for (const proposal of proposals) {
      const fromAgent = await db.query.agents.findFirst({
        where: eq(schema.agents.id, proposal.fromAgentId),
      });

      const good = await db.query.goods.findFirst({
        where: eq(schema.goods.id, proposal.goodId),
      });

      result.push({
        id: proposal.id,
        fromAgent: proposal.fromAgentId,
        fromAgentName: fromAgent?.name || 'Unknown',
        good: good?.name || 'Unknown',
        quantity: proposal.quantity,
        price: proposal.price,
        explanation: proposal.explanation,
      });
    }

    return result;
  }

  async initializeSessionInventories(sessionId: string) {
    const agents = await db.query.agents.findMany();
    const goods = await db.query.goods.findMany();

    // Single uniform profile for all agents
    const uniformProfile = {
      cash: INITIAL_CASH,
    };

    // Initialize all agents with the same inventory
    for (const agent of agents) {
      for (const good of goods) {
        // Get quantity from INITIAL_INVENTORY config
        const quantity = INITIAL_INVENTORY[good.name as keyof typeof INITIAL_INVENTORY] || 0;

        await db.insert(schema.inventories).values({
          id: randomUUID(),
          sessionId,
          agentId: agent.id,
          goodId: good.id,
          quantity,
          cashBalance: uniformProfile.cash,
        });
      }

      console.log(`Agent ${agent.name} initialized with uniform profile`);
    }

    console.log(`Initialized inventories for session ${sessionId}`);
  }
}
