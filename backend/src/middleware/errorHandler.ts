import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/index.js';

/**
 * Global error handling middleware
 * Catches all errors and sends appropriate HTTP responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // ✅ ADD CORS HEADERS FIRST
  const origin = req.headers.origin as string | undefined;

  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // Default to 500 Internal Server Error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.message) {
    message = err.message;
  }

  if (!isOperational || statusCode >= 500) {
    console.error('Error:', {
      name: err.name,
      message: err.message,
      statusCode,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    console.warn(`${req.method} ${req.path} - ${statusCode}: ${message}`);
  }

  const response: any = { error: message };

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
/**
 * Middleware to catch async errors in route handlers
 * Wraps async functions to automatically catch rejected promises
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
