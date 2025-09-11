// server.js
import express from "express";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier du build Vite
const distDir = path.join(__dirname, "dist");
const indexHtml = path.join(distDir, "index.html");

const app = express();
app.disable("x-powered-by");
app.use(compression());

// Sert les assets du dossier "dist"
app.use(
  express.static(distDir, {
    fallthrough: true,
    setHeaders: (res, filePath) => {
      // Cache long pour les fichiers fingerprintés (xxx.[hash].js|css|img|font)
      if (/\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|webp|avif|svg|gif|woff2)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        // Cache court par défaut
        res.setHeader("Cache-Control", "public, max-age=300");
      }
    },
  })
);

// Fallback SPA (React Router) : toute route non fichier -> index.html
app.get("*", (_req, res) => {
  res.sendFile(indexHtml);
});

// eslint-disable-next-line no-undef
const port = process.env.PORT || 8080;
// IMPORTANT: écouter sur 0.0.0.0 (Cloud Run / App Hosting)
app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-undef
  console.log(`✅ Server listening on http://0.0.0.0:${port}`);
});
