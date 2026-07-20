/**
 * Render Apple WeatherKit-styled multi-alert HTML page
 * Uses Apple's original CSS and DOM structure, only replaces text content
 * Single alert: card expanded, title without count
 * Multiple alerts: all collapsed, title with "X 则"
 * @param {import('./types.d.ts').AlertData[]} alerts
 * @returns {string} Complete HTML page
 */
export function renderAppleAlert(alerts) {
    if (!alerts || alerts.length === 0) return "";

    var severityLabels = {
        blue: "\u8f7b\u5fae",
        yellow: "\u4e2d\u5ea6",
        orange: "\u8f83\u91cd",
        red: "\u4e25\u91cd",
    };

    var severityDescriptions = {
        blue: "\u5bf9\u751f\u547d\u6216\u8d22\u4ea7\u51e0\u4e4e\u6ca1\u6709\u5df2\u77e5\u5a01\u80c1",
        yellow: "\u53ef\u80fd\u9020\u6210\u5a01\u80c1",
        orange: "\u53ef\u80fd\u9020\u6210\u91cd\u5927\u5a01\u80c1",
        red: "\u53ef\u80fd\u9020\u6210\u6781\u7aef\u5a01\u80c1",
    };

    // Page title: determine based on severity levels
    // orange/red = "极端天气警报", otherwise = "恶劣天气警报"
    var alertCount = alerts.length;
    var isExtreme = false;
    for (var i = 0; i < alerts.length; i++) {
        if (alerts[i].level === "orange" || alerts[i].level === "red") {
            isExtreme = true;
            break;
        }
    }
    var titleSuffix = isExtreme ? "\u6781\u7aef\u5929\u6c14\u8b66\u62a5" : "\u6076\u52a3\u5929\u6c14\u8b66\u62a5";
    // Single alert: just "恶劣天气警报"/"极端天气警报", no "1 则"
    // Multiple alerts: "3 则恶劣天气警报"/"3 则极端天气警报"
    var pageTitle = alertCount >= 2 ? alertCount + " \u5219" + titleSuffix : titleSuffix;

    // Build cards
    // Single alert: expanded; multiple alerts: all collapsed
    var isSingle = alertCount === 1;
    var cardsHTML = "";
    for (var i = 0; i < alerts.length; i++) {
        cardsHTML += renderCard(alerts[i], severityLabels, severityDescriptions, isSingle);
    }

    var html = '<!DOCTYPE html><html lang="zh-CN"><head>\n';
    html += '<meta charset="utf-8">\n';
    html += '<meta name="viewport" content="width=device-width,initial-scale=1">\n';
    html += '<meta name="disabled-adaptations" content="watch">\n';
    html += '<meta name="color-scheme" content="light dark">\n';
    html += '<title>' + pageTitle + '</title>\n';
    html += '<link href="https://weatherkit.apple.com/alertDetails/weather_alert.d0054c35839929383291.css" rel="stylesheet">\n';
    html += '</head><body>\n';
    html += '<div id="content-frame">\n';
    html += '<div class="alerts-wrapper"><span class="WarningSymbol " style="height: 12px;"><svg viewBox="0 0 100.5380859375 92.6259765625" version="1.1" xmlns="http://www.w3.org/2000/svg" class=" glyph-box" style="height: 44.6961px; width: 48.514px;"><g transform="matrix(1 0 0 1 -9.9609228515626 81.54296875)"><path d="M21.875 10.8887L98.584 10.8887C105.908 10.8887 110.498 5.61523 110.498-1.02539C110.498-3.02734 110.01-5.0293 108.936-6.88477L70.5078-75.4883C68.3105-79.4434 64.2578-81.543 60.2539-81.543C56.2012-81.543 52.1484-79.4434 49.9512-75.4883L11.5723-6.83594C10.5469-4.98047 9.96094-3.02734 9.96094-1.02539C9.96094 5.61523 14.5508 10.8887 21.875 10.8887ZM60.2539-21.7285C57.7148-21.7285 56.3477-23.1934 56.2988-25.7812L55.6152-52.3438C55.5664-54.9316 57.4707-56.7871 60.2051-56.7871C62.8906-56.7871 64.8926-54.8828 64.8438-52.2949L64.1602-25.7812C64.1113-23.1445 62.6953-21.7285 60.2539-21.7285ZM60.2539-5.37109C57.373-5.37109 54.834-7.71484 54.834-10.5957C54.834-13.5254 57.3242-15.8691 60.2539-15.8691C63.2324-15.8691 65.7227-13.5742 65.7227-10.5957C65.7227-7.66602 63.1836-5.37109 60.2539-5.37109Z"></path></g></svg></span><h1 class="alerts-title">' + pageTitle + '</h1><div class="alerts-container">\n';
    html += cardsHTML;
    html += '</div></div>\n';
    html += '</div>\n';
    html += '</body></html>';
    return html;
}

/**
 * Render a single alert card
 * Single alert: expanded; multiple alerts: collapsed
 */
function renderCard(alert, severityLabels, severityDescriptions, isSingle) {
    var severityLabel = severityLabels[alert.level] || "\u672a\u77e5";
    var severityDescription = severityDescriptions[alert.level] || "\u672a\u77e5\u4e25\u91cd\u7a0b\u5ea6";

    // Single alert: expanded; multiple alerts: collapsed
    var cardClass = isSingle ? "card expanded " : "card  ";

    // Single alert: chevron-down; multiple alerts: chevron-right
    var chevronClass = isSingle ? "chevron-down" : "chevron-right";

    // Single alert: max-height 9999px; multiple alerts: 0px (collapsed)
    var contentsStyle = isSingle ? ' style="max-height: 9999px;"' : ' style="max-height: 0px;"';

    // Build content sections
    var contentHTML = "";

    // Severity section
    contentHTML += '<div class="content"><div class="content-title">\u4e25\u91cd\u7a0b\u5ea6\uff1a' + severityLabel + '</div><div class="content-body">' + escapeHTML(severityDescription) + '</div></div>';

    // Explanation section (if exists)
    if (alert.explanation) {
        contentHTML += '<div class="content"><div class="content-title">\u9884\u8b66\u8bf4\u660e</div><div class="content-body">' + escapeHTML(alert.explanation) + '</div></div>';
    }

    // Description section
    contentHTML += '<div class="content"><div class="content-title">\u63cf\u8ff0</div><div class="content-body">' + escapeHTML(alert.description) + '</div></div>';

    // Guidelines (if exists)
    if (alert.guidelines.length > 0) {
        for (var g = 0; g < alert.guidelines.length; g++) {
            contentHTML += '<div class="content"><div class="content-body">' + escapeHTML(alert.guidelines[g]) + '</div></div>';
        }
    }

    // Issuer section (hardcoded to 国家预警信息发布中心)
    contentHTML += '<div class="content"><div class="content-title">\u7b7e\u53d1\u8005</div><div class="content-body">\u56fd\u5bb6\u9884\u8b66\u4fe1\u606f\u53d1\u5e03\u4e2d\u5fc3</div></div>';

    // The toggle onclick JavaScript (using \x27 to escape single quotes)
    var onclickJS = "var p=this.parentElement;p.classList.toggle(\x27expanded\x27);var c=p.querySelector(\x27.contents\x27);c.style.maxHeight=c.style.maxHeight===\x270px\x27?\x279999px\x27:\x270px\x27;var s=p.querySelector(\x27.ChevronSymbol\x27);s.classList.toggle(\x27chevron-right\x27);s.classList.toggle(\x27chevron-down\x27);";

    // Build card
    var card = '<div class="' + cardClass + '"><div class="background-cover"></div>';
    card += '<div class="header" onclick="' + onclickJS + '"><div class="corner-cover"></div><div class="headline"><div class="content-title">' + escapeHTML(alert.title) + '</div><div><span class="ChevronSymbol ' + chevronClass + ' " style="height: 12px;"><svg viewBox="0 0 90.778076171875 54.6396484375" version="1.1" xmlns="http://www.w3.org/2000/svg" class=" glyph-box" style="height: 12px; width: 12px;"><g transform="matrix(1 0 0 1 -9.465986328124927 62.5498046875)"><path d="M56.3477-7.91016C58.3496-7.91016 60.0586-8.69141 61.6211-10.3027L98.3398-47.8516C99.6094-49.1211 100.244-50.6348 100.244-52.4414C100.244-56.1035 97.3145-59.082 93.6523-59.082C91.8945-59.082 90.1855-58.3008 88.8672-56.9824L56.3965-23.584L23.8281-56.9824C22.5098-58.3008 20.8496-59.082 18.9941-59.082C15.3809-59.082 12.4512-56.1035 12.4512-52.4414C12.4512-50.6348 13.1348-49.1211 14.3555-47.8516L51.0742-10.2539C52.6855-8.69141 54.3457-7.91016 56.3477-7.91016Z"></path></g></svg></span></div></div></div>';
    card += '<div class="contents"' + contentsStyle + '>' + contentHTML + '</div>';
    card += '<div class="footer"><div class="corner-cover"></div><div class="corners"></div></div></div>\n';
    return card;
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