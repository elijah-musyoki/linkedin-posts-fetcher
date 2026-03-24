# LinkedIn Posts Fetcher 📊

A TypeScript CLI tool to fetch posts from LinkedIn profiles for a specified time period. Uses the LinkedIn Voyager API with cookie-based authentication.

## Features

- ✅ Fetch posts from any public LinkedIn profile
- ✅ Filter by time period (e.g., last 6 months)
- ✅ Output to JSON and CSV
- ✅ Rate limiting with exponential backoff
- ✅ Random jitter to avoid detection
- ✅ Structured logging (file + terminal)
- ✅ Multiple profile support
- ✅ Config file support for batch processing

## Prerequisites

- Node.js 18+
- TypeScript 5.0+
- LinkedIn account (for cookies)

## Installation

```bash
git clone <repo-url>
cd linkedin-posts-fetcher
npm install
```

## Quick Start

### 1. Get LinkedIn Cookies

1. Log into LinkedIn in your browser
2. Open DevTools (F12)
3. Go to **Application** → **Cookies** → `https://www.linkedin.com`
4. Copy these values:
   - `li_at` - Main auth token
   - `JSESSIONID` - Session ID (starts with "ajax:")

### 2. Create `.env` File

```bash
cp .env.example .env
```

Edit `.env`:
```env
LINKEDIN_LI_AT=AQEDAS9LKTIA...
LINKEDIN_JSESSIONID=ajax:7736944...
```

### 3. Run

```bash
# Single profile
node src/cli.ts yolandyan

# Multiple profiles
node src/cli.ts yolandyan satyanadella -m 3

# From URL
node src/cli.ts https://linkedin.com/in/yolandyan
```

## Usage

```
linkedin-fetcher/1.0.0

Usage:
  $ linkedin-fetcher [profiles...]

Commands:
  [profiles...]  Fetch posts from LinkedIn profiles

Options:
  -m, --months <months>  Number of months to fetch (default: 6)
  -c, --config <file>    JSON config file with profiles
  -o, --output <dir>     Output directory (default: output)
  --batch-size <size>    Posts per API call (default: 50)
  -v, --version          Display version number
  -h, --help             Display this message

Examples:
  linkedin-fetcher yolandyan
  linkedin-fetcher yolandyan satyanadella -m 3
  linkedin-fetcher https://linkedin.com/in/yolandyan
  linkedin-fetcher --config profiles.json
```

### Single Profile

```bash
node src/cli.ts yolandyan -m 6
```

### Multiple Profiles

```bash
node src/cli.ts yolandyan satyanadella -m 3
```

### Using LinkedIn URLs

```bash
node src/cli.ts https://linkedin.com/in/reidhoffman -m 12
```

### Config File

Create `profiles.json`:
```json
{
  "profiles": [
    { "identifier": "yolandyan", "months": 6 },
    { "identifier": "satyanadella", "months": 3 },
    { "url": "https://linkedin.com/in/reidhoffman", "months": 12 }
  ]
}
```

```bash
node src/cli.ts --config profiles.json
```

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `LINKEDIN_LI_AT` | ✅ | LinkedIn `li_at` cookie | - |
| `LINKEDIN_JSESSIONID` | ✅ | LinkedIn `JSESSIONID` cookie | - |
| `PROFILE_IDENTIFIER` | | Default profile to fetch | `yolandyan` |
| `MONTHS_TO_FETCH` | | Months to fetch back | `6` |
| `LOG_LEVEL` | | Log level (debug/info/warn/error) | `info` |
| `OUTPUT_DIR` | | Output directory | `output` |

### Rate Limiting

| Variable | Description | Default |
|----------|-------------|---------|
| `BATCH_DELAY_MS` | Delay between batches | `1000` |
| `JITTER_PERCENT` | Random delay variation (0-30%) | `30` |
| `RATE_LIMIT_INITIAL_DELAY_MS` | Initial backoff on rate limit | `2000` |
| `RATE_LIMIT_MAX_DELAY_MS` | Max backoff delay | `120000` |
| `MAX_RETRIES` | Max retries on rate limit | `5` |

## Output

Files are saved to `output/` by default:

- `yolandyan-posts-2026-03-24T12-34-56Z.json` - Full JSON data
- `yolandyan-posts-2026-03-24T12-34-56Z.csv` - CSV summary

### JSON Format

```json
{
  "profile": "yolandyan",
  "profileId": "ACoAAAaeKvo...",
  "fetchedAt": "2026-03-24T12:34:56.789Z",
  "monthsFetched": 6,
  "cutoffDate": "2025-09-24T12:34:56.789Z",
  "totalPosts": 32,
  "posts": [
    {
      "urn": "urn:li:activity:...",
      "url": "https://linkedin.com/posts/...",
      "text": "Post content here...",
      "dateDescription": "2d",
      "numLikes": 150,
      "numComments": 23,
      "numShares": 12
    }
  ]
}
```

### CSV Format

| URL | Date | Likes | Comments | Shares | Text |
|-----|------|-------|----------|--------|------|
| https://... | 2d | 150 | 23 | 12 | Post content... |

## Rate Limiting

This tool implements robust rate limiting to avoid LinkedIn's anti-scraping mechanisms:

1. **Jitter**: Random 0-30% delay variation between batches
2. **Exponential Backoff**: On rate limit, wait doubles (2s → 4s → 8s → 16s → 32s)
3. **Max Retries**: Give up after 5 retries
4. **Detection**: Recognizes rate limit indicators (429, "throttl", "blocked", etc.)

## Library Usage

You can also use this as a library:

```typescript
import { fetchAllPosts, type FetchResult } from './src/fetch-posts.ts';

const result: FetchResult = await fetchAllPosts({
  identifier: 'yolandyan',
  monthsAgo: 6,
});

console.log(`Fetched ${result.totalPosts} posts`);
```

## Logs

Logs are written to both terminal and file:

- **Terminal**: Pretty colored output via `pino-pretty`
- **File**: Structured JSON in `logs/fetcher.log`

```bash
# View logs
tail -f logs/fetcher.log

# Parse JSON logs
cat logs/fetcher.log | jq 'select(.level == 40)'  # warnings
```

## Project Structure

```
src/
├── cli.ts              # CLI entry point (cac)
├── fetch-posts.ts      # Core library
├── profile-parser.ts   # Parse profile URLs/identifiers
├── rate-limiter.ts     # Exponential backoff + jitter
├── logger.ts           # Pino multistream logging
├── date-utils.ts       # LinkedIn date parsing
├── output.ts           # JSON/CSV file saving
├── constants.ts        # Configuration values
├── env.ts              # Typed env parsing
├── errors.ts           # Custom error types
└── types.ts            # TypeScript interfaces
```

## Credits

- **Library**: [@florydev/linkedin-api-voyager](https://github.com/Floryvibla/linkedin-api-voyager)
- **CLI**: [cac](https://github.com/cacjs/cac)
- **Author**: Flory Muenge Tshiteya

## Disclaimer

This tool is for educational purposes only. Using it may violate LinkedIn's Terms of Service. Use responsibly and at your own risk.

## License

MIT
