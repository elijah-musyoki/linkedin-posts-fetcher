// Typed environment variable parsing
import { ENV } from './constants.ts';

function parseIntEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseStringEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export interface EnvConfig {
  // Credentials
  liAt: string;
  jsessionId: string;
  
  // Fetch options
  profileIdentifier: string;
  monthsToFetch: number;
  
  // Rate limiting
  batchDelayMs: number;
  jitterPercent: number;
  rateLimitInitialDelayMs: number;
  rateLimitMaxDelayMs: number;
  maxRetries: number;
  
  // Logging
  logLevel: string;
  logDir: string;
  logFile: string;
  
  // Output
  outputDir: string;
  batchSize: number;
}

export function getEnvConfig(): EnvConfig {
  const liAt = process.env[ENV.LI_AT];
  const jsessionId = process.env[ENV.JSESSIONID];
  
  if (!liAt || !jsessionId) {
    throw new Error(`Missing required environment variables: ${ENV.LI_AT} and ${ENV.JSESSIONID}`);
  }
  
  return {
    liAt,
    jsessionId,
    profileIdentifier: parseStringEnv(ENV.PROFILE_IDENTIFIER, 'yolandyan'),
    monthsToFetch: parseIntEnv(ENV.MONTHS_TO_FETCH, 6),
    batchDelayMs: parseIntEnv('BATCH_DELAY_MS', 1000),
    jitterPercent: parseIntEnv('JITTER_PERCENT', 30),
    rateLimitInitialDelayMs: parseIntEnv('RATE_LIMIT_INITIAL_DELAY_MS', 2000),
    rateLimitMaxDelayMs: parseIntEnv('RATE_LIMIT_MAX_DELAY_MS', 120000),
    maxRetries: parseIntEnv('MAX_RETRIES', 5),
    logLevel: parseStringEnv('LOG_LEVEL', 'info'),
    logDir: parseStringEnv('LOG_DIR', 'logs'),
    logFile: parseStringEnv('LOG_FILE', 'fetcher.log'),
    outputDir: parseStringEnv('OUTPUT_DIR', 'output'),
    batchSize: parseIntEnv('BATCH_SIZE', 50),
  };
}

export function validateCredentials(): { liAt: string; jsessionId: string } {
  const liAt = process.env[ENV.LI_AT];
  const jsessionId = process.env[ENV.JSESSIONID];
  
  if (!liAt || !jsessionId) {
    throw new Error(`Missing LinkedIn credentials. Set ${ENV.LI_AT} and ${ENV.JSESSIONID} environment variables.`);
  }
  
  return { liAt, jsessionId };
}
