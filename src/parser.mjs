/**
 * Parse qweather severe-weather HTML into structured AlertData array
 * Extracts ALL alert cards from the page, supporting multi-alert display
 * @param {string} html - Raw HTML from qweather.com
 * @returns {import('./types.d.ts').AlertData[]}
 */
export function parseAlertHTML(html) {
    if (!html || typeof html !== "string") return [];

    // Extract region info once from top-level HTML (shared across all alerts)
    var region = extractRegion(html);
    var parentRegion = extractParentRegion(html);

    // Find all alert card blocks using div-counting for correct nesting
    var cards = extractAlertCards(html);
    if (cards.length === 0) return [];

    var results = [];
    for (var i = 0; i < cards.length; i++) {
        var alert = parseSingleCard(cards[i], region, parentRegion);
        if (alert) {
            results.push(alert);
        }
    }
    return results;
}

/**
 * Extract all c-city-warning-events card HTML blocks from the page
 * Uses div-counting to correctly handle nested HTML
 */
function extractAlertCards(html) {
    var cards = [];
    var startTag = '<div class="c-city-warning-events';
    var pos = 0;

    while (true) {
        var startIdx = html.indexOf(startTag, pos);
        if (startIdx === -1) break;

        // Find end of opening tag
        var tagEnd = html.indexOf('>', startIdx);
        if (tagEnd === -1) break;

        // Verify it has a warning-- level class
        var openTag = html.substring(startIdx, tagEnd + 1);
        var levelMatch = openTag.match(/warning--(\w+)/);
        if (!levelMatch) {
            pos = tagEnd + 1;
            continue;
        }

        // Find matching closing div by counting nesting depth
        var endIdx = findMatchingClose(html, tagEnd + 1);
        if (endIdx === -1) {
            pos = tagEnd + 1;
            continue;
        }

        cards.push(html.substring(startIdx, endIdx));
        pos = endIdx;
    }

    return cards;
}

/**
 * Find index after the matching close-tag by counting div nesting depth.
 * startPos should be just past the > of the opening div tag (depth starts at 1).
 */
function findMatchingClose(html, startPos) {
    var depth = 1;
    var i = startPos;
    var len = html.length;

    while (i < len) {
        if (html[i] !== '<') { i++; continue; }

        // HTML comment
        if (html.substring(i, i + 4) === '<!--') {
            var commentEnd = html.indexOf('-->', i + 4);
            if (commentEnd === -1) return -1;
            i = commentEnd + 3;
            continue;
        }

        // Closing tag
        if (html[i + 1] === '/') {
            depth--;
            if (depth === 0) {
                var closeEnd = html.indexOf('>', i);
                return closeEnd + 1;
            }
            i = html.indexOf('>', i) + 1;
            continue;
        }

        // Opening tag — count it if not void or self-closing
        var tagNameMatch = html.substring(i).match(/^<(\w+)/);
        if (tagNameMatch) {
            var tagName = tagNameMatch[1].toLowerCase();
            var voidElements = {
                area: true, base: true, br: true, col: true, embed: true,
                hr: true, img: true, input: true, link: true, meta: true,
                param: true, source: true, track: true, wbr: true
            };
            var gtPos = html.indexOf('>', i);
            var isSelfClosing = gtPos !== -1 && html.substring(gtPos - 1, gtPos + 1) === '/>';
            if (!voidElements[tagName] && !isSelfClosing) {
                depth++;
            }
        }
        i = html.indexOf('>', i) + 1;
        if (i === 0) i = len;
    }
    return -1;
}

/**
 * Parse a single alert card HTML into AlertData
 */
function parseSingleCard(cardHTML, region, parentRegion) {
    // Extract alert level from CSS class
    var levelMatch = cardHTML.match(/warning--(blue|yellow|orange|red)/);
    var level = levelMatch ? levelMatch[1] : "blue";

    // Extract title from h3
    var titleMatch = cardHTML.match(/<h3>(.*?)<\/h3>/);
    var title = titleMatch ? decodeHTML(titleMatch[1]) : "";
    if (!title) return null;

    // Extract alert type from title
    var type = extractType(title);

    // Extract publish time
    var timeMatch = cardHTML.match(/发布日期：([\d\-T:+]+)/);
    var publishTime = timeMatch ? timeMatch[1] : "";

    // Extract description
    var descMatch = cardHTML.match(/<p class="warning-events__txt">(.*?)<\/p>/s);
    var description = descMatch ? decodeHTML(descMatch[1].trim()) : "";

    // Extract explanation (optional)
    var explainMatch = cardHTML.match(/<div class="warning-explain">[\s\S]*?<p>(.*?)<\/p>/s);
    var explanation = explainMatch ? decodeHTML(explainMatch[1].trim()) : "";

    // Extract defense guidelines (optional)
    var guidelines = [];
    var guideMatch = cardHTML.match(/<div class="warning-defense__txt">([\s\S]*?)<\/div>/);
    if (guideMatch) {
        var pMatches = guideMatch[1].matchAll(/<p>(.*?)<\/p>/g);
        for (var m of pMatches) {
            guidelines.push(decodeHTML(m[1].trim()));
        }
    }

    return {
        title: title,
        level: level,
        type: type,
        publishTime: publishTime,
        description: description,
        explanation: explanation,
        guidelines: guidelines,
        region: region,
        parentRegion: parentRegion,
    };
}

/**
 * Extract alert type from title (e.g. "高温" from "高温橙色预警")
 */
function extractType(title) {
    var typePatterns = [
        "高温", "暴雨", "大风", "雷电", "冰雹", "大雾", "霾",
        "道路结冰", "寒潮", "霜冻", "暴雪", "强对流", "台风", "干旱"
    ];
    for (var i = 0; i < typePatterns.length; i++) {
        if (title.indexOf(typePatterns[i]) !== -1) {
            return typePatterns[i];
        }
    }
    return "";
}

/**
 * Extract region name from top-level HTML
 */
function extractRegion(html) {
    var region = "";
    var regionMatch = html.match(/<h1 class="c-submenu__location">(.*?)<\/h1>/);
    if (regionMatch) {
        region = decodeHTML(regionMatch[1]);
    }
    if (!region) {
        regionMatch = html.match(/<div class="c-submenu__location">(.*?)<\/div>/);
        if (regionMatch) {
            region = decodeHTML(regionMatch[1]);
        }
    }
    if (!region) {
        regionMatch = html.match(/class="c-submenu__location"[^>]*>(.*?)</);
        if (regionMatch) {
            region = decodeHTML(regionMatch[1]);
        }
    }
    return region;
}

/**
 * Extract parent region name from top-level HTML
 */
function extractParentRegion(html) {
    var parentMatch = html.match(/<p class="c-submenu__location-adm">(.*?)\s*-/);
    return parentMatch ? decodeHTML(parentMatch[1].trim()) : "";
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