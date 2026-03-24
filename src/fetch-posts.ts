// LinkedIn Posts Fetcher - Fetches posts from a profile for the past N months
import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Client, getUserPosts, extractProfileIdLinkedin } from '@florydev/linkedin-api-voyager';
import type { LinkedInPost, FetchOptions, FetchResult } from './types.ts';
import { missingCredentials, profileNotFound, apiError, rateLimited, isAppError } from './errors.ts';

// Configuration
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_MONTHS = 6;
const DEFAULT_OUTPUT_DIR = './output';

/**
 * Calculate cutoff date (N months ago)
 */
function getCutoffDate(monthsAgo: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date;
}

/**
 * Parse LinkedIn's relative date description to a Date object
 * Examples: "2d", "1w", "3mo", "1y", "5d •"
 */
function parseLinkedInDate(dateDesc: string | undefined): Date | null {
  if (!dateDesc) return null;

  // Clean up the date string (remove extra characters like "•")
  const cleaned = dateDesc.split('•')[0].trim();
  const now = new Date();
  const match = cleaned.match(/^(\d+)([hdwmy])?$/i);

  if (!match) {
    // Try to parse as a regular date string
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) return parsed;
    return null;
  }

  const value = parseInt(match[1]);
  const unit = (match[2] ?? 'd').toLowerCase();

  switch (unit) {
    case 'h': // hours
      now.setHours(now.getHours() - value);
      break;
    case 'd': // days
      now.setDate(now.getDate() - value);
      break;
    case 'w': // weeks
      now.setDate(now.getDate() - value * 7);
      break;
    case 'm': // months
      now.setMonth(now.getMonth() - value);
      break;
    case 'y': // years
      now.setFullYear(now.getFullYear() - value);
      break;
  }

  return now;
}

/**
 * Check if a post is within the date range
 */
function isWithinDateRange(post: { dateDescription?: string }, cutoffDate: Date): boolean {
  const postDate = parseLinkedInDate(post.dateDescription);
  if (!postDate) return true; // Include if we can't parse date (to be safe)
  return postDate >= cutoffDate;
}

/**
 * Fetch all posts from a LinkedIn profile within a date range
 */
export async function fetchAllPosts(options: FetchOptions): Promise<FetchResult> {
  const { identifier, monthsAgo, batchSize = DEFAULT_BATCH_SIZE, outputDir = DEFAULT_OUTPUT_DIR } = options;

  console.log('🚀 LinkedIn Posts Fetcher');
  console.log('========================\n');

  // Validate environment variables
  const liAt = process.env.LINKEDIN_LI_AT;
  const jsessionId = process.env.LINKEDIN_JSESSIONID;

  if (!liAt || !jsessionId) {
    throw missingCredentials();
  }

  // Initialize the client
  console.log('📡 Initializing LinkedIn API client...');
  Client({
    JSESSIONID: jsessionId,
    li_at: liAt,
  });

  // Get profile ID
  console.log(`🔍 Resolving profile ID for: ${identifier}`);
  let profileId: string;
  try {
    profileId = await extractProfileIdLinkedin(identifier);
    if (!profileId) {
      throw profileNotFound(identifier);
    }
    console.log(`   Profile ID: ${profileId}\n`);
  } catch (err) {
    if (isAppError(err)) throw err;
    throw profileNotFound(identifier);
  }

  // Calculate cutoff date
  const cutoffDate = getCutoffDate(monthsAgo);
  console.log(`📅 Fetching posts from the last ${monthsAgo} months`);
  console.log(`   Cutoff date: ${cutoffDate.toISOString().split('T')[0]}\n`);

  // Fetch posts with pagination
  const allPosts: LinkedInPost[] = [];
  let start = 0;
  let hasMore = true;
  let totalFetched = 0;
  let reachedCutoff = false;

  console.log('📥 Fetching posts...\n');

  while (hasMore && !reachedCutoff) {
    try {
      console.log(`   Batch ${Math.floor(start / batchSize) + 1}: Fetching ${batchSize} posts (start: ${start})...`);

      const posts = await getUserPosts({
        identifier,
        start,
        count: batchSize,
      });

      if (!posts || posts.length === 0) {
        console.log('   No more posts available.');
        hasMore = false;
        break;
      }

      totalFetched += posts.length;

      // Process and filter posts
      for (const post of posts) {
        // Check date
        if (!isWithinDateRange(post, cutoffDate)) {
          console.log(`   ⏹️  Reached posts older than cutoff date. Stopping.`);
          reachedCutoff = true;
          break;
        }

        // Normalize and add to collection
        allPosts.push({
          urn: post.urn ?? '',
          url: post.postUrl ?? '',
          text: post.contentText ?? post.text ?? '',
          dateDescription: post.dateDescription ?? '',
          numLikes: post.numLikes ?? 0,
          numComments: post.numComments ?? 0,
          numShares: post.numShares ?? 0,
          media: post.media,
          tags: post.tags,
        });
      }

      console.log(`   ✅ Fetched ${posts.length} posts. Total in range: ${allPosts.length}`);

      // Move to next batch
      start += batchSize;

      // Check if we got fewer posts than requested (end of data)
      if (posts.length < batchSize) {
        hasMore = false;
      }

      // Add delay to avoid rate limiting
      if (hasMore && !reachedCutoff) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // If it's a rate limit error, wait and retry
      if (message.includes('429') || message.includes('rate')) {
        console.log('   ⏳ Rate limited. Waiting 30 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 30000));
        continue;
      }

      throw apiError(`Failed to fetch posts: ${message}`, err instanceof Error ? err : undefined);
    }
  }

  // Summary
  console.log('\n📊 Summary');
  console.log('==========');
  console.log(`   Total posts fetched: ${totalFetched}`);
  console.log(`   Posts in date range: ${allPosts.length}`);
  console.log(`   Date range: Last ${monthsAgo} months`);

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Prepare result
  const result: FetchResult = {
    profile: identifier,
    profileId,
    fetchedAt: new Date().toISOString(),
    monthsFetched: monthsAgo,
    cutoffDate: cutoffDate.toISOString(),
    totalPosts: allPosts.length,
    posts: allPosts,
  };

  // Save to JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonFile = join(outputDir, `${identifier}-posts-${timestamp}.json`);
  writeFileSync(jsonFile, JSON.stringify(result, null, 2));
  console.log(`\n✅ Saved to: ${jsonFile}`);

  // Save to CSV
  const csvFile = join(outputDir, `${identifier}-posts-${timestamp}.csv`);
  const csvHeader = 'URL,Date,Likes,Comments,Shares,Text\n';
  const csvRows = allPosts
    .map((p) => {
      const text = (p.text ?? '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 500);
      return `"${p.url}","${p.dateDescription}",${p.numLikes},${p.numComments},${p.numShares},"${text}"`;
    })
    .join('\n');
  writeFileSync(csvFile, csvHeader + csvRows);
  console.log(`✅ Saved to: ${csvFile}`);

  return result;
}

// CLI entry point
if (process.argv[1].endsWith('fetch-posts.ts')) {
  const identifier = process.env.PROFILE_IDENTIFIER ?? 'yolandyan';
  const monthsAgo = parseInt(process.env.MONTHS_TO_FETCH ?? String(DEFAULT_MONTHS));

  fetchAllPosts({ identifier, monthsAgo })
    .then((result) => {
      console.log(`\n🎉 Done! Fetched ${result.totalPosts} posts.`);
    })
    .catch((err) => {
      console.error('\n❌ Fatal error:', err);
      process.exit(1);
    });
}
