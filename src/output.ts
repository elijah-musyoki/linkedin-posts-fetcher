// Output utilities for saving posts to JSON and CSV
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FetchResult, LinkedInPost } from './types.ts';
import { createLogger } from './logger.ts';

const log = createLogger('output');

/**
 * Ensure output directory exists
 */
export function ensureOutputDir(dir: string): void {
  if (!existsSync(dir)) {
    log.debug({ dir }, 'Creating output directory');
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generate a timestamp string for filenames
 */
export function generateTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/**
 * Convert posts to CSV format
 */
export function postsToCsv(posts: LinkedInPost[]): string {
  const header = 'URL,Date,Likes,Comments,Shares,Text\n';
  const rows = posts.map((post) => {
    const text = (post.text ?? '')
      .replace(/"/g, '""')
      .replace(/\n/g, ' ')
      .substring(0, 500);
    return `"${post.url}","${post.dateDescription}",${post.numLikes},${post.numComments},${post.numShares},"${text}"`;
  });
  return header + rows.join('\n');
}

/**
 * Save result to JSON file
 */
export function saveToJson(result: FetchResult, outputDir: string, identifier: string): string {
  const timestamp = generateTimestamp();
  const filename = join(outputDir, `${identifier}-posts-${timestamp}.json`);

  log.debug({ file: filename, postsCount: result.posts.length }, 'Writing JSON output');
  writeFileSync(filename, JSON.stringify(result, null, 2));
  log.info({ file: filename }, 'JSON output saved');

  return filename;
}

/**
 * Save posts to CSV file
 */
export function saveToCsv(posts: LinkedInPost[], outputDir: string, identifier: string): string {
  const timestamp = generateTimestamp();
  const filename = join(outputDir, `${identifier}-posts-${timestamp}.csv`);

  log.debug({ file: filename }, 'Writing CSV output');
  writeFileSync(filename, postsToCsv(posts));
  log.info({ file: filename }, 'CSV output saved');

  return filename;
}

/**
 * Save all outputs (JSON + CSV)
 */
export function saveOutputs(result: FetchResult, outputDir: string): { jsonFile: string; csvFile: string } {
  ensureOutputDir(outputDir);

  const jsonFile = saveToJson(result, outputDir, result.profile);
  const csvFile = saveToCsv(result.posts, outputDir, result.profile);

  return { jsonFile, csvFile };
}
