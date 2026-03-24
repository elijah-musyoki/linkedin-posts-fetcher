#!/usr/bin/env node
// LinkedIn Posts Fetcher - CLI entry point
import { cac } from 'cac';
import { config } from 'dotenv';
import { createLogger } from './logger.ts';
import { fetchAllPosts } from './fetch-posts.ts';
import { parseProfileInput, loadProfilesConfig } from './profile-parser.ts';
import { ENV } from './constants.ts';

// Load .env file
config();

const log = createLogger('cli');

const cli = cac('linkedin-fetcher');

// Version
cli.version('1.0.0');

// Main command: fetch
cli
  .command('[profiles...]', 'Fetch posts from LinkedIn profiles')
  .option('-m, --months <months>', 'Number of months to fetch', { default: 6 })
  .option('-c, --config <file>', 'JSON config file with profiles')
  .option('-o, --output <dir>', 'Output directory', { default: 'output' })
  .option('--batch-size <size>', 'Posts per API call', { default: 50 })
  .example('linkedin-fetcher yolandyan')
  .example('linkedin-fetcher yolandyan satyanadella -m 3')
  .example('linkedin-fetcher https://linkedin.com/in/yolandyan')
  .example('linkedin-fetcher --config profiles.json')
  .action(async (profiles, options) => {
    // Validate credentials
    const liAt = process.env[ENV.LI_AT];
    const jsessionId = process.env[ENV.JSESSIONID];
    
    if (!liAt || !jsessionId) {
      log.error('Missing LinkedIn credentials');
      console.error('\n❌ Missing credentials!\n');
      console.error('Set these environment variables:');
      console.error('  LINKEDIN_LI_AT=your_li_at_cookie');
      console.error('  LINKEDIN_JSESSIONID=your_jsessionid');
      console.error('\nOr create a .env file with these values.');
      process.exit(1);
    }

    // Get profiles to fetch
    let profileInputs: { identifier: string; months: number }[] = [];

    if (options.config) {
      log.info({ config: options.config }, 'Loading profiles from config file');
      const configProfiles = await loadProfilesConfig(options.config);
      profileInputs = configProfiles.map(p => ({
        identifier: p.identifier,
        months: options.months,
      }));
    } else if (profiles.length > 0) {
      profileInputs = profiles.map((input: string) => {
        const parsed = parseProfileInput(input);
        return {
          identifier: parsed.identifier,
          months: options.months,
        };
      });
    } else {
      // Use env var or default
      const defaultProfile = process.env.PROFILE_IDENTIFIER || 'yolandyan';
      log.info({ profile: defaultProfile }, 'Using default profile from env');
      profileInputs = [{ identifier: defaultProfile, months: options.months }];
    }

    log.info({ profiles: profileInputs.length, months: options.months }, 'Starting fetch');

    // Fetch each profile
    const results: { identifier: string; success: boolean; totalPosts?: number; error?: string }[] = [];
    for (const { identifier, months } of profileInputs) {
      try {
        log.info({ identifier, months }, 'Fetching profile');
        const result = await fetchAllPosts({
          identifier,
          monthsAgo: months,
          outputDir: options.output,
          batchSize: options.batchSize,
        });
        results.push({ identifier, success: true, totalPosts: result.totalPosts });
        log.info({ identifier, totalPosts: result.totalPosts }, 'Profile fetched successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.error({ identifier, error: message }, 'Failed to fetch profile');
        results.push({ identifier, success: false, error: message });
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log('─'.repeat(50));
    for (const r of results) {
      if (r.success) {
        console.log(`✅ ${r.identifier}: ${r.totalPosts} posts`);
      } else {
        console.log(`❌ ${r.identifier}: ${r.error}`);
      }
    }
  });

// Help command
cli.help();

// Parse
cli.parse();
