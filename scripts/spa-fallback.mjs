// GitHub Pages serves 404.html for any path it has no file for, such as /AEC/products/mro.
// Copying the app shell there lets the router render that page.
// Remove this script when the site moves to Cloudflare Pages.
import { copyFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
console.log("Wrote dist/404.html");
