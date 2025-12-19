/**
 * Custom error classes for the application
 * Provides typed errors with HTTP status codes
 */
export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}
export class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}
export class UnauthorizedError extends AppError {
    constructor(message) {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}
export class ForbiddenError extends AppError {
    constructor(message) {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}
export class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
        this.name = 'ConflictError';
    }
}
export class InternalServerError extends AppError {
    constructor(message) {
        super(message, 500, false);
        this.name = 'InternalServerError';
    }
}
export class ExternalServiceError extends AppError {
    constructor(message) {
        super(message, 502);
        this.name = 'ExternalServiceError';
    }
}
//# sourceMappingURL=index.js.map