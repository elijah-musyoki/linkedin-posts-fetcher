# LinkedIn Posts Fetcher

Fetch posts from LinkedIn profiles for a specified time period. TypeScript CLI with rate limiting, checkpointing, and resume capability.

---

## Quick Start

**What you'll learn:** How to fetch posts from a LinkedIn profile in 5 minutes.

### Prerequisites

- Node.js 18+ (for `node:util/parseArgs`)
- LinkedIn account (for cookies)

### Installation

```bash
git clone https://github.com/elijah-musyoki/linkedin-posts-fetcher.git
cd linkedin-posts-fetcher
npm install
```

### Get LinkedIn Cookies

1. Log into LinkedIn in your browser
2. Open DevTools (F12)
3. Go to **Application** → **Cookies** → `https://www.linkedin.com`
4. Copy these values:
   - `li_at` - Your main auth token
   - `JSESSIONID` - Your session ID (starts with "ajax:")

### Create .env File

```bash
cp .env.example .env
```

Edit `.env`:
```env
LINKEDIN_LI_AT=AQEDAS9LKTIA...
LINKEDIN_JSESSIONID=ajax:7736944...
```

### Your First Fetch

```bash
node src/cli.ts yolandyan -m 1
```

**Result:** JSON and CSV files in `output/` with posts from the last month.

---

## How-to Guides

### Fetch from a single profile

```bash
node src/cli.ts yolandyan -m 6
```

### Fetch from multiple profiles

```bash
node src/cli.ts yolandyan satyanadella reidhoffman -m 3
```

### Use a LinkedIn URL instead of username

```bash
node src/cli.ts https://linkedin.com/in/yolandyan -m 6
```

### Process multiple profiles from a config file

Create `profiles.json`:
```json
{
  "profiles": [
    { "identifier": "yolandyan", "months": 6 },
    { "url": "https://linkedin.com/in/satyanadella", "months": 3 }
  ]
}
```

```bash
node src/cli.ts --config profiles.json
```

### Resume an interrupted fetch

If you press Ctrl+C or the fetch is interrupted:

```bash
# Start fetch
node src/cli.ts yolandyan -m 12

# Press Ctrl+C
💾 Progress saved: 180 posts fetched
   Run again to resume from where you left off

# Run again - resumes automatically!
node src/cli.ts yolandyan -m 12
ℹ️ Resuming from checkpoint (180 posts, start: 100)
```

### Customize rate limiting

If you're getting rate-limited, slow things down:

```bash
BATCH_SIZE=10 BATCH_DELAY_MS=5000 JITTER_PERCENT=50 node src/cli.ts yolandyan -m 6
```

---

## Reference

### CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--months` | `-m` | Months to fetch back | `6` |
| `--config` | `-c` | JSON config file with profiles | - |
| `--output` | `-o` | Output directory | `output` |
| `--batch-size` | | Posts per API call | `20` |
| `--version` | `-v` | Display version | - |
| `--help` | `-h` | Show help | - |

### Environment Variables

**Required:**

| Variable | Description |
|----------|-------------|
| `LINKEDIN_LI_AT` | LinkedIn `li_at` cookie |
| `LINKEDIN_JSESSIONID` | LinkedIn `JSESSIONID` cookie |

**Rate Limiting:**

| Variable | Description | Default |
|----------|-------------|---------|
| `BATCH_SIZE` | Posts per API call | `20` |
| `BATCH_DELAY_MS` | Delay between batches | `2000` |
| `JITTER_PERCENT` | Random delay variation (0-50%) | `50` |
| `API_TIMEOUT_MS` | API call timeout | `30000` |
| `MAX_RETRIES` | Retries on rate limit | `5` |

**Logging:**

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | debug/info/warn/error | `info` |
| `LOG_DIR` | Log directory | `logs` |

### Output Files

**JSON:** `{profile}-posts-{timestamp}.json`
```json
{
  "profile": "yolandyan",
  "totalPosts": 32,
  "posts": [{ "urn": "...", "text": "...", "numLikes": 150 }]
}
```

**CSV:** `{profile}-posts-{timestamp}.csv`

| URL | Date | Likes | Comments | Shares | Text |
|-----|------|-------|----------|--------|------|

### Checkpoint File

**Location:** `output/{identifier}-checkpoint.json`

```json
{
  "identifier": "yolandyan",
  "monthsAgo": 6,
  "start": 100,
  "posts": [...],
  "completed": false
}
```

---

## Explanation

### How It Works

```
User runs CLI
     ↓
Parse profile identifier (username or URL)
     ↓
Initialize LinkedIn API client (axios + cookies)
     ↓
Fetch posts in batches (20 per call)
     ↓
Wait between batches (2-3s with jitter)
     ↓
Save checkpoint after each batch
     ↓
Write JSON + CSV on completion
```

### Rate Limiting Strategy

| Mechanism | Purpose |
|-----------|---------|
| **Small batches (20)** | Looks like human scrolling |
| **Random jitter (50%)** | Harder to detect patterns |
| **Exponential backoff** | Graceful handling of rate limits |
| **Timeout detection** | Handles network issues |
| **Checkpointing** | Never lose progress |

### Dependencies

This project depends on:

| Package | Description | Author |
|---------|-------------|--------|
| **[@florydev/linkedin-api-voyager](https://github.com/Floryvibla/linkedin-api-voyager)** | Core library for LinkedIn's Voyager API | [Flory Muenge Tshiteya](https://www.linkedin.com/in/florymignon/) |
| [cac](https://github.com/cacjs/cac) | CLI argument parser | Yuxi You |
| [pino](https://github.com/pinojs/pino) | Fast JSON logger | pinojs |
| [pino-pretty](https://github.com/pinojs/pino-pretty) | Pretty log output | pinojs |

#### About the Core Library

**@florydev/linkedin-api-voyager** is the heart of this tool. It provides:

- Cookie-based authentication
- Profile ID resolution
- Post fetching via Voyager API
- TypeScript definitions

**Author:** Flory Muenge Tshiteya

**Note:** This is a single-maintainer project. The real risk is LinkedIn API changes, not maintainer abandonment.

### Project Structure

```
src/
├── cli.ts                # CLI entry point
├── fetch-posts.ts        # Core fetch logic
├── checkpoint.ts         # Progress saving
├── graceful-shutdown.ts  # Ctrl+C handling
├── rate-limiter.ts       # Backoff + jitter
├── profile-parser.ts     # URL/username parsing
├── logger.ts             # Pino multistream
├── date-utils.ts         # LinkedIn date parsing
├── output.ts             # JSON/CSV writing
├── constants.ts          # Configuration
├── env.ts                # Env var parsing
├── errors.ts             # Custom errors
└── types.ts              # TypeScript interfaces
```

---

## Credits

This project is built on the work of:

- **Flory Muenge Tshiteya** - Creator of [@florydev/linkedin-api-voyager](https://github.com/Floryvibla/linkedin-api-voyager), without which this tool would not exist

---

## Disclaimer

This tool is for educational purposes only. Using it may violate LinkedIn's Terms of Service. Use responsibly and at your own risk.

## License

MIT
