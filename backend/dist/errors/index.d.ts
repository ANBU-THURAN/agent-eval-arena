/**
 * Custom error classes for the application
 * Provides typed errors with HTTP status codes
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class NotFoundError extends AppError {
    constructor(message: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class InternalServerError extends AppError {
    constructor(message: string);
}
export declare class ExternalServiceError extends AppError {
    constructor(message: string);
}
//# sourceMappingURL=index.d.ts.map