// server.js (ESM, compatible avec "type": "module")
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

// Sert les fichiers générés par Vite (dist/)
app.use(
  express.static(distDir, {
    index: false,         // on gère index.html nous-mêmes
    fallthrough: true,    // laisse passer aux handlers suivants si non trouvé
    setHeaders: (res, filePath) => {
      // Cache long pour les assets fingerprintés (xxx.[hash].ext)
      if (/\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|webp|avif|svg|gif|woff2)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=300");
      }
    },
  })
);

// ✅ Fallback SPA uniquement pour les routes "non-fichiers"
// (évite de renvoyer index.html pour /assets/*.js)
app.get("*", (req, res, next) => {
  // si l'URL ressemble à un fichier (a une extension), ne pas fallback
  const looksLikeFile = /\.[^/]+$/.test(req.path);
  if (looksLikeFile) return next();

  // (optionnel) si tu as des routes d'API côté serveur, exclue-les :
  // if (req.path.startsWith("/api")) return next();

  res.sendFile(indexHtml);
});

// 404 propre pour ce qui n'a pas été servi plus haut
app.use((req, res) => {
  res.status(404).send("Not found");
});

// eslint-disable-next-line no-undef
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-undef
  console.log(`✅ Server listening on http://0.0.0.0:${port}`);
});
