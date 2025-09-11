// server.js (ESM, Express 5)
import express from "express";
import compression from "compression";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, "dist");
const indexHtml = path.join(distDir, "index.html");

const app = express();
app.disable("x-powered-by");
app.use(compression());

// Logs démarrage + SAN check
console.log("🔎 CWD:", process.cwd());
console.log("🔎 PORT:", process.env.PORT);
try {
  if (!fs.existsSync(distDir)) {
    console.error("❌ dist/ introuvable. Lance `npm run build`.");
  } else {
    console.log("✅ dist/ présent. Contenu:", fs.readdirSync(distDir));
    if (!fs.existsSync(indexHtml)) console.error("❌ dist/index.html introuvable.");
  }
} catch (e) {
  console.error("❌ Erreur en lisant dist/:", e);
}

// Fichiers statiques
app.use(
  express.static(distDir, {
    index: false,
    fallthrough: true,
    setHeaders: (res, filePath) => {
      if (/\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|webp|avif|svg|gif|woff2)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=300");
      }
    },
  })
);

// Fallback SPA : uniquement si la route n'a PAS d'extension
app.get(/^(?!.*\.[^/]+$).*/, (_req, res) => {
  if (!fs.existsSync(indexHtml)) return res.status(500).send("index.html manquant");
  res.sendFile(indexHtml);
});

// 404 pour le reste
app.use((_req, res) => res.status(404).send("Not found"));

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server listening on http://0.0.0.0:${port}`);
});
