import { parseAlertHTML } from "./parser.mjs";
import { renderAppleAlert } from "./renderer.mjs";

/***************** Processing *****************/

if ($response?.body && typeof $response.body === "string") {
    const alerts = parseAlertHTML($response.body);
    if (alerts.length > 0) {
        $response.body = renderAppleAlert(alerts);
        // Update content type to HTML
        if ($response.headers) {
            $response.headers["Content-Type"] = "text/html; charset=utf-8";
            delete $response.headers["Content-Length"];
            delete $response.headers["content-length"];
        }
    }
}

$done({ response: $response });