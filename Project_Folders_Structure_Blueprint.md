# Project Folder Structure Blueprint

**Project:** linkedin-posts-fetcher  
**Type:** Node.js + TypeScript (Type Stripping)  
**Generated:** 2026-03-24  
**Node Version:** >=22.6.0 (for native TypeScript support)

---

## 1. Structural Overview

This is a **Node.js CLI tool** built with TypeScript using native type stripping (no build step required for development). The project follows a simple, flat structure optimized for a single-purpose utility.

### Organizational Principles
- **Source isolation**: All TypeScript source in `src/`
- **Output separation**: Generated data in `output/`
- **Configuration at root**: Config files at project root
- **No compilation needed**: TypeScript runs directly via Node.js type stripping

---

## 2. Directory Visualization

```
linkedin-posts-fetcher/
├── .env                    # Environment variables (auth tokens)
├── .gitignore              # Git ignore patterns
├── package.json            # Project config, dependencies, scripts
├── package-lock.json       # Dependency lockfile
├── tsconfig.json           # TypeScript config (type stripping)
├── Project_Folders_Structure_Blueprint.md  # This document
│
├── src/                    # Source code
│   ├── fetch-posts.ts      # Main CLI entry point
│   ├── test-connection.ts  # Connection test script
│   ├── types.ts            # TypeScript interfaces
│   └── errors.ts           # Custom error handling
│
├── output/                 # Generated output (gitignored)
│   ├── *.json              # Full post data
│   └── *.csv               # Spreadsheet export
│
└── node_modules/           # Dependencies (gitignored)
```

---

## 3. Key Directory Analysis

### `src/` - Source Code

| File | Purpose | Imports |
|------|---------|---------|
| `fetch-posts.ts` | Main CLI, fetches posts and saves output | types.ts, errors.ts, @florydev/linkedin-api-voyager |
| `test-connection.ts` | Quick API connection test | errors.ts, @florydev/linkedin-api-voyager |
| `types.ts` | TypeScript interfaces and type definitions | None |
| `errors.ts` | Custom error classes and factories | types.ts |

**Dependency flow:**
```
fetch-posts.ts ──► types.ts
              ──► errors.ts
              
test-connection.ts ──► errors.ts
```

### `output/` - Generated Data

- Auto-created on first run
- Contains timestamped JSON and CSV files
- Gitignored (not versioned)

---

## 4. File Placement Patterns

| File Type | Location | Example |
|-----------|----------|---------|
| TypeScript source | `src/*.ts` | `fetch-posts.ts` |
| Type definitions | `src/types.ts` | Interfaces, ErrorCodes |
| Error handling | `src/errors.ts` | Custom error factories |
| Environment config | `.env` (root) | Auth tokens |
| TypeScript config | `tsconfig.json` (root) | Compiler options |
| Package config | `package.json` (root) | Dependencies, scripts |

---

## 5. Naming Conventions

### Files
- **TypeScript**: `kebab-case.ts` (e.g., `fetch-posts.ts`)
- **Types file**: `types.ts` (singular, contains all interfaces)
- **Errors file**: `errors.ts` (singular, contains all error utilities)

### Code
- **Interfaces**: PascalCase (e.g., `LinkedInPost`, `FetchOptions`)
- **Functions**: camelCase (e.g., `fetchAllPosts`, `parseLinkedInDate`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_BATCH_SIZE`)
- **Error codes**: SCREAMING_SNAKE_CASE (e.g., `MISSING_CREDENTIALS`)

---

## 6. Development Workflow

### Entry Points
| Task | Command | Entry File |
|------|---------|------------|
| Fetch posts | `npm start` | `src/fetch-posts.ts` |
| Test connection | `npm test` | `src/test-connection.ts` |
| Type check | `npm run typecheck` | (tsc --noEmit) |

### Adding New Features

1. **New type**: Add to `src/types.ts`
2. **New error**: Add factory function to `src/errors.ts`
3. **New functionality**: Create new file in `src/` or extend existing file
4. **New CLI command**: Add script to `package.json`, create entry file in `src/`

---

## 7. Configuration

### `.env` Structure
```env
LINKEDIN_LI_AT=<auth_token>
LINKEDIN_JSESSIONID=ajax:<session_id>
```

### `tsconfig.json` Key Options
- `target: "ES2022"` - Modern JavaScript
- `module: "NodeNext"` - Native ESM
- `verbatimModuleSyntax: true` - Enforces type-only imports
- `noEmit: true` - No compilation (type stripping)

---

## 8. Extension Points

### Adding a New Output Format
1. Add format logic to `fetch-posts.ts` or create `src/exporters.ts`
2. Call export function in `fetchAllPosts()`

### Adding Profile Comparison
1. Create `src/compare-profiles.ts`
2. Accept multiple identifiers as CLI args
3. Add script to `package.json`

### Adding Engagement Filtering
1. Add filter options to `FetchOptions` in `types.ts`
2. Apply filters in post processing loop

---

## 9. Files to Remove (Legacy)

The following files are legacy CommonJS versions and can be deleted:
- `test-connection.js` (replaced by `src/test-connection.ts`)
- `fetch-posts.js` (replaced by `src/fetch-posts.ts`)

```bash
rm test-connection.js fetch-posts.js
```

---

## Maintenance

**Last updated:** 2026-03-24  
**Maintained by:** Project structure evolves with new features. Update this document when:
- Adding new top-level directories
- Changing TypeScript configuration
- Adding new entry points/CLI commands
