import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Zod Validation Error
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  // Known AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {})
    });
    return;
  }

  // HTTP errors (e.g. body-parser SyntaxError)
  const httpStatus = (err as any).statusCode || (err as any).status;
  if (httpStatus && typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500) {
    res.status(httpStatus).json({
      error: err.message || 'Bad request'
    });
    return;
  }

  // Default Internal Error
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' ? { message: err.message, stack: err.stack } : {})
  });
};
