// server.js — reset minimal Express 5-safe
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const distDir = path.join(__dirname, "dist");
const indexHtml = path.join(distDir, "index.html");
const port = Number(process.env.PORT) || 8080;

// --- marqueur unique pour reconnaître la bonne révision ---
console.log("=== RANKO SERVER vMINIMAL #A17 ===");
console.log("CWD:", process.cwd());

// statique (aucun wildcard)
app.use(express.static(distDir, { index: false }));

// santé (chemin exact)
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// racine (chemin exact)
app.get("/", (_req, res) => {
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  return res.status(500).send("index.html manquant");
});

// fallback SPA (RegExp, pas de '*')
app.get(/^(?!.*\.[^/]+$).*/, (_req, res) => {
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  return res.status(500).send("index.html manquant (fallback)");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on 0.0.0.0:${port}`);
});
