// Centralized logger using pino for structured JSON logging
// Writes to both file (JSON) and terminal (pretty output)
import pino from 'pino';
import fs from 'fs';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_FILE = process.env.LOG_FILE || 'fetcher.log';
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as pino.Level;

// Ensure log directory exists
const logPath = path.join(LOG_DIR, LOG_FILE);
fs.mkdirSync(LOG_DIR, { recursive: true });

// Create multistream: file (JSON) + terminal (pretty)
const isDevelopment = process.env.NODE_ENV !== 'production';
const isQuiet = process.env.QUIET === 'true';

const streams: pino.StreamEntry[] = [
  // File stream - always JSON
  { level: LOG_LEVEL, stream: fs.createWriteStream(logPath, { flags: 'a' }) },
];

// Terminal stream - pretty output in dev, skip if QUIET
if (!isQuiet) {
  if (isDevelopment) {
    streams.push({
      level: LOG_LEVEL,
      stream: pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }),
    });
  } else {
    streams.push({ level: LOG_LEVEL, stream: process.stdout });
  }
}

export const logger = pino(
  {
    level: LOG_LEVEL,
    // Redact sensitive fields
    redact: ['li_at', 'JSESSIONID', 'password', 'token', 'apiKey', '*.liAt', '*.jsessionId'],
  },
  pino.multistream(streams)
);

// Create child loggers for specific modules
export const createLogger = (module: string) => logger.child({ module });

// Export default app logger
export default logger;
