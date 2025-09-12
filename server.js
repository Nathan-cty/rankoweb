// server.js (ESM, Express 5, Vite SPA)
import express from "express";
import compression from "compression";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// --------- setup fichiers & variables ---------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, "dist");
const indexHtml = path.join(distDir, "index.html");

const port = Number(process.env.PORT) || 8080;
const host = "0.0.0.0";

// --------- logs démarrage ---------
console.log("🔎 CWD:", process.cwd());
console.log("🔎 NODE_ENV:", process.env.NODE_ENV);
console.log("🔎 PORT (env):", port);

if (fs.existsSync(distDir)) {
  console.log("✅ dist/ présent. Contenu:", fs.readdirSync(distDir));
  if (!fs.existsSync(indexHtml)) {
    console.error("❌ dist/index.html manquant !");
  }
} else {
  console.error("❌ dist/ introuvable. As-tu fait `vite build` ?");
}

// --------- création app ---------
const app = express();
app.disable("x-powered-by");
app.use(compression());

// (facultatif) petit log de requêtes utile en debug production
app.use((req, res, next) => {
  res.on("finish", () => console.log(`[req] ${req.method} ${req.url} -> ${res.statusCode}`));
  next();
});

// --------- fichiers statiques ---------
// index:false pour ne pas court-circuiter notre route "/" custom
app.use(
  express.static(distDir, {
    index: false,
    fallthrough: true,
    setHeaders: (res, filePath) => {
      if (/\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|webp|svg|gif|woff2)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=300");
      }
    },
  })
);

// --------- endpoints santé ---------
// dédiés au debug / Cloud Run "pur". App Hosting tape souvent "/".
const health = (_req, res) => res.status(200).send("ok");
app.get(["/healthz", "/_ah/health", "/readyz"], health);
app.head(["/healthz", "/_ah/health", "/readyz"], (_req, res) => res.sendStatus(200));

// --------- racine ---------
// GET "/" : sert l'app (index.html)
app.get("/", (_req, res) => {
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(500).send("index.html manquant dans dist/");
  }
});

// HEAD "/" : renvoie 200 rapidement (utile si la sonde utilise HEAD)
app.head("/", (_req, res) => res.sendStatus(200));

// --------- favicon ---------
app.get("/favicon.ico", (_req, res) => {
  const iconPath = path.join(distDir, "favicon.ico");
  if (fs.existsSync(iconPath)) return res.sendFile(iconPath);
  res.status(204).end();
});

// --------- fallback SPA ---------
// ⚠️ Express 5 + path-to-regexp v6 : ne pas utiliser '*'.
// Ici : toutes les routes "sans extension" retombent sur index.html.
app.get(/^(?!.*\.[^/]+$).*/, (_req, res) => {
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(500).send("index.html manquant (fallback SPA).");
  }
});

// --------- 404 (optionnel ; rarement atteint avec le fallback) ---------
app.use((_req, res) => res.status(404).send("Not found"));

// --------- lancement ---------
app.listen(port, host, () => {
  console.log(`✅ Server listening on http://${host}:${port}`);
});

// heartbeat (debug)
setInterval(() => console.log("💓 heartbeat"), 20000);
