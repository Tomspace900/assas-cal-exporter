# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Assas Calendar Exporter is a bookmarklet that exports CELCAT university calendars to ICS format for import into Google Calendar, Apple Calendar, or Outlook. The tool extracts calendar data from the Assas CELCAT web interface, parses event descriptions, and generates RFC 5545-compliant .ics files.

## Development Commands

```bash
# Install dependencies
npm install

# Build the bookmarklet (concatenates, minifies, wraps in bookmarklet format)
npm run build

# Test parser logic with unit tests
npm test

# Run dev POC with mock data
npm run dev

# Analyze real data and verify parsing logic
npm run analyze
```

## Architecture

### Core Modules (CommonJS)

The core logic is written in CommonJS modules that work in both Node.js (for testing) and browser (after build transformation):

- **src/utils.js**: Pure utility functions (ICS date formatting, HTML entity decoding, text escaping, line folding)
- **src/parser.js**: Extracts structured data from CELCAT description fields (category, module, staff, room, group)
- **src/ics-generator.js**: Generates RFC 5545-compliant ICS files from parsed event data

### Browser-Specific Modules

- **bookmarklet/src/student-id-extractor.js**: Extracts student ID from DOM or URL (tries navbar, DOM scan, query params, hash fragment)
- **bookmarklet/src/browser-adapter.js**: Browser APIs (fetch, prompts, file download, status UI)
- **bookmarklet/src/main.js**: Main orchestration workflow (IIFE that coordinates extraction, fetching, parsing, generation)

### Build Process

**bookmarklet/build.js** transforms the codebase for browser deployment:

1. Reads all source files (utils, parser, ICS generator, student ID extractor, browser adapter, main)
2. Removes CommonJS syntax (`require()`, `module.exports`)
3. Concatenates in dependency order
4. Minifies with Terser (preserves console.log for debugging, mangles toplevel)
5. Wraps in `javascript:(function(){...})();` bookmarklet format
6. Outputs to:
   - `bookmarklet/dist/bookmarklet.debug.js` (non-minified for debugging)
   - `bookmarklet/dist/bookmarklet.min.js` (minified)
   - `bookmarklet/dist/bookmarklet.txt` (final bookmarklet code to paste in browser bookmark)

### CELCAT API Integration

The bookmarklet interacts with two CELCAT endpoints:

1. **LoadDisplayNames** (POST): Fetches student name from federation ID
   - URL: `https://celcat-web.u-paris2.fr/calendar/Home/LoadDisplayNames`
   - Params: `federationIds[]`, `resType=104`
   - Headers: `Content-Type: application/x-www-form-urlencoded`, cookies (via `credentials: 'include'`)
   - Returns: `[{"federationId": "2401012", "displayName": "LASTNAME,FIRSTNAME"}]`

2. **GetCalendarData** (POST): Fetches calendar events for date range
   - URL: `https://celcat-web.u-paris2.fr/calendar/Home/GetCalendarData`
   - Params: `start`, `end`, `resType=104`, `calView=agendaDay`, `federationIds[]`
   - Headers: `Content-Type: application/x-www-form-urlencoded`, cookies (via `credentials: 'include'`)
   - Returns: Array of event objects with nested description fields

**Note on resType:** Currently hardcoded to `104` (M2 GRH). If the bookmarklet doesn't work for other programs, check the CELCAT URL for the correct resType value.

### Description Parsing Logic

CELCAT events have complex description fields with HTML entities and line breaks. The parser (src/parser.js:18):

1. Normalizes line breaks (`<br />`, `\r\n` → `\n`)
2. Decodes HTML entities (`&#233;` → `é`, `&amp;` → `&`)
3. Splits into lines and filters empty
4. Extracts structured fields:
   - Line 1: Event category (e.g., "Cours magistral")
   - Line 2: Module name
   - Line 3+: Room (pattern: `Salle ...`), Staff (`LASTNAME, Firstname`), Group (`Groupe 1` or `OPTION`)

The parser uses regex patterns and heuristics (all-caps for groups, names for staff) to handle variations in formatting.

### ICS Generation

The ICS generator (src/ics-generator.js) creates RFC 5545-compliant calendar files:

- Uses event ID as UID to prevent duplicates
- Generates DTSTAMP in UTC
- Builds SUMMARY from abbreviated category (CM, TD, TP) + module name
- Populates DESCRIPTION with structured fields (Module, Intervenant, Groupe, Salle)
- Sets LOCATION from parsed room or event sites
- Folds lines longer than 75 characters (RFC requirement)

### User Experience Flow

The bookmarklet workflow (bookmarklet/src/main.js):

1. Extract student ID (from DOM or prompt)
2. Fetch student name (personalized greeting)
3. Prompt for date range (defaults to academic year Sept-Aug)
4. Fetch calendar data from CELCAT API
5. Parse event descriptions
6. Generate ICS file (all events included)
7. Trigger browser download
8. Show success message with event count

Status messages appear as fixed-position overlays (top-right, color-coded by type) that auto-dismiss after 3 seconds.

## Testing

**dev/test-parser.js** contains unit tests for the parser module:
- Standard format parsing (category, module, staff, group)
- HTML entity decoding (é, è, &amp;)
- Room detection (Salle pattern)
- Special group labels (OPTION)
- Edge cases (empty, null)

Run tests with `npm test` - exits with code 1 if any tests fail.

## Important Patterns

### Date Formatting
- Input from CELCAT API: ISO 8601 (`2025-12-17T09:00:00`)
- Output for ICS: `20251217T090000` (no separators)
- Academic year calculation: Sept-Aug (if current month < 9, use previous year)

### Module System Compatibility
All core modules use conditional exports for dual compatibility:
```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ... };
}
```

This allows the same code to work in Node.js (for testing) and browser (after CommonJS removal in build).

### Text Escaping
ICS format requires escaping: `\` → `\\`, `;` → `\;`, `,` → `\,`, newline → `\n` (literal)

### Line Folding
RFC 5545 requires lines ≤ 75 chars. Continuation lines start with a space and use CRLF (`\r\n`).
