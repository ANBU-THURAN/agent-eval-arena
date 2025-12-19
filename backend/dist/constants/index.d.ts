/**
 * Application-wide constants
 * Centralizes all magic numbers and configuration values
 */
export declare const MS_PER_SECOND = 1000;
export declare const MS_PER_MINUTE: number;
export declare const SECONDS_PER_MINUTE = 60;
export declare const DEFAULT_RATE_LIMIT_MS = 12000;
export declare const MAX_AGENT_ITERATIONS = 10;
export declare const AGENT_DELAY_BETWEEN_ROUNDS_MS = 1000;
export declare const TRADING_BONUS_PERCENTAGE = 0.05;
export declare const DEFAULT_INITIAL_CASH = 10000;
export declare const WS_PATH = "/ws";
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
};
//# sourceMappingURL=index.d.ts.map