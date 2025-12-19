/**
 * Shared type definitions for the frontend
 * Centralizes all common interfaces to avoid duplication
 */

// Agent types
export interface Agent {
  id: string;
  name: string;
  provider: string;
  cash: number;
  inventory: Record<string, number>;
  tradesCompleted: number;
  tradesRequired: number;
}

export interface AgentBasic {
  id: string;
  name: string;
  provider: string;
}

// Session types
export interface Session {
  id: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'active' | 'completed';
}

// Proposal types
export interface Proposal {
  id: string;
  fromAgentName: string;
  toAgentName: string;
  goodName: string;
  quantity: number;
  price: number;
  explanation: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  createdAt: Date;
}

// Trade types
export interface Trade {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  fromAgentName: string;
  toAgentName: string;
  goodId: string;
  goodName: string;
  goodUnit: string;
  quantity: number;
  price: number;
  settledAt: string;
}

// Good types
export interface Good {
  id: string;
  name: string;
  unit: string;
  referencePrice: number;
}

// Leaderboard types
export interface LeaderboardEntry {
  agentId: string;
  agentName: string;
  provider: string;
  totalWealth: number;
  averageWealth: number;
  sessionsPlayed: number;
  wins: number;
  totalTrades: number;
}

export interface SessionLeaderboardEntry {
  agentId: string;
  agentName: string;
  provider: string;
  totalWealth: number;
  tradesCompleted: number;
  rank?: number;
}

// Chart data types
export interface AgentPerformance {
  sessionDate: string;
  [agentName: string]: number | string | null;
}

export interface TradeVolume {
  good: string;
  count: number;
}

export interface WinDistribution {
  agentName: string;
  wins: number;
  [key: string]: string | number;
}

export interface TradingActivity {
  time: string;
  trades: number;
}

// Comparison types
export interface ComparisonData {
  agent: AgentBasic;
  currentSession: {
    cash: number;
    inventory: Record<string, number>;
    tradesCompleted: number;
    tradesRequired: number;
    wealth: number;
  } | null;
  allTimeStats: {
    totalWealth: number;
    averageWealth: number;
    sessionsPlayed: number;
    wins: number;
    totalTrades: number;
    winRate: number;
  };
  headToHead: Record<string, {
    tradesWithAgent: number;
    totalValueSent: number;
    totalValueReceived: number;
    netProfit: number;
  }>;
}

// WebSocket event types
export type SessionStatus = 'waiting' | 'active' | 'completed';

export interface WSCountdownTickPayload {
  secondsRemaining: number;
}

export interface WSSessionStatusPayload {
  status: 'active' | 'completed';
  sessionId: string;
}

export interface WSRoundStartPayload {
  roundNumber: number;
  sessionId: string;
}

export interface WSProposalCreatedPayload {
  id: string;
  roundId: string;
  fromAgentId: string;
  toAgentId: string;
  goodId: string;
  quantity: number;
  price: number;
  explanation: string;
  status: string;
  createdAt: Date;
}

export interface WSTradeExecutedPayload {
  id: string;
  proposalId: string;
  sessionId: string;
  fromAgentId: string;
  toAgentId: string;
  goodId: string;
  quantity: number;
  price: number;
  settledAt: Date;
}

export interface WSAgentStateUpdatePayload {
  agentId: string;
  state: {
    cash: number;
    inventory: Record<string, number>;
    tradesCompleted: number;
    tradesRequired: number;
  };
}
