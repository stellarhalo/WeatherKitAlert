import { parseAlertHTML } from "./parser.mjs";
import { renderAppleAlert } from "./renderer.mjs";

/***************** Processing *****************/

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

$done({ response: $response });