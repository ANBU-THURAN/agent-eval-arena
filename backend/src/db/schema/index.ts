import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Models Table
export const models = sqliteTable('models', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider: text('provider').notNull(), // openai, anthropic, local, etc.
  apiEndpoint: text('api_endpoint').notNull(),
  apiKeyEnvVar: text('api_key_env_var').notNull(),
});

// Agents Table
export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  modelId: text('model_id')
    .notNull()
    .references(() => models.id),
  provider: text('provider').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Goods Table
export const goods = sqliteTable('goods', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  unit: text('unit').notNull(),
  referencePrice: real('reference_price').notNull(),
});

// Sessions Table
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('scheduled'), // scheduled, active, completed
});

// Rounds Table
export const rounds = sqliteTable('rounds', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id),
  roundNumber: integer('round_number').notNull(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
});

// Inventories Table
export const inventories = sqliteTable('inventories', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id),
  agentId: text('agent_id')
    .notNull()
    .references(() => agents.id),
  goodId: text('good_id')
    .notNull()
    .references(() => goods.id),
  quantity: real('quantity').notNull(),
  cashBalance: real('cash_balance').notNull(),
});

// Proposals Table
export const proposals = sqliteTable('proposals', {
  id: text('id').primaryKey(),
  roundId: text('round_id')
    .notNull()
    .references(() => rounds.id),
  fromAgentId: text('from_agent_id')
    .notNull()
    .references(() => agents.id),
  toAgentId: text('to_agent_id')
    .notNull()
    .references(() => agents.id),
  goodId: text('good_id')
    .notNull()
    .references(() => goods.id),
  quantity: real('quantity').notNull(),
  price: real('price').notNull(),
  explanation: text('explanation').notNull(),
  status: text('status').notNull().default('pending'), // pending, accepted, rejected, countered
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Trades Table
export const trades = sqliteTable('trades', {
  id: text('id').primaryKey(),
  proposalId: text('proposal_id')
    .notNull()
    .references(() => proposals.id),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id),
  fromAgentId: text('from_agent_id')
    .notNull()
    .references(() => agents.id),
  toAgentId: text('to_agent_id')
    .notNull()
    .references(() => agents.id),
  goodId: text('good_id')
    .notNull()
    .references(() => goods.id),
  quantity: real('quantity').notNull(),
  price: real('price').notNull(),
  settledAt: integer('settled_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Logs Table
export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id),
  roundId: text('round_id').references(() => rounds.id),
  agentId: text('agent_id').references(() => agents.id),
  logType: text('log_type').notNull(), // agent_action, system_event, error, etc.
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Leaderboard Table
export const leaderboard = sqliteTable('leaderboard', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id),
  agentId: text('agent_id')
    .notNull()
    .references(() => agents.id),
  finalCash: real('final_cash').notNull(),
  finalGoodsValue: real('final_goods_value').notNull(),
  totalWealth: real('total_wealth').notNull(),
  tradesCompleted: integer('trades_completed').notNull(),
  tradesRequired: integer('trades_required').notNull(),
  rank: integer('rank').notNull(),
});

// Export all tables
export const schema = {
  models,
  agents,
  goods,
  sessions,
  rounds,
  inventories,
  proposals,
  trades,
  logs,
  leaderboard,
};
