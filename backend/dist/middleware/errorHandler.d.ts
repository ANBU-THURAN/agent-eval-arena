import { Request, Response, NextFunction } from 'express';
/**
 * Global error handling middleware
 * Catches all errors and sends appropriate HTTP responses
 */
export declare function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to catch async errors in route handlers
 * Wraps async functions to automatically catch rejected promises
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map