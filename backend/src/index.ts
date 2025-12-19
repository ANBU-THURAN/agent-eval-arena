import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.js';
import { WebSocketServer } from './services/WebSocketServer.js';
import { SessionScheduler } from './services/SessionScheduler.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Initialize services
const sessionScheduler = new SessionScheduler(wsServer);
wsServer.setSessionScheduler(sessionScheduler);

// Expose SessionScheduler to routes
app.set('sessionScheduler', sessionScheduler);

// API routes
app.use('/api', apiRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start session scheduler
sessionScheduler.start();

// Start server
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║   Agent Evaluation Arena - Backend Server        ║
  ╚═══════════════════════════════════════════════════╝

  🚀 Server running on http://localhost:${PORT}
  📡 WebSocket server listening on ws://localhost:${PORT}/ws
  🔄 Session scheduler active

  API Endpoints:
  - GET  /api/sessions
  - GET  /api/sessions/:id
  - GET  /api/sessions/current
  - GET  /api/agents
  - GET  /api/leaderboard/daily/:sessionId
  - GET  /api/leaderboard/alltime
  - GET  /api/trades/:sessionId
  - GET  /api/proposals/:sessionId
  - GET  /api/logs/:sessionId

  WebSocket Events:
  - countdown_tick
  - session_status
  - round_start
  - proposal_created
  - trade_executed
  - agent_state_update
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
