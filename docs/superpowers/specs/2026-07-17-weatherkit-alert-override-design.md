# WeatherKit Alert Override Design

**Date:** 2026-07-17
**Status:** Approved

## Overview

Intercept Apple Weather's `qweather.com/severe-weather/...` alert links and replace the HTML content with Apple WeatherKit native alert styling. Implemented as a standalone Stash override module.

## Problem

When users tap weather alerts in iOS Weather app, some alerts open `qweather.com/severe-weather/...` URLs in a WebView. These pages have inconsistent styling compared to Apple's native alert presentation.

## Solution

Create a Stash override script that:
1. Intercepts `qweather.com/severe-weather/...` responses
2. Parses the alert content from qweather HTML
3. Re-renders the content using Apple WeatherKit alertDetails styling
4. Returns the transformed HTML to the WebView

## Data Flow

```
iOS Weather App → Tap alert → Request qweather.com/severe-weather/...
    ↓
Stash intercepts (URL pattern match)
    ↓
Injected script executes:
  1. Receive original qweather HTML response
  2. Parse: title, description, publish time, region, alert level
  3. Generate Apple WeatherKit styled HTML
  4. Return modified response
    ↓
iOS Weather App displays Apple-styled alert
```

## File Structure

```
src/alert/
├── index.js          # Entry point for Stash script injection
├── parser.mjs        # Parse qweather HTML content
└── renderer.mjs      # Generate Apple WeatherKit styled HTML

template/
└── stash.alert.handlebars  # Stash module template

modules/
└── iRingo.WeatherKit.Alert.stoverride  # Generated module
```

## Stash Module Configuration

```yaml
http:
  mitm:
    - "www.qweather.com"
  script:
    - match: ^https?:\/\/www\.qweather\.com\/severe-weather\/
      name: WeatherKit.alert.response
      type: response
      require-body: true

script-providers:
  WeatherKit.alert.response:
    url: https://github.com/stellarhalo/WeatherKitAlert/releases/download/{version}/alert.bundle.js
    interval: 86400
```

## Key Implementation Points

### HTML Parser (`parser.mjs`)

Extract from qweather page:
- Alert title (e.g., "上海市金山区气象台发布大风黄色预警")
- Description text
- Publish time
- Affected region
- Alert level (蓝/黄/橙/红)

### Apple Style Renderer (`renderer.mjs`)

Generate HTML matching Apple WeatherKit alertDetails format:
- Clean, minimal design
- Apple SF Pro typography
- Alert level color coding
- Responsive layout for WebView

### Error Handling

- Parse failure: Return original qweather page with fallback styling
- Network error: Pass through original response unchanged
- Invalid content: Show user-friendly error message

## Standalone Deployment

This feature is independent from the main WeatherKit weather data functionality:
- Separate entry point (`src/alert/index.js`)
- Separate Stash module (`iRingo.WeatherKit.Alert.stoverride`)
- Separate build configuration
- Can be deployed without affecting existing WeatherKit features

## Testing

1. Enable Stash override module
2. Open iOS Weather app
3. Navigate to a region with active alerts (e.g., 上海)
4. Tap on a weather alert
5. Verify the alert displays in Apple WeatherKit style
