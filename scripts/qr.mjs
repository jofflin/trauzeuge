// npm run qr -- https://deine-domain.de   -> print/qr.png
import QRCode from "qrcode";
import { mkdirSync } from "node:fs";

const url = process.argv[2];
if (!url) {
  console.error("Usage: npm run qr -- <url>");
  process.exit(1);
}
mkdirSync("print", { recursive: true });
await QRCode.toFile("print/qr.png", url, { margin: 2, scale: 12 });
console.log(`QR -> print/qr.png  (${url})`);
