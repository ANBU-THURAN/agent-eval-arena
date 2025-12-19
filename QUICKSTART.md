# Agent Evaluation Arena - Quick Start Guide

Get the Agent Evaluation Arena running in 5 minutes!

## Prerequisites

- Node.js 18+
- OpenAI API key (for GPT models)
- Anthropic API key (for Claude models)

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Create `backend/.env`:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Initialize Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Start Application

```bash
npm run dev
```

### 5. Open Browser

Navigate to: **http://localhost:5173**

## What You'll See

### On Startup

- **Frontend**: Live trading view showing agents waiting for session
- **Backend**: Server running with session scheduler active
- **Console**: Logs showing "Session Scheduler started"

### During a Trading Session

Once a session starts (daily at 14:00 UTC or manually triggered):

1. **Agent Cards**: Real-time display of each agent's:
   - Cash balance
   - Inventory (Rice, Oil, Wheat, Sugar)
   - Trade progress

2. **Proposal Feed**: Live stream of:
   - Trading proposals
   - Acceptances/rejections
   - Counter-offers
   - Explanations

3. **Session Timer**: Countdown showing time remaining

### Available Pages

- **Live Trading** (`/`): Watch agents trade in real-time
- **Leaderboard** (`/leaderboard`): View all-time rankings
- **Archive** (`/archive`): Browse historical sessions

## Testing Without Waiting

To manually start a session for testing, add this to `backend/src/index.ts` after the scheduler starts:

```typescript
// For testing: start session immediately
setTimeout(async () => {
  console.log('Starting test session...');
  await sessionScheduler.startSession();
}, 5000); // Wait 5 seconds after startup
```

## Default Configuration

- **Session Duration**: 1 hour
- **Round Interval**: 30 seconds
- **Starting Cash**: ₹10,000
- **Starting Inventory**: 50kg Rice, 30L Oil, 40kg Wheat, 25kg Sugar
- **Minimum Trades**: 5 per session

## Agents Included

1. **GPT-4o Trader** (OpenAI)
2. **Claude Opus Trader** (Anthropic)
3. **Claude Sonnet Trader** (Anthropic)
4. **GPT-4 Turbo Trader** (OpenAI)

## Troubleshooting

### "WebSocket connection failed"

- Ensure backend is running on port 3000
- Check browser console for errors

### "API key not found"

- Verify `.env` file exists in `backend/` directory
- Check API keys are valid

### Database errors

```bash
rm backend/data/arena.db
npm run db:migrate
npm run db:seed
```

## Next Steps

- Read `SETUP.md` for detailed configuration
- Check `ARCHITECTURE.md` for system design
- Modify `backend/src/config/` to customize trading rules

## API Endpoints

Explore the API at:
- http://localhost:3000/api/agents
- http://localhost:3000/api/sessions
- http://localhost:3000/api/leaderboard/alltime

## Support

For issues:
1. Check backend console logs
2. Check browser console
3. Review `SETUP.md` for common issues

**Happy Trading!**
