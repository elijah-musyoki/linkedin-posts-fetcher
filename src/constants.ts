// Application constants and configuration
export const DEFAULT_BATCH_SIZE = 50;
export const DEFAULT_MONTHS = 6;
export const DEFAULT_OUTPUT_DIR = 'output';

// Rate limiting configuration
export const BATCH_DELAY_MS = parseInt(process.env.BATCH_DELAY_MS || '2000', 10);
export const JITTER_PERCENT = parseInt(process.env.JITTER_PERCENT || '50', 10);
export const RATE_LIMIT_INITIAL_DELAY_MS = parseInt(process.env.RATE_LIMIT_INITIAL_DELAY_MS || '2000', 10);
export const RATE_LIMIT_MAX_DELAY_MS = parseInt(process.env.RATE_LIMIT_MAX_DELAY_MS || '120000', 10);
export const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '5', 10);

// Timeout configuration
export const API_TIMEOUT_MS = parseInt(process.env.API_TIMEOUT_MS || '30000', 10); // 30s default

// Environment variable names
export const ENV = {
  LI_AT: 'LINKEDIN_LI_AT',
  JSESSIONID: 'LINKEDIN_JSESSIONID',
  PROFILE_IDENTIFIER: 'PROFILE_IDENTIFIER',
  MONTHS_TO_FETCH: 'MONTHS_TO_FETCH',
  LOG_LEVEL: 'LOG_LEVEL',
  LOG_DIR: 'LOG_DIR',
  LOG_FILE: 'LOG_FILE',
} as const;
