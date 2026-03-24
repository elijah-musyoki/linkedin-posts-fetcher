// Application constants

// Default configuration values
export const DEFAULT_BATCH_SIZE = 50;
export const DEFAULT_MONTHS = 6;
export const DEFAULT_OUTPUT_DIR = './output';

// Timing constants (in milliseconds)
export const BATCH_DELAY_MS = 1000;
export const RATE_LIMIT_DELAY_MS = 30000;

// Environment variable names
export const ENV = {
  LI_AT: 'LINKEDIN_LI_AT',
  JSESSIONID: 'LINKEDIN_JSESSIONID',
  PROFILE_IDENTIFIER: 'PROFILE_IDENTIFIER',
  MONTHS_TO_FETCH: 'MONTHS_TO_FETCH',
  LOG_LEVEL: 'LOG_LEVEL',
  NODE_ENV: 'NODE_ENV',
} as const;
