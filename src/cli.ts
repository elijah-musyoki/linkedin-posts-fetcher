#!/usr/bin/env node
// LinkedIn Posts Fetcher - CLI entry point
import { parseArgs } from 'node:util';
import { config } from 'dotenv';
import { createLogger } from './logger.ts';
import { fetchAllPosts } from './fetch-posts.ts';
import { parseProfileInput, loadProfilesConfig } from './profile-parser.ts';
import { ENV } from './constants.ts';

// Load .env file
config();

const log = createLogger('cli');

const HELP_TEXT = `
LinkedIn Posts Fetcher

Fetch posts from LinkedIn profiles for a specified time period.

USAGE:
  node src/cli.ts fetch [OPTIONS]

OPTIONS:
  -p, --profile <identifier>  LinkedIn profile identifier or URL (required)
                              Can be specified multiple times
  -m, --months <number>       Number of months to fetch (default: 6)
  -c, --config <file>         JSON config file with profiles
  -o, --output <dir>         Output directory (default: output)
  -h, --help                 Show this help message

EXAMPLES:
  # Fetch from a single profile
  node src/cli.ts fetch --profile yolandyan --months 6
  
  # Fetch from multiple profiles
  node src/cli.ts fetch -p yolandyan -p satyanadella -m 3
  
  # Use a LinkedIn URL
  node src/cli.ts fetch --profile https://linkedin.com/in/yolandyan
  
  # Use a config file
  node src/cli.ts fetch --config profiles.json

ENVIRONMENT VARIABLES:
  LINKEDIN_LI_AT         LinkedIn li_at cookie (required)
  LINKEDIN_JSESSIONID    LinkedIn JSESSIONID cookie (required)
  LOG_LEVEL              Log level: debug, info, warn, error (default: info)
`;

interface ParsedArgs {
  profiles: string[];
  months: number;
  config?: string;
  output: string;
  help: boolean;
}

function parseCliArgs(): ParsedArgs {
  const { values, positionals } = parseArgs({
    options: {
      profile: {
        type: 'string',
        short: 'p',
        multiple: true,
      },
      months: {
        type: 'string',
        short: 'm',
        default: '6',
      },
      config: {
        type: 'string',
        short: 'c',
      },
      output: {
        type: 'string',
        short: 'o',
        default: 'output',
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false,
      },
    },
    allowPositionals: true,
  });

  const command = positionals[0];
  
  if (values.help || !command) {
    console.log(HELP_TEXT);
    process.exit(command ? 0 : 1);
  }

  if (command !== 'fetch') {
    log.error(`Unknown command: ${command}`);
    console.log(HELP_TEXT);
    process.exit(1);
  }

  return {
    profiles: values.profile || [],
    months: parseInt(values.months || '6', 10),
    config: values.config,
    output: values.output || 'output',
    help: values.help || false,
  };
}

async function run(): Promise<void> {
  const args = parseCliArgs();
  
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
  let profiles: { identifier: string; months: number }[] = [];

  if (args.config) {
    log.info({ config: args.config }, 'Loading profiles from config file');
    const configProfiles = await loadProfilesConfig(args.config);
    profiles = configProfiles.map(p => ({
      identifier: p.identifier,
      months: args.months, // Use CLI months as default
    }));
  } else if (args.profiles.length > 0) {
    profiles = args.profiles.map(input => {
      const parsed = parseProfileInput(input);
      return {
        identifier: parsed.identifier,
        months: args.months,
      };
    });
  } else {
    // Use env var or default
    const defaultProfile = process.env.PROFILE_IDENTIFIER || 'yolandyan';
    log.info({ profile: defaultProfile }, 'Using default profile from env');
    profiles = [{ identifier: defaultProfile, months: args.months }];
  }

  log.info({ profiles: profiles.length, months: args.months }, 'Starting fetch');

  // Fetch each profile
  const results = [];
  for (const { identifier, months } of profiles) {
    try {
      log.info({ identifier, months }, 'Fetching profile');
      const result = await fetchAllPosts({
        identifier,
        monthsAgo: months,
        outputDir: args.output,
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
}

// Run CLI
run().catch((err) => {
  log.error({ error: err.message }, 'Fatal error');
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
