# WeatherKitAlert

## What This Is

A Surge/Stash script module that intercepts `qweather.com` severe-weather alert pages and re-renders them with Apple WeatherKit native styling. The built output (`dist/alert.bundle.js`) is deployed as a CDN-hosted script provider.

## Build

```bash
npm run build          # Production bundle
npm run build:dev      # Development mode
```

Uses **rspack** (not webpack). Output: `dist/alert.bundle.js`.

## Architecture

- `src/index.js` — Entry point. Intercepts `$response.body`, replaces it with Apple-styled HTML. Cross-platform: auto-detects Quantumult X (`$task`) vs Surge/Stash/Loon/EGERN API.
- `src/parser.mjs` — Div-counting HTML parser. Extracts structured `AlertData[]` from qweather's DOM.
- `src/renderer.mjs` — Renders the Apple WeatherKit CSS/HTML shell with extracted data.
- `src/types.d.ts` — TypeScript interfaces for `AlertData`.
- `modules/*.{stoverride,sgmodule,plugin,srmodule,qx.conf}` — Platform configs for Stash, Surge, Loon, EGERN, Quantumult X.
- `template/stash.alert.handlebars` — Handlebars template for generating stoverride.

## Key Conventions

- **No tests or lint config.** This is a standalone script module, not a library.
- **String concatenation over template literals** in renderer — avoids backtick conflicts in bundled output.
- **Div-counting HTML parser, not DOM** — `parser.mjs` uses `findMatchingClose()` to handle nested `<div>` tags. No DOM parser dependency.
- **CSS hosted by Apple** — `renderer.mjs` links to `weatherkit.apple.com/alertDetails/*.css`. Do not modify these URLs.
- **Chinese text throughout** — Alert labels, severity descriptions, and UI copy are in Chinese (zh-CN). Keep them that way.
- **All text is inline in source files** — no i18n system. Hardcode strings directly.

## Rendering Behavior

- **Multi-alert** (2+ alerts): Title shows `"X 则恶劣天气警报"` or `"X 则极端天气警报"`. All cards collapsed.
- **Single alert**: Title shows `"恶劣天气警报"` or `"极端天气警报"` (no count prefix). Card expanded by default.
- **Severity → title mapping**: If any alert has level `orange` or `red`, title uses "极端天气警报"; otherwise "恶劣天气警报".
- **Issuer**: Hardcoded to `"国家预警信息发布中心"` in renderer (not extracted from page).
- **Cache-Control**: Response headers include `Cache-Control: no-cache, no-store, must-revalidate` to prevent browser caching.

## stoverride Format

```yaml
name: " WeatherKit: 🌤 Alert Override"
version: "X.Y.Z"          # MUST match the release tag (e.g. v1.0.4 → "1.0.4")
date: "YYYY-MM-DD HH:mm:ss"
# ...
script-providers:
  WeatherKit.alert.response:
    url: https://github.com/stellarhalo/WeatherKitAlert/releases/latest/download/alert.bundle.js
    interval: 60           # Seconds between re-downloads. Keep low (60) for quick updates.
```

### Rules
- `version` field value MUST be the semver without `v` prefix (e.g. `"1.0.4"`), matching the Git tag.
- `version` and empty `argument:` fields are required — Stash parses them correctly.
- `name` and `category` values include the `` (Apple logo) Unicode prefix for Apple-related modules.
- The `` character (U+F8FF) must be preserved exactly. Do not replace it with space or remove it.

## Deployment Flow

1. Update `version` in `package.json` and all `modules/*` files to the new version number.
2. Run `npm run build` to produce `dist/alert.bundle.js`.
3. Commit all changes.
4. Create Git tag matching the version (e.g. `v1.0.3`).
5. Push tag: `git push origin master --follow-tags`.
6. Create GitHub Release with tag, attaching `dist/alert.bundle.js` and ALL files under `modules/`.
7. Always delete old releases to avoid confusion with `/releases/latest/download/` redirects.

### Release Attachments

Attach ALL of the following to every release:

| File | Platform |
|---|---|
| `dist/alert.bundle.js` | Script bundle (all platforms) |
| `modules/WeatherKit.Alert.stoverride` | Stash / Surge |
| `modules/WeatherKit.Alert.sgmodule` | Surge |
| `modules/WeatherKit.Alert.plugin` | Loon |
| `modules/WeatherKit.Alert.srmodule` | EGERN |
| `modules/WeatherKit.Alert.qx.conf` | Quantumult X |

### Cache Consideration

Stash caches `script-providers` downloads for `interval` seconds (currently 60). When releasing a new version:
- The stoverride URL (`/releases/latest/download/WeatherKit.Alert.stoverride`) stays the same.
- The bundle URL (`/releases/latest/download/alert.bundle.js`) stays the same.
- Users must **delete and re-add** the module in Stash to pick up the new stoverride.
- The new bundle will be downloaded within `interval` seconds after the module is added.
