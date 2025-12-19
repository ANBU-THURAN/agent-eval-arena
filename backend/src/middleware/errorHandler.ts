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
  // Default to 500 Internal Server Error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // If it's our custom AppError, use its properties
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === 'ValidationError') {
    // Handle other validation errors
    statusCode = 400;
    message = err.message;
  } else if (err.message) {
    // Use the error message if available
    message = err.message;
  }

  // Log error details (in production, use a proper logger like Winston)
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
    // Operational errors (4xx) - less verbose logging
    console.warn(`${req.method} ${req.path} - ${statusCode}: ${message}`);
  }

  // Send error response
  const response: any = {
    error: message,
  };

  // Include stack trace in development mode
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
