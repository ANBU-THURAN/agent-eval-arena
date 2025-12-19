# Agent Evaluation Arena - Setup Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key (for GPT models)
- Anthropic API key (for Claude models)

## Installation

### 1. Clone and Install Dependencies

```bash
cd agent-eval-arena
npm install
```

This will install dependencies for all workspaces (backend, frontend, shared).

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
DATABASE_PATH=./data/arena.db
PORT=3000
NODE_ENV=development
SESSION_START_TIME=14:00
TIMEZONE=UTC
```

### 3. Setup Database

Generate migrations and initialize the database:

```bash
# From root directory
npm run db:generate
npm run db:migrate
npm run db:seed
```

This will:
- Generate Drizzle migrations from schema
- Create SQLite database at `backend/data/arena.db`
- Seed initial data (agents, models, goods)

### 4. Start Development Servers

```bash
# From root directory
npm run dev
```

This starts both:
- Backend server at `http://localhost:3000`
- Frontend dev server at `http://localhost:5173`

## Accessing the Application

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **WebSocket**: ws://localhost:3000/ws
- **Health Check**: http://localhost:3000/health

## Project Structure

```
agent-eval-arena/
├── backend/
│   ├── src/
│   │   ├── config/          # Trading, agents, economy configs
│   │   ├── db/              # Database schema and migrations
│   │   ├── routes/          # REST API endpoints
│   │   ├── services/        # Core business logic
│   │   └── index.ts         # Server entry point
│   ├── drizzle/             # Generated migrations
│   ├── data/                # SQLite database file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page views
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   └── package.json
├── shared/
│   └── types/               # Shared TypeScript types
└── package.json             # Root workspace config
```

## Configuration

### Trading Configuration

Edit `backend/src/config/trading.config.ts`:

```typescript
export const TRADING_CONFIG = {
  sessionDuration: 60 * 60 * 1000,  // 1 hour
  roundInterval: 30 * 1000,          // 30 seconds
  minTradesPerDay: 5,                // Minimum trades required
  sessionStartTime: '14:00',         // Daily start time
  timezone: 'UTC',
};
```

### Agent Configuration

Edit `backend/src/config/agents.config.ts` to add/modify agents:

```typescript
export const AGENTS = [
  {
    id: 'agent-gpt4o-1',
    name: 'GPT-4o Trader',
    modelId: 'model-gpt4o',
    provider: 'openai',
  },
  // Add more agents...
];
```

### Economy Configuration

Edit `backend/src/config/economy.config.ts`:

```typescript
export const GOODS = [
  { id: 'good-rice', name: 'Rice', unit: 'kg', referencePrice: 100 },
  // Add more goods...
];

export const INITIAL_CASH = 10000;
export const INITIAL_INVENTORY = { Rice: 50, Oil: 30, Wheat: 40, Sugar: 25 };
```

## Running in Production

### Build

```bash
npm run build
```

This builds both backend and frontend for production.

### Start Production Server

```bash
cd backend
npm start
```

For frontend, serve the built files from `frontend/dist` using a static file server like nginx or serve:

```bash
npx serve -s frontend/dist -p 5173
```

## Troubleshooting

### Database Issues

If you encounter database errors:

```bash
# Reset database
rm backend/data/arena.db
npm run db:migrate
npm run db:seed
```

### Port Conflicts

If ports 3000 or 5173 are in use:

- Change `PORT` in `backend/.env`
- Change `server.port` in `frontend/vite.config.ts`

### WebSocket Connection Failed

Ensure:
- Backend server is running
- No firewall blocking WebSocket connections
- Correct WebSocket URL in `frontend/src/pages/LiveTradingView.tsx`

## Testing a Manual Session

To manually trigger a trading session for testing:

1. Start the backend server
2. Use curl or API client to create a session:

```bash
curl -X POST http://localhost:3000/api/sessions/start
```

Or modify `SessionScheduler.ts` to start a session immediately on startup.

## Support

For issues or questions:
- Check logs in backend console
- Inspect browser console for frontend errors
- Review API responses at http://localhost:3000/api/*
