import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// SINGLE=1 -> one self-contained HTML (images inlined) for the Claude artifact preview.
// Default -> normal static build for Coolify/Railpack (dist/ served by Caddy).
const single = process.env.SINGLE === "1";

export default defineConfig({
  plugins: single ? [viteSingleFile()] : [],
  build: {
    outDir: single ? "dist-single" : "dist",
    assetsInlineLimit: single ? 100_000_000 : 4096,
  },
});
