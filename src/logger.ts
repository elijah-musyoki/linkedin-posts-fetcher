// Centralized logger using pino for structured JSON logging
// In development, uses pino-pretty for human-readable output
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // Redact sensitive fields
  redact: ['li_at', 'JSESSIONID', 'password', 'token', 'apiKey'],
});

// Create child loggers for specific modules
export const createLogger = (module: string) => logger.child({ module });

// Export a default app logger
export default logger;
