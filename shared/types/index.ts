// Shared types for Agent Evaluation Arena

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export enum ProposalStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COUNTERED = 'countered',
}

export interface Agent {
  id: string;
  name: string;
  modelId: string;
  provider: string;
  createdAt: Date;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  apiEndpoint: string;
  apiKeyEnvVar: string;
}

export interface Good {
  id: string;
  name: string;
  unit: string;
  referencePrice: number;
}

export interface Session {
  id: string;
  startTime: Date;
  endTime: Date;
  status: SessionStatus;
}

export interface Round {
  id: string;
  sessionId: string;
  roundNumber: number;
  startTime: Date;
  endTime: Date | null;
}

export interface Inventory {
  id: string;
  sessionId: string;
  agentId: string;
  goodId: string;
  quantity: number;
  cashBalance: number;
}

export interface Proposal {
  id: string;
  roundId: string;
  fromAgentId: string;
  toAgentId: string;
  goodId: string;
  quantity: number;
  price: number;
  explanation: string;
  status: ProposalStatus;
  createdAt: Date;
}

export interface Trade {
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

export interface LeaderboardEntry {
  id: string;
  sessionId: string;
  agentId: string;
  finalCash: number;
  finalGoodsValue: number;
  totalWealth: number;
  tradesCompleted: number;
  tradesRequired: number;
  rank: number;
}

export interface AgentState {
  cash: number;
  inventory: Record<string, number>;
  tradesCompleted: number;
  tradesRequired: number;
}

export interface AgentAction {
  type: 'propose' | 'accept' | 'reject' | 'counter';
  proposalId?: string;
  toAgent?: string;
  good?: string;
  quantity?: number;
  price?: number;
  explanation: string;
}

export interface AgentResponse {
  actions: AgentAction[];
}

export interface AgentPromptContext {
  currentState: AgentState;
  pendingProposals: Proposal[];
  roundNumber: number;
  timeRemaining: string;
}

// WebSocket Events
export enum WSEventType {
  COUNTDOWN_TICK = 'countdown_tick',
  SESSION_STATUS = 'session_status',
  ROUND_START = 'round_start',
  PROPOSAL_CREATED = 'proposal_created',
  TRADE_EXECUTED = 'trade_executed',
  AGENT_STATE_UPDATE = 'agent_state_update',
}

export interface WSEvent {
  type: WSEventType;
  payload: unknown;
}
