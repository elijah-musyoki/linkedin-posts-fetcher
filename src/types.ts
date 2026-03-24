// Type definitions for LinkedIn posts fetcher

export interface LinkedInPost {
  urn: string;
  url: string;
  text: string;
  dateDescription: string;
  numLikes: number;
  numComments: number;
  numShares: number;
  media?: unknown;
  tags?: unknown[];
}

export interface FetchOptions {
  identifier: string;
  monthsAgo: number;
  batchSize?: number;
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
