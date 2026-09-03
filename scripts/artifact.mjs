// Strips the document skeleton from the single-file build so it can be published as a Claude artifact
// (the artifact host wraps the content in its own <html>/<head>/<body>).
import { readFileSync, writeFileSync } from "node:fs";

const src = "dist-single/index.html";
let html = readFileSync(src, "utf8");
html = html
  .replace(/<!doctype html>/i, "")
  .replace(/<\/?html[^>]*>/gi, "")
  .replace(/<\/?head>/gi, "")
  .replace(/<\/?body[^>]*>/gi, "")
  .replace(/<meta charset[^>]*>/gi, "")
  .trim();
writeFileSync("dist-single/artifact.html", html);
console.log(`artifact -> dist-single/artifact.html (${(html.length / 1e6).toFixed(1)} MB)`);
