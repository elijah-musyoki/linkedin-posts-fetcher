// LinkedIn Posts Fetcher - Core library
import 'dotenv/config';
import { Client, getUserPosts, extractProfileIdLinkedin, apiInstance } from '@florydev/linkedin-api-voyager';
import type { LinkedInPost, FetchOptions, FetchResult } from './types.ts';
import { missingCredentials, profileNotFound } from './errors.ts';
import { createLogger } from './logger.ts';
import { getCutoffDate, isWithinDateRange, normalizePost } from './date-utils.ts';
import { saveOutputs } from './output.ts';
import { withRetry, waitBetweenBatches } from './rate-limiter.ts';
import { DEFAULT_BATCH_SIZE, DEFAULT_OUTPUT_DIR, ENV, API_TIMEOUT_MS } from './constants.ts';

const log = createLogger('fetcher');

function getCredentials(): { liAt: string; jsessionId: string } {
  const liAt = process.env[ENV.LI_AT];
  const jsessionId = process.env[ENV.JSESSIONID];

  if (!liAt || !jsessionId) {
    log.error('Missing LinkedIn credentials in environment');
    throw missingCredentials();
  }

  return { liAt, jsessionId };
}

function initializeClient(credentials: { liAt: string; jsessionId: string }): void {
  log.info('Initializing LinkedIn API client');
  Client({ JSESSIONID: credentials.jsessionId, li_at: credentials.liAt });
  
  // Set timeout on the axios instance (library doesn't configure this)
  if (apiInstance) {
    apiInstance.defaults.timeout = API_TIMEOUT_MS;
    log.debug({ timeoutMs: API_TIMEOUT_MS }, 'API timeout configured');
  }
}

async function resolveProfileId(identifier: string): Promise<string> {
  log.info({ identifier }, 'Resolving profile ID');

  const profileId = await withRetry(
    () => extractProfileIdLinkedin(identifier),
    { operation: 'resolveProfileId' }
  );
  
  if (!profileId) {
    log.error({ identifier }, 'Profile not found');
    throw profileNotFound(identifier);
  }

  log.info({ identifier, profileId }, 'Profile ID resolved');
  return profileId;
}

async function fetchBatch(identifier: string, start: number, count: number): Promise<LinkedInPost[]> {
  const posts = await withRetry(
    () => getUserPosts({ identifier, start, count }),
    { operation: 'fetchBatch' }
  );
  return posts?.map(normalizePost) ?? [];
}

async function fetchPostsPaginated(
  identifier: string,
  batchSize: number,
  cutoffDate: Date
): Promise<LinkedInPost[]> {
  const allPosts: LinkedInPost[] = [];
  let start = 0;
  let hasMore = true;
  let reachedCutoff = false;

  log.info({ batchSize, cutoffDate: cutoffDate.toISOString() }, 'Starting posts fetch');

  while (hasMore && !reachedCutoff) {
    const batchNum = Math.floor(start / batchSize) + 1;

    log.debug({ batch: batchNum, start, count: batchSize }, 'Fetching batch');

    const posts = await fetchBatch(identifier, start, batchSize);

    if (posts.length === 0) {
      log.info({ batch: batchNum }, 'No more posts available');
      break;
    }

    for (const post of posts) {
      if (!isWithinDateRange(post, cutoffDate)) {
        log.info({ postDate: post.dateDescription }, 'Reached posts older than cutoff date');
        reachedCutoff = true;
        break;
      }
      allPosts.push(post);
    }

    log.info(
      { batch: batchNum, postsInBatch: posts.length, postsInRange: allPosts.length },
      'Batch processed'
    );

    start += batchSize;
    hasMore = posts.length >= batchSize;

    if (hasMore && !reachedCutoff) {
      await waitBetweenBatches();
    }
  }

  return allPosts;
}

/**
 * Fetch all posts from a LinkedIn profile within a date range
 * 
 * @param options - Fetch options
 * @param options.identifier - LinkedIn profile identifier (username)
 * @param options.monthsAgo - Number of months to fetch back (default: 6)
 * @param options.batchSize - Number of posts per API call (default: 50)
 * @param options.outputDir - Output directory for JSON/CSV files (default: output)
 * @returns Fetch result with posts and metadata
 * 
 * @example
 * ```ts
 * const result = await fetchAllPosts({
 *   identifier: 'yolandyan',
 *   monthsAgo: 6,
 * });
 * console.log(`Fetched ${result.totalPosts} posts`);
 * ```
 */
export async function fetchAllPosts(options: FetchOptions): Promise<FetchResult> {
  const { 
    identifier, 
    monthsAgo, 
    batchSize = DEFAULT_BATCH_SIZE, 
    outputDir = DEFAULT_OUTPUT_DIR 
  } = options;

  log.info('Starting LinkedIn posts fetcher');

  const credentials = getCredentials();
  initializeClient(credentials);
  const profileId = await resolveProfileId(identifier);
  const cutoffDate = getCutoffDate(monthsAgo);

  const posts = await fetchPostsPaginated(identifier, batchSize, cutoffDate);

  log.info(
    { totalPosts: posts.length, monthsAgo, cutoffDate: cutoffDate.toISOString() },
    'Fetch complete'
  );

  const result: FetchResult = {
    profile: identifier,
    profileId,
    fetchedAt: new Date().toISOString(),
    monthsFetched: monthsAgo,
    cutoffDate: cutoffDate.toISOString(),
    totalPosts: posts.length,
    posts,
  };

  const { jsonFile, csvFile } = saveOutputs(result, outputDir);
  log.info({ jsonFile, csvFile }, 'Outputs saved');

  return result;
}

// Re-export types for library users
export type { LinkedInPost, FetchOptions, FetchResult } from './types.ts';
