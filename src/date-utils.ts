// Date parsing utilities for LinkedIn posts
import type { LinkedInPost } from './types.ts';

/** Time unit to milliseconds multiplier */
const TIME_MULTIPLIERS: Record<string, number> = {
  h: 60 * 60 * 1000,           // hours
  d: 24 * 60 * 60 * 1000,      // days
  w: 7 * 24 * 60 * 60 * 1000,  // weeks
  m: 30 * 24 * 60 * 60 * 1000, // months (approximate)
  y: 365 * 24 * 60 * 60 * 1000, // years (approximate)
};

/**
 * Calculate cutoff date (N months ago)
 */
export function getCutoffDate(monthsAgo: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date;
}

/**
 * Parse LinkedIn's relative date description to a Date object
 * Examples: "2d", "1w", "3mo", "1y", "5d •"
 */
export function parseLinkedInDate(dateDesc: string | undefined): Date | null {
  if (!dateDesc) return null;

  const cleaned = dateDesc.split('•')[0].trim();
  const match = cleaned.match(/^(\d+)([hdwmy])?$/i);

  if (!match) {
    // Try parsing as ISO date
    const parsed = new Date(cleaned);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const value = parseInt(match[1]);
  const unit = (match[2] ?? 'd').toLowerCase();
  const multiplier = TIME_MULTIPLIERS[unit];

  if (!multiplier) return null;

  return new Date(Date.now() - value * multiplier);
}

/**
 * Check if a post is within the date range
 */
export function isWithinDateRange(post: { dateDescription?: string }, cutoffDate: Date): boolean {
  const postDate = parseLinkedInDate(post.dateDescription);
  // Include if we can't parse date (be conservative)
  return !postDate || postDate >= cutoffDate;
}

/**
 * Normalize a raw post from the API into our standard format
 */
export function normalizePost(raw: Record<string, unknown>): LinkedInPost {
  return {
    urn: (raw.urn as string) ?? '',
    url: (raw.postUrl as string) ?? '',
    text: (raw.contentText as string) ?? (raw.text as string) ?? '',
    dateDescription: (raw.dateDescription as string) ?? '',
    numLikes: (raw.numLikes as number) ?? 0,
    numComments: (raw.numComments as number) ?? 0,
    numShares: (raw.numShares as number) ?? 0,
    media: raw.media as LinkedInPost['media'],
    tags: raw.tags as LinkedInPost['tags'],
  };
}
