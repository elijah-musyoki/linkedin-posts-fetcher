// Type definitions for LinkedIn posts fetcher

export interface LinkedInPost {
  urn: string;
  url: string;
  text: string;
  dateDescription: string;
  numLikes: number;
  numComments: number;
  numShares: number;
  media?: LinkedInMedia;
  tags?: string[];
}

export interface LinkedInMedia {
  type: 'image' | 'video' | 'document' | 'article';
  url?: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
}

export interface FetchOptions {
  /** LinkedIn profile identifier (username from URL) */
  identifier: string;
  /** Number of months to fetch back (default: 6) */
  monthsAgo: number;
  /** Number of posts per API call (default: 50) */
  batchSize?: number;
  /** Output directory for JSON/CSV files (default: output) */
  outputDir?: string;
}

export interface FetchResult {
  profile: string;
  profileId: string;
  fetchedAt: string;
  monthsFetched: number;
  cutoffDate: string;
  totalPosts: number;
  posts: LinkedInPost[];
}

export interface ProfileInfo {
  firstName: string;
  lastName: string;
  headline: string;
}

// Custom error types
export interface AppError extends Error {
  code: string;
  statusCode: number;
}

export const ErrorCodes = {
  MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  API_ERROR: 'API_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// CLI types
export interface ProfileInput {
  /** Original input string */
  original: string;
  /** Parsed identifier (username) */
  identifier: string;
  /** Full LinkedIn URL if provided */
  url?: string;
}

export interface ProfilesConfig {
  profiles: Array<{
    identifier?: string;
    url?: string;
    months?: number;
  }>;
}
