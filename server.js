// server.js — version minimale, compatible Express 5
import express from "express";
import compression from "compression";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
const indexHtml = path.join(distDir, "index.html");

const port = Number(process.env.PORT) || 8080;

const app = express();
app.disable("x-powered-by");
app.use(compression());

// Log utile pour voir ce que tape la sonde
app.use((req, res, next) => {
  res.on("finish", () => console.log(`[req] ${req.method} ${req.url} -> ${res.statusCode}`));
  next();
});

// 1) Fichiers statiques (aucun path, donc pas de path-to-regexp ici)
app.use(express.static(distDir, { index: false }));

// 2) Endpoints santé (chaînes exactes, pas de tableau)
app.get("/healthz", (_req, res) => res.status(200).send("ok"));
app.head("/healthz", (_req, res) => res.sendStatus(200));

// 3) Racine (chaîne exacte)
app.get("/", (_req, res) => {
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  return res.status(500).send("index.html manquant");
});
app.head("/", (_req, res) => res.sendStatus(200));

// 4) Fallback SPA (⚠️ RegExp, pas de '*')
app.get(/^(?!.*\.[^/]+$).*/, (_req, res) => {
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  return res.status(500).send("index.html manquant (fallback)");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`listening on 0.0.0.0:${port}`);
});
