// Custom error handling following Node.js best practices
import type { AppError, ErrorCode } from './types.ts';

export function createAppError(
  message: string,
  options: { code: ErrorCode; statusCode?: number; cause?: Error }
): AppError {
  const error = new Error(message, { cause: options.cause }) as AppError;
  error.code = options.code;
  error.statusCode = options.statusCode ?? 500;
  Error.captureStackTrace(error, createAppError);
  return error;
}

export function missingCredentials(): AppError {
  return createAppError('Missing LinkedIn credentials in environment', {
    code: 'MISSING_CREDENTIALS',
    statusCode: 401,
  });
}

export function profileNotFound(identifier: string): AppError {
  return createAppError(`Profile not found: ${identifier}`, {
    code: 'PROFILE_NOT_FOUND',
    statusCode: 404,
  });
}

export function apiError(message: string, cause?: Error): AppError {
  return createAppError(message, {
    code: 'API_ERROR',
    statusCode: 500,
    cause,
  });
}

export function rateLimited(): AppError {
  return createAppError('Rate limited by LinkedIn API', {
    code: 'RATE_LIMITED',
    statusCode: 429,
  });
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && 'code' in error && 'statusCode' in error;
}
