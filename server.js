// server.js (ESM, Express 5) — hardened
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

// --- BOOT LOGS ---
console.log("🔎 CWD:", process.cwd());
console.log("🔎 NODE_ENV:", process.env.NODE_ENV);
console.log("🔎 PORT (env):", process.env.PORT);
try {
  if (!fs.existsSync(distDir)) {
    console.error("❌ dist/ introuvable. `vite build` a-t-il bien tourné PENDANT le BUILD ?");
  } else {
    console.log("✅ dist/ présent. Contenu:", fs.readdirSync(distDir));
    if (!fs.existsSync(indexHtml)) console.error("❌ dist/index.html introuvable.");
  }
} catch (e) {
  console.error("❌ Erreur en lisant dist/:", e);
}

// --- HEALTH ENDPOINTS ---
app.get("/healthz", (_req, res) => res.status(200).send("ok"));
app.get("/_ah/health", (_req, res) => res.status(200).send("ok"));

// --- REQUEST LOGGER ---
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on("finish", () => {
    const dt = Date.now() - t0;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${dt}ms)`);
  });
  next();
});

// --- favicon par défaut pour éviter 500 ---
app.get("/favicon.ico", (req, res) => {
  const iconPath = path.join(distDir, "favicon.ico");
  if (fs.existsSync(iconPath)) return res.sendFile(iconPath);
  const EMPTY_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).send(EMPTY_GIF);
});

// --- STATIC FILES ---
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

// --- SPA FALLBACK UNIQUEMENT pour routes sans extension ---
app.get(/^(?!.*\.[^/]+$).*/, (_req, res) => {
  if (!fs.existsSync(indexHtml)) {
    console.error("❌ index.html manquant au runtime.");
    return res.status(500).send("Build manquant (index.html absent).");
  }
  res.sendFile(indexHtml);
});

// --- 404 + error handler ---
app.use((_req, res) => res.status(404).send("Not found"));
app.use((err, _req, res, _next) => {
  console.error("💥 Unhandled error:", err);
  res.status(500).send("Internal Server Error");
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server listening on http://0.0.0.0:${port}`);
});
