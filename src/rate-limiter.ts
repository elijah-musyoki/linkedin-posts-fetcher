// Rate limiting utilities with exponential backoff and jitter
import { createLogger } from './logger.ts';
import {
  BATCH_DELAY_MS,
  JITTER_PERCENT,
  RATE_LIMIT_INITIAL_DELAY_MS,
  RATE_LIMIT_MAX_DELAY_MS,
  MAX_RETRIES,
  API_TIMEOUT_MS,
} from './constants.ts';

const log = createLogger('rate-limiter');

// Rate limit indicators for O(1) lookup
const RATE_LIMIT_INDICATORS = new Set([
  '429',
  'rate limit',
  'rate exceeded',
  'too many requests',
  'throttl',
  'blocked',
  'captcha',
  'challenge',
]);

// Timeout indicators
const TIMEOUT_INDICATORS = new Set([
  'etimedout',
  'econnrefused',
  'econnreset',
  'socket hang up',
  'timeout',
  'timed out',
  'network error',
]);

/**
 * Add random jitter to a delay (0-JITTER_PERCENT%)
 * Helps avoid detection patterns
 */
export function addJitter(baseMs: number): number {
  const jitterAmount = baseMs * (Math.random() * JITTER_PERCENT / 100);
  return Math.floor(baseMs + jitterAmount);
}

/**
 * Calculate exponential backoff delay
 * Doubles each retry, capped at RATE_LIMIT_MAX_DELAY_MS
 */
export function getExponentialDelay(attempt: number): number {
  const delay = Math.min(
    RATE_LIMIT_INITIAL_DELAY_MS * Math.pow(2, attempt),
    RATE_LIMIT_MAX_DELAY_MS
  );
  return addJitter(delay);
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait before next batch with jitter
 */
export async function waitBetweenBatches(): Promise<void> {
  const delay = addJitter(BATCH_DELAY_MS);
  log.debug({ delayMs: delay, baseMs: BATCH_DELAY_MS, jitterPercent: JITTER_PERCENT }, 'Waiting before next batch');
  await sleep(delay);
}

/**
 * Check if an error indicates rate limiting
 * Uses Set for O(1) lookup
 */
export function isRateLimited(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  for (const indicator of RATE_LIMIT_INDICATORS) {
    if (lowerMessage.includes(indicator)) return true;
  }
  return false;
}

/**
 * Check if an error indicates a timeout
 */
export function isTimeout(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  for (const indicator of TIMEOUT_INDICATORS) {
    if (lowerMessage.includes(indicator)) return true;
  }
  return false;
}

/**
 * Execute a function with retry logic and exponential backoff
 * Returns the result or throws after MAX_RETRIES
 * 
 * Note: Timeout is handled by the axios instance (apiInstance.defaults.timeout)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  context: { batch?: number; operation?: string } = {}
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const message = lastError.message;
      
      // Check if it's a timeout
      if (isTimeout(message)) {
        const delay = getExponentialDelay(attempt);
        log.warn(
          { 
            attempt: attempt + 1, 
            maxRetries: MAX_RETRIES,
            waitMs: delay,
            timeoutMs: API_TIMEOUT_MS,
            ...context 
          },
          'Request timed out, retrying'
        );
        
        if (attempt < MAX_RETRIES - 1) {
          await sleep(delay);
          continue;
        }
      }
      
      // Check if rate limited
      if (isRateLimited(message)) {
        const delay = getExponentialDelay(attempt);
        log.warn(
          { 
            attempt: attempt + 1, 
            maxRetries: MAX_RETRIES,
            waitMs: delay,
            ...context 
          },
          'Rate limited, backing off'
        );
        
        if (attempt < MAX_RETRIES - 1) {
          await sleep(delay);
          continue;
        }
      }
      
      // Non-retryable error or max retries reached
      throw lastError;
    }
  }
  
  throw lastError;
}
