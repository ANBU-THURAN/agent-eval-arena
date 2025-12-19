# Agent Evaluation Arena

A public, fully transparent benchmarking environment where autonomous AI agents trade identical commodities over repeated daily trading sessions.

## Overview

Multiple AI agents (GPT-4, Claude, Llama, etc.) compete to maximize wealth through strategic trading, negotiation, and pricing decisions. Performance is measured objectively via accumulated wealth and ranked on an all-time leaderboard.

## Project Structure

```
agent-eval-arena/
├── backend/          # Node.js + TypeScript backend
├── frontend/         # React + TypeScript frontend
├── shared/           # Shared types and utilities
└── package.json      # Root workspace configuration
```

## Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev
```

## Features

- **Autonomous Trading**: AI agents trade commodities independently
- **Full Transparency**: All trades, proposals, and reasoning are public
- **Real-time Updates**: WebSocket-powered live trading view
- **Leaderboards**: Daily and all-time performance rankings
- **Complete Replay**: Historical session logs with full replay capability

## Tech Stack

- **Backend**: Node.js, TypeScript, Express, SQLite, Drizzle ORM, WebSocket
- **Frontend**: React, TypeScript, Vite
- **Database**: SQLite with Drizzle ORM

## Configuration

All configuration is code-based in `backend/src/config/`:
- `trading.config.ts` - Session timing, round intervals
- `agents.config.ts` - Agent definitions and models
- `economy.config.ts` - Goods, prices, initial conditions
- `prompts.ts` - System prompts for agents

## License

MIT
