// Parse LinkedIn profile URLs and identifiers
import { createLogger } from './logger.ts';

const log = createLogger('profile-parser');

export interface ProfileInput {
  original: string;
  identifier: string;
  url?: string;
}

/**
 * Extract the public identifier from a LinkedIn URL or username
 * 
 * Accepts:
 * - "yolandyan" (plain identifier)
 * - "https://linkedin.com/in/yolandyan" (full URL)
 * - "https://www.linkedin.com/in/yolandyan/" (with trailing slash)
 */
export function parseProfileInput(input: string): ProfileInput {
  const trimmed = input.trim();
  
  // Check if it's a URL
  if (trimmed.includes('linkedin.com/in/')) {
    const match = trimmed.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
    if (match) {
      const identifier = match[1];
      log.debug({ input, identifier }, 'Parsed LinkedIn URL');
      return {
        original: trimmed,
        identifier,
        url: trimmed,
      };
    }
  }
  
  // Plain identifier
  log.debug({ input, identifier: trimmed }, 'Using plain identifier');
  return {
    original: trimmed,
    identifier: trimmed,
  };
}

/**
 * Parse multiple profile inputs
 */
export function parseProfileInputs(inputs: string[]): ProfileInput[] {
  return inputs.map(parseProfileInput);
}

/**
 * Load profiles from a JSON config file
 */
export async function loadProfilesConfig(filePath: string): Promise<ProfileInput[]> {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const config = JSON.parse(content);
  
  if (!config.profiles || !Array.isArray(config.profiles)) {
    throw new Error('Config file must have a "profiles" array');
  }
  
  return config.profiles.map((p: { identifier?: string; url?: string; months?: number }) => {
    const input = p.url || p.identifier;
    if (!input) {
      throw new Error('Each profile must have either "identifier" or "url"');
    }
    return parseProfileInput(input);
  });
}
