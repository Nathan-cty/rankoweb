// server.js (ESM, pour "type": "module")
import express from "express";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, "dist");
const indexHtml = path.join(distDir, "index.html");

const app = express();
app.disable("x-powered-by");
app.use(compression());

// Servir les assets compilés
app.use(
  express.static(distDir, {
    index: false, // on laisse le fallback gérer index.html
    fallthrough: true,
    setHeaders: (res, filePath) => {
      // Cache long pour les fichiers fingerprintés (xxx.[hash].ext)
      if (/\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|webp|avif|svg|gif|woff2)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=300");
      }
    },
  })
);

// ✅ Fallback SPA pour toutes les routes non-fichiers
// (la RegExp marche en Express 5, contrairement à '*')
app.get(/.*/, (req, res) => {
  res.sendFile(indexHtml);
});

// eslint-disable-next-line no-undef
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-undef
  console.log(`✅ Server listening on http://0.0.0.0:${port}`);
});
