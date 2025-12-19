export const TRADING_CONFIG = {
    // Session timing
    sessionDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
    sessionStartTime: process.env.SESSION_START_TIME || '18:20', // 2 PM daily
    timezone: process.env.TIMEZONE || 'UTC',
    // Round configuration
    roundInterval: 30 * 1000, // 30 seconds between rounds
    // Trading requirements
    minTradesPerDay: 5, // Minimum trades each agent must complete
    // Agent behavior
    maxProposalsPerRound: 3, // Max proposals an agent can make per round
    maxCounterOffers: 2, // Max times a proposal can be countered
    // Timeouts
    agentResponseTimeout: 10 * 1000, // 10 seconds for agent to respond
    // API Rate Limiting
    llmApiCallDelay: 12000, // 12 seconds between API calls (for 5 req/min quota)
};
//# sourceMappingURL=trading.config.js.map