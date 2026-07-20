# WeatherKit Alert Override Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Intercept qweather.com severe-weather alert pages and re-render them in Apple WeatherKit native alert styling via Stash override script.

**Architecture:** Standalone project in `WeatherKitAlert/` folder. Stash override intercepts qweather.com responses, a lightweight JS script parses the HTML to extract alert data (title, description, level, time, defense guidelines), then re-renders as a clean Apple-styled page. Deployed as a standalone module.

**Tech Stack:** Stash (Surge-compatible proxy), rspack bundler, ESModules (.mjs), Biome formatter

---

## File Structure

```
WeatherKitAlert/
├── package.json              # Project metadata & scripts
├── rspack.config.mjs         # Build configuration
├── biome.json                # Formatter config (inherits parent)
├── src/
│   ├── index.js              # Entry: Stash script hook
│   ├── parser.mjs            # Parse qweather HTML → structured alert data
│   ├── renderer.mjs          # Render Apple-styled HTML from alert data
│   └── types.d.ts            # TypeScript types for alert data
├── template/
│   └── stash.alert.handlebars  # Stash module template
└── modules/
    └── iRingo.WeatherKit.Alert.stoverride  # Generated Stash module
```

---

## Task 1: Create Project Structure

**Files:**
- Create: `WeatherKitAlert/package.json`
- Create: `WeatherKitAlert/rspack.config.mjs`

- [ ] **Step 1: Create package.json**

```json
// WeatherKitAlert/package.json
{
    "name": "@nsringo/weatherkit-alert",
    "displayName": "iRingo: 🌤 WeatherKit Alert Override",
    "description": "Override qweather.com severe-weather alert pages with Apple WeatherKit native styling",
    "version": "1.0.0",
    "license": "Apache-2.0",
    "scripts": {
        "build": "rspack build",
        "build:dev": "rspack build --mode=development"
    },
    "devDependencies": {
        "@rspack/cli": "^1.7.7",
        "@rspack/core": "^1.7.7"
    }
}
```

- [ ] **Step 2: Create rspack.config.mjs**

```javascript
// WeatherKitAlert/rspack.config.mjs
import { defineConfig } from "@rspack/cli";

export default defineConfig({
    entry: {
        alert: "./src/index.js",
    },
    output: {
        chunkFormat: false,
        filename: "[name].bundle.js",
        library: {
            type: "module",
        },
    },
    plugins: [],
    devtool: false,
    performance: false,
});
```

- [ ] **Step 3: Commit**

```bash
git add WeatherKitAlert/package.json WeatherKitAlert/rspack.config.mjs
git commit -m "feat(alert): create standalone project structure"
```

---

## Task 2: Define Alert Data Types

**Files:**
- Create: `WeatherKitAlert/src/types.d.ts`

- [ ] **Step 1: Create type definitions**

```typescript
// WeatherKitAlert/src/types.d.ts

/** Alert severity levels */
export type AlertLevel = "blue" | "yellow" | "orange" | "red";

/** Parsed alert data from qweather */
export interface AlertData {
    /** Alert title, e.g. "上海市气象台发布中心城区高温橙色预警" */
    title: string;
    /** Alert level */
    level: AlertLevel;
    /** Alert type name, e.g. "高温", "暴雨", "大风" */
    type: string;
    /** Publish time ISO string, e.g. "2026-07-17T07:40+08:00" */
    publishTime: string;
    /** Full description text */
    description: string;
    /** Alert explanation (触发条件) */
    explanation: string;
    /** Defense guidelines (防御指南) */
    guidelines: string[];
    /** Region name, e.g. "静安区" */
    region: string;
    /** Parent region, e.g. "上海市" */
    parentRegion: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add WeatherKitAlert/src/types.d.ts
git commit -m "feat(alert): add alert data type definitions"
```

---

## Task 3: Implement HTML Parser

**Files:**
- Create: `WeatherKitAlert/src/parser.mjs`

- [ ] **Step 1: Create parser module**

```javascript
// WeatherKitAlert/src/parser.mjs

/**
 * Parse qweather severe-weather HTML into structured AlertData
 * @param {string} html - Raw HTML from qweather.com
 * @returns {import('./types.d.ts').AlertData|null}
 */
export function parseAlertHTML(html) {
    if (!html || typeof html !== "string") return null;

    // Extract alert card content
    const alertCardMatch = html.match(/<div class="c-city-warning-events[^"]*">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
    if (!alertCardMatch) return null;
    const card = alertCardMatch[1];

    // Extract title from h3
    const titleMatch = card.match(/<h3>(.*?)<\/h3>/);
    const title = titleMatch ? decodeHTML(titleMatch[1]) : "";
    if (!title) return null;

    // Extract alert level from CSS class
    const levelMatch = html.match(/warning--(blue|yellow|orange|red)/);
    const level = levelMatch ? levelMatch[1] : "blue";

    // Extract alert type from title (e.g. "高温" from "高温橙色预警")
    const typeMatch = title.match(/发布.*?(\S+?)(?:蓝色|黄色|橙色|红色)预警/);
    const type = typeMatch ? typeMatch[1] : "";

    // Extract publish time
    const timeMatch = card.match(/发布日期：([\d\-T:+]+)/);
    const publishTime = timeMatch ? timeMatch[1] : "";

    // Extract description text
    const descMatch = card.match(/<p class="warning-events__txt">(.*?)<\/p>/s);
    const description = descMatch ? decodeHTML(descMatch[1].trim()) : "";

    // Extract explanation
    const explainMatch = card.match(/<div class="warning-explain">[\s\S]*?<p>(.*?)<\/p>/s);
    const explanation = explainMatch ? decodeHTML(explainMatch[1].trim()) : "";

    // Extract defense guidelines
    const guidelines = [];
    const guideMatch = card.match(/<div class="warning-defense__txt">([\s\S]*?)<\/div>/);
    if (guideMatch) {
        const pMatches = guideMatch[1].matchAll(/<p>(.*?)<\/p>/g);
        for (const m of pMatches) {
            guidelines.push(decodeHTML(m[1].trim()));
        }
    }

    // Extract region info
    const regionMatch = html.match(/<h1 class="c-submenu__location">(.*?)<\/h1>/);
    const region = regionMatch ? decodeHTML(regionMatch[1]) : "";
    const parentMatch = html.match(/<p class="c-submenu__location-adm">(.*?)\s*-/);
    const parentRegion = parentMatch ? decodeHTML(parentMatch[1].trim()) : "";

    return {
        title,
        level,
        type,
        publishTime,
        description,
        explanation,
        guidelines,
        region,
        parentRegion,
    };
}

/** Decode HTML entities */
function decodeHTML(str) {
    return str
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\u00a0/g, " ");
}
```

- [ ] **Step 2: Commit**

```bash
git add WeatherKitAlert/src/parser.mjs
git commit -m "feat(alert): implement qweather HTML parser"
```

---

## Task 4: Implement Apple-Style Renderer

**Files:**
- Create: `WeatherKitAlert/src/renderer.mjs`

- [ ] **Step 1: Create renderer module**

```javascript
// WeatherKitAlert/src/renderer.mjs

/**
 * Color mapping for alert levels
 * @type {Record<string, string>}
 */
const LEVEL_COLORS = {
    blue: "#007AFF",
    yellow: "#FFCC00",
    orange: "#FF9500",
    red: "#FF3B30",
};

/**
 * Icon mapping for common alert types
 * @type {Record<string, string>}
 */
const TYPE_ICONS = {
    "高温": "🌡️",
    "暴雨": "🌧️",
    "大风": "💨",
    "雷电": "⚡",
    "冰雹": "🧊",
    "大雾": "🌫️",
    "霾": "🌫️",
    "道路结冰": "❄️",
    "寒潮": "🥶",
    "霜冻": "❄️",
    "暴雪": "❄️",
    "强对流": "⛈️",
    "台风": "🌀",
    "干旱": "☀️",
};

/**
 * Render Apple WeatherKit-styled alert HTML
 * @param {import('./types.d.ts').AlertData} alert
 * @returns {string} Complete HTML page
 */
export function renderAppleAlert(alert) {
    const color = LEVEL_COLORS[alert.level] || LEVEL_COLORS.blue;
    const icon = TYPE_ICONS[alert.type] || "⚠️";
    const levelLabel = { blue: "蓝", yellow: "黄", orange: "橙", red: "红" }[alert.level] || "蓝";

    const formatTime = (isoString) => {
        if (!isoString) return "";
        try {
            const d = new Date(isoString);
            return d.toLocaleString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Shanghai",
            });
        } catch {
            return isoString;
        }
    };

    const guidelinesHTML = alert.guidelines.length > 0
        ? `
        <div class="section">
            <h2>防御指南</h2>
            <ul>
                ${alert.guidelines.map(g => `<li>${escapeHTML(g)}</li>`).join("\n                ")}
            </ul>
        </div>`
        : "";

    const explanationHTML = alert.explanation
        ? `
        <div class="section">
            <h2>预警说明</h2>
            <p>${escapeHTML(alert.explanation)}</p>
        </div>`
        : "";

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta name="color-scheme" content="light dark">
    <title>${escapeHTML(alert.title)}</title>
    <style>
        :root {
            --bg: #ffffff;
            --text: #000000;
            --text-secondary: #6e6e73;
            --separator: #c6c6c8;
            --card-bg: #f2f2f7;
            --alert-color: ${color};
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #000000;
                --text: #ffffff;
                --text-secondary: #98989d;
                --separator: #38383a;
                --card-bg: #1c1c1e;
            }
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.5;
            padding: 16px;
            padding-top: env(safe-area-inset-top, 16px);
        }
        .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        .icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: var(--alert-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            flex-shrink: 0;
        }
        .header-text h1 {
            font-size: 20px;
            font-weight: 600;
            line-height: 1.3;
        }
        .header-text .region {
            font-size: 14px;
            color: var(--text-secondary);
            margin-top: 2px;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            background: var(--alert-color);
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            margin-left: 8px;
            vertical-align: middle;
        }
        .meta {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 16px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
        }
        .section {
            margin-top: 24px;
        }
        .section h2 {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .section p {
            font-size: 16px;
            line-height: 1.6;
        }
        .section ul {
            list-style: none;
            padding: 0;
        }
        .section li {
            font-size: 16px;
            line-height: 1.6;
            padding: 8px 0;
            border-bottom: 0.5px solid var(--separator);
        }
        .section li:last-child {
            border-bottom: none;
        }
        .source {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 0.5px solid var(--separator);
            font-size: 12px;
            color: var(--text-secondary);
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="icon">${icon}</div>
        <div class="header-text">
            <h1>${escapeHTML(alert.type)}预警<span class="badge">${levelLabel}</span></h1>
            <div class="region">${escapeHTML(alert.parentRegion)} ${escapeHTML(alert.region)}</div>
        </div>
    </div>
    <div class="meta">发布于 ${formatTime(alert.publishTime)}</div>
    <div class="content">
        <p>${escapeHTML(alert.description)}</p>
        ${explanationHTML}
        ${guidelinesHTML}
    </div>
    <div class="source">预警数据来源：国家预警信息发布中心</div>
</body>
</html>`;
}

/** Escape HTML special characters */
function escapeHTML(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
```

- [ ] **Step 2: Commit**

```bash
git add WeatherKitAlert/src/renderer.mjs
git commit -m "feat(alert): implement Apple-style alert renderer"
```

---

## Task 5: Create Stash Script Entry Point

**Files:**
- Create: `WeatherKitAlert/src/index.js`

- [ ] **Step 1: Create entry point**

```javascript
// WeatherKitAlert/src/index.js
import { parseAlertHTML } from "./parser.mjs";
import { renderAppleAlert } from "./renderer.mjs";

/***************** Processing *****************/
let $response;

!(async () => {
    // Only process response body if it contains qweather alert content
    if ($response?.body && typeof $response.body === "string") {
        const alertData = parseAlertHTML($response.body);
        if (alertData) {
            $response.body = renderAppleAlert(alertData);
            // Update content type to HTML
            if ($response.headers) {
                $response.headers["Content-Type"] = "text/html; charset=utf-8";
                delete $response.headers["Content-Length"];
                delete $response.headers["content-length"];
            }
        }
    }
})()
    .catch(e => {
        console.error(`[WeatherKit Alert] Error: ${e}`);
    })
    .finally(() => {
        done({ response: $response });
    });
```

- [ ] **Step 2: Commit**

```bash
git add WeatherKitAlert/src/index.js
git commit -m "feat(alert): create Stash script entry point"
```

---

## Task 6: Create Stash Module Template

**Files:**
- Create: `WeatherKitAlert/template/stash.alert.handlebars`

- [ ] **Step 1: Create Handlebars template**

```handlebars
name: "iRingo: 🌤 Alert Override"
desc: |-
  Override qweather.com severe-weather alert pages
  with Apple WeatherKit native styling
openUrl: "http://boxjs.com/#/app/iRingo.WeatherKit.Alert"
author: |-
  VirgilClyne[https://github.com/VirgilClyne]
  WordlessEcho[https://github.com/WordlessEcho]
  001[https://github.com/001ProMax]
homepage: "https://NSRingo.github.io/guide/Weather/weather-kit"
icon: "https://developer.apple.com/assets/elements/icons/weatherkit/weatherkit-128x128.png"
category: " iRingo"
date: "{{now "yyyy-MM-dd HH:mm:ss"}}"
version: "{{@package 'version'}}"

http:
  mitm:
    - "www.qweather.com"
  script:
    - match: ^https?:\/\/www\.qweather\.com\/severe-weather\/
      name: WeatherKit.alert.response
      type: response
      require-body: true
      argument:

script-providers:
  WeatherKit.alert.response:
    url: https://github.com/stellarhalo/WeatherKitAlert/releases/download/{{@package 'version'}}/alert.bundle.js
    interval: 86400
```

- [ ] **Step 2: Commit**

```bash
git add WeatherKitAlert/template/stash.alert.handlebars
git commit -m "feat(alert): create Stash module template"
```

---

## Task 7: Build and Generate Module

**Files:**
- Generate: `WeatherKitAlert/modules/iRingo.WeatherKit.Alert.stoverride`

- [ ] **Step 1: Install dependencies**

```bash
cd WeatherKitAlert && npm install
```

- [ ] **Step 2: Build the bundle**

```bash
npm run build
```

Expected: `WeatherKitAlert/dist/alert.bundle.js` is generated

- [ ] **Step 3: Create the Stash module file**

Create `WeatherKitAlert/modules/iRingo.WeatherKit.Alert.stoverride` with the resolved template values:

```yaml
name: "iRingo: 🌤 Alert Override"
desc: |-
  Override qweather.com severe-weather alert pages
  with Apple WeatherKit native styling
openUrl: "http://boxjs.com/#/app/iRingo.WeatherKit.Alert"
author: |-
  VirgilClyne[https://github.com/VirgilClyne]
  WordlessEcho[https://github.com/WordlessEcho]
  001[https://github.com/001ProMax]
homepage: "https://NSRingo.github.io/guide/Weather/weather-kit"
icon: "https://developer.apple.com/assets/elements/icons/weatherkit/weatherkit-128x128.png"
category: " iRingo"
date: "2026-07-17 00:00:00"
version: "1.0.0"

http:
  mitm:
    - "www.qweather.com"
  script:
    - match: ^https?:\/\/www\.qweather\.com\/severe-weather\/
      name: WeatherKit.alert.response
      type: response
      require-body: true
      argument:

script-providers:
  WeatherKit.alert.response:
    url: https://github.com/stellarhalo/WeatherKitAlert/releases/download/beta/alert.bundle.js
    interval: 86400
```

- [ ] **Step 4: Commit**

```bash
git add WeatherKitAlert/dist/ WeatherKitAlert/modules/
git commit -m "feat(alert): build bundle and generate Stash module"
```

---

## Task 8: Manual Testing

- [ ] **Step 1: Load in Stash**

1. Import `WeatherKitAlert/modules/iRingo.WeatherKit.Alert.stoverride` into Stash
2. Enable the module
3. Trust the MITM certificate for `www.qweather.com`

- [ ] **Step 2: Test with real alert**

1. Open iOS Weather app
2. Navigate to a region with active alerts (e.g., 上海)
3. Tap on a weather alert
4. The page should open and display in Apple WeatherKit styling

- [ ] **Step 3: Verify dark mode**

Toggle device dark mode and verify the alert page renders correctly in both modes.

- [ ] **Step 4: Test error handling**

1. Navigate to a qweather page without alerts - should pass through unchanged
2. If parsing fails, should show original page
