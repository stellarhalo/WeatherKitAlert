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
    // Match common weather types
    const typePatterns = ["高温", "暴雨", "大风", "雷电", "冰雹", "大雾", "霾", "道路结冰", "寒潮", "霜冻", "暴雪", "强对流", "台风", "干旱"];
    let type = "";
    for (const pattern of typePatterns) {
        if (title.includes(pattern)) {
            type = pattern;
            break;
        }
    }

    // Extract publish time
    const timeMatch = card.match(/发布日期：([\d\-T:+]+)/);
    const publishTime = timeMatch ? timeMatch[1] : "";

    // Extract description text
    const descMatch = card.match(/<p class="warning-events__txt">(.*?)<\/p>/s);
    const description = descMatch ? decodeHTML(descMatch[1].trim()) : "";

    // Extract explanation
    const explainMatch = card.match(/<div class="warning-explain">[\s\S]*?<p>(.*?)<\/p>/s);
    const explanation = explainMatch ? decodeHTML(explainMatch[1].trim()) : "";

    // Extract defense guidelines - search in full HTML (not just card) to avoid nested div issues
    const guidelines = [];
    // Pattern 1: warning-defense__txt with p tags
    const guideMatch1 = html.match(/<div class="warning-defense__txt">([\s\S]*?)<\/div>/);
    if (guideMatch1) {
        const pMatches = guideMatch1[1].matchAll(/<p>(.*?)<\/p>/g);
        for (const m of pMatches) {
            guidelines.push(decodeHTML(m[1].trim()));
        }
    }
    // Pattern 2: warning-defense with p tags (alternative structure)
    if (guidelines.length === 0) {
        const guideMatch2 = html.match(/<div class="warning-defense">([\s\S]*?)<\/div>/);
        if (guideMatch2) {
            const pMatches = guideMatch2[1].matchAll(/<p>(.*?)<\/p>/g);
            for (const m of pMatches) {
                guidelines.push(decodeHTML(m[1].trim()));
            }
        }
    }

    // Extract region info - try multiple patterns
    let region = "";
    // Pattern 1: h1 tag with c-submenu__location
    const regionMatch1 = html.match(/<h1 class="c-submenu__location">(.*?)<\/h1>/);
    if (regionMatch1) {
        region = decodeHTML(regionMatch1[1]);
    }
    // Pattern 2: div tag with c-submenu__location
    if (!region) {
        const regionMatch2 = html.match(/<div class="c-submenu__location">(.*?)<\/div>/);
        if (regionMatch2) {
            region = decodeHTML(regionMatch2[1]);
        }
    }
    // Pattern 3: Any element with c-submenu__location
    if (!region) {
        const regionMatch3 = html.match(/class="c-submenu__location"[^>]*>(.*?)</);
        if (regionMatch3) {
            region = decodeHTML(regionMatch3[1]);
        }
    }
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