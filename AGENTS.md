# WeatherKitAlert

## What This Is

A Surge/Quantumult X script module that intercepts `qweather.com` severe-weather alert pages and re-renders them with Apple WeatherKit native styling. The built output (`dist/alert.bundle.js`) is deployed as a CDN-hosted script provider.

## Build

```bash
npm run build          # Production bundle
npm run build:dev      # Development mode
```

Uses **rspack** (not webpack). Output: `dist/alert.bundle.js`.

## Architecture

- `src/index.js` — Entry point. Intercepts `$response.body`, replaces it with Apple-styled HTML.
- `src/parser.mjs` — Regex-based HTML parser. Extracts structured `AlertData` from qweather's DOM.
- `src/renderer.mjs` — Renders the Apple WeatherKit CSS/HTML shell with extracted data.
- `src/types.d.ts` — TypeScript interfaces for `AlertData`.
- `modules/*.stoverride` — Surge module config (MITM, script routing, CDN URL).

## Key Conventions

- **No tests or lint config.** This is a standalone script module, not a library.
- **String concatenation over template literals** in renderer — avoids backtick conflicts in bundled output.
- **Regex parsing, not DOM** — parser uses `match()`/`matchAll()` on raw HTML. No DOM parser dependency.
- **CSS hosted by Apple** — `renderer.mjs` links to `weatherkit.apple.com/alertDetails/*.css`. Do not modify these URLs.
- **Chinese text throughout** — Alert labels, severity descriptions, and UI copy are in Chinese (zh-CN). Keep them that way.

## Deployment Flow

1. Build produces `dist/alert.bundle.js`
2. The `.stoverride` file references a CDN URL (GitHub Gist or Release asset)
3. `date` and `version` in the module config are templated from `package.json` and build timestamp
