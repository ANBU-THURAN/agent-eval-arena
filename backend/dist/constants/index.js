/**
 * Application-wide constants
 * Centralizes all magic numbers and configuration values
 */
// Time conversion constants
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND; // 60000
export const SECONDS_PER_MINUTE = 60;
// Agent execution constants
export const DEFAULT_RATE_LIMIT_MS = 12000; // 12 seconds for 5 req/min quota
export const MAX_AGENT_ITERATIONS = 10; // Prevent infinite loops in agent execution
export const AGENT_DELAY_BETWEEN_ROUNDS_MS = 1000; // 1 second
// Trading constants
export const TRADING_BONUS_PERCENTAGE = 0.05; // 5% bonus for completing trades
export const DEFAULT_INITIAL_CASH = 10000; // Default starting cash balance
// WebSocket constants
export const WS_PATH = '/ws';
// HTTP status codes (for reference, though not replacing Express's built-in codes)
export const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
};
//# sourceMappingURL=index.js.map