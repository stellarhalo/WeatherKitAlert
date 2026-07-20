/**
 * Render Apple WeatherKit-styled alert HTML
 * Uses Apple's original CSS and DOM structure, only replaces text content
 * @param {import('./types.d.ts').AlertData} alert
 * @returns {string} Complete HTML page
 */
export function renderAppleAlert(alert) {
    const severityLabels = {
        blue: "轻微",
        yellow: "中度",
        orange: "较重",
        red: "严重",
    };
    const severityLabel = severityLabels[alert.level] || "未知";

    const severityDescriptions = {
        blue: "对生命或财产几乎没有已知威胁",
        yellow: "可能造成威胁",
        orange: "可能造成重大威胁",
        red: "可能造成极端威胁",
    };
    const severityDescription = severityDescriptions[alert.level] || "未知严重程度";

    var guidelinesHTML = "";
    if (alert.guidelines.length > 0) {
        guidelinesHTML = alert.guidelines.map(function(g) {
            return '<div class="content"><div class="content-body">' + escapeHTML(g) + '</div></div>';
        }).join("");
    }

    var explanationHTML = "";
    if (alert.explanation) {
        explanationHTML = '<div class="content"><div class="content-title">预警说明</div><div class="content-body">' + escapeHTML(alert.explanation) + '</div></div>';
    }

    // Apple's exact page structure - only text content changes (using string concat to avoid backticks in output)
    var html = '<!DOCTYPE html><html lang="zh-CN"><head>\n';
    html += '<meta charset="utf-8">\n';
    html += '<meta name="viewport" content="width=device-width,initial-scale=1">\n';
    html += '<meta name="disabled-adaptations" content="watch">\n';
    html += '<meta name="color-scheme" content="light dark">\n';
    html += '<title>\u6076\u52a3\u5929\u6c14\u8b66\u62a5</title>\n';
    html += '<link href="https://weatherkit.apple.com/alertDetails/weather_alert.d0054c35839929383291.css" rel="stylesheet">\n';
    html += '</head><body>\n';
    html += '<div id="content-frame">\n';
    html += '<div class="alerts-wrapper"><span class="WarningSymbol " style="height: 12px;"><svg viewBox="0 0 100.5380859375 92.6259765625" version="1.1" xmlns="http://www.w3.org/2000/svg" class=" glyph-box" style="height: 44.6961px; width: 48.514px;"><g transform="matrix(1 0 0 1 -9.9609228515626 81.54296875)"><path d="M21.875 10.8887L98.584 10.8887C105.908 10.8887 110.498 5.61523 110.498-1.02539C110.498-3.02734 110.01-5.0293 108.936-6.88477L70.5078-75.4883C68.3105-79.4434 64.2578-81.543 60.2539-81.543C56.2012-81.543 52.1484-79.4434 49.9512-75.4883L11.5723-6.83594C10.5469-4.98047 9.96094-3.02734 9.96094-1.02539C9.96094 5.61523 14.5508 10.8887 21.875 10.8887ZM60.2539-21.7285C57.7148-21.7285 56.3477-23.1934 56.2988-25.7812L55.6152-52.3438C55.5664-54.9316 57.4707-56.7871 60.2051-56.7871C62.8906-56.7871 64.8926-54.8828 64.8438-52.2949L64.1602-25.7812C64.1113-23.1445 62.6953-21.7285 60.2539-21.7285ZM60.2539-5.37109C57.373-5.37109 54.834-7.71484 54.834-10.5957C54.834-13.5254 57.3242-15.8691 60.2539-15.8691C63.2324-15.8691 65.7227-13.5742 65.7227-10.5957C65.7227-7.66602 63.1836-5.37109 60.2539-5.37109Z"></path></g></svg></span><h1 class="alerts-title">\u6076\u52a3\u5929\u6c14\u8b66\u62a5</h1><div class="alerts-container"><div class="card expanded single-event"><div class="background-cover"></div><div class="header" onclick="var p=this.parentElement;p.classList.toggle(\x27expanded\x27);var c=p.querySelector(\x27.contents\x27);c.style.maxHeight=c.style.maxHeight===\x270px\x27?\x279999px\x27:\x270px\x27;var s=p.querySelector(\x27.ChevronSymbol\x27);s.classList.toggle(\x27chevron-right\x27);s.classList.toggle(\x27chevron-down\x27);"><div class="corner-cover"></div><div class="headline"><div class="content-title">' + escapeHTML(alert.title) + '</div><div><span class="ChevronSymbol chevron-down " style="height: 12px;"><svg viewBox="0 0 90.778076171875 54.6396484375" version="1.1" xmlns="http://www.w3.org/2000/svg" class=" glyph-box" style="height: 12px; width: 12px;"><g transform="matrix(1 0 0 1 -9.465986328124927 62.5498046875)"><path d="M56.3477-7.91016C58.3496-7.91016 60.0586-8.69141 61.6211-10.3027L98.3398-47.8516C99.6094-49.1211 100.244-50.6348 100.244-52.4414C100.244-56.1035 97.3145-59.082 93.6523-59.082C91.8945-59.082 90.1855-58.3008 88.8672-56.9824L56.3965-23.584L23.8281-56.9824C22.5098-58.3008 20.8496-59.082 18.9941-59.082C15.3809-59.082 12.4512-56.1035 12.4512-52.4414C12.4512-50.6348 13.1348-49.1211 14.3555-47.8516L51.0742-10.2539C52.6855-8.69141 54.3457-7.91016 56.3477-7.91016Z"></path></g></svg></span></div></div></div><div class="contents" style="max-height: 9999px;"><div class="content"><div class="content-title">\u4e25\u91cd\u7a0b\u5ea6\uff1a' + severityLabel + '</div><div class="content-body">' + escapeHTML(severityDescription) + '</div></div>' + explanationHTML + '<div class="content"><div class="content-title">\u63cf\u8ff0</div><div class="content-body">' + escapeHTML(alert.description) + '</div></div>' + guidelinesHTML + '<div class="content"><div class="content-title">\u7b7e\u53d1\u8005</div><div class="content-body">' + escapeHTML(alert.parentRegion) + ' ' + escapeHTML(alert.region) + '</div></div></div><div class="footer"><div class="corner-cover"></div><div class="corners"></div></div></div></div></div>\n';
    html += '</div>\n';
    html += '</body></html>';
    return html;
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