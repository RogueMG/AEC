// GitHub Pages serves 404.html for any path it has no file for, such as /AEC/products/mro.
// Copying the app shell there lets the router render that page. Studio deep links
// (/AEC/studio/structure/…) are sent to the Studio's own entry point instead.
import { readFileSync, writeFileSync } from "node:fs";

const base = "/AEC/";
const html = readFileSync("dist/index.html", "utf8");
const redirect = `<script>if(location.pathname.indexOf(${JSON.stringify(`${base}studio`)})===0&&location.pathname!==${JSON.stringify(`${base}studio/`)})location.replace(${JSON.stringify(`${base}studio/`)})</script>`;

writeFileSync("dist/404.html", html.replace("<head>", `<head>${redirect}`));
console.log("Wrote dist/404.html");
