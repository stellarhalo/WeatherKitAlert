import { parseAlertHTML } from "./parser.mjs";
import { renderAppleAlert } from "./renderer.mjs";

/***************** Processing *****************/

/**
 * Quantumult X uses a different API than Surge/Stash/Loon:
 *   - QX: $done({body: newBody, headers: {...}})
 *   - Surge/Stash/Loon: $response.body = newBody; $done({ response: $response })
 * Detect QX by checking for $task global.
 */
const isQX = typeof $task !== "undefined";

if (isQX) {
    // Quantumult X
    if ($response?.body && typeof $response.body === "string") {
        const alerts = parseAlertHTML($response.body);
        if (alerts.length > 0) {
            const body = renderAppleAlert(alerts);
            const headers = { ...($response.headers ?? {}) };
            headers["Content-Type"] = "text/html; charset=utf-8";
            headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            headers["Pragma"] = "no-cache";
            headers["Expires"] = "0";
            delete headers["Content-Length"];
            delete headers["content-length"];
            $done({ body, headers });
        } else {
            $done({});
        }
    } else {
        $done({});
    }
} else {
    // Surge / Stash / Loon / EGERN
    if ($response?.body && typeof $response.body === "string") {
        const alerts = parseAlertHTML($response.body);
        if (alerts.length > 0) {
            $response.body = renderAppleAlert(alerts);
            // Update content type to HTML and prevent browser caching
            if ($response.headers) {
                $response.headers["Content-Type"] = "text/html; charset=utf-8";
                $response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
                $response.headers["Pragma"] = "no-cache";
                $response.headers["Expires"] = "0";
                delete $response.headers["Content-Length"];
                delete $response.headers["content-length"];
            }
        }
    }

    $done({ response: $response });
}