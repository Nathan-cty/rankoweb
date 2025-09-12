// server.js — version SECours (zéro wildcard)
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

console.log("=== RANKO SAFE v1 ===");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const distDir = path.join(__dirname, "dist");
const indexHtml = path.join(distDir, "index.html");
const port = Number(process.env.PORT) || 8080;

app.use(express.static(distDir, { index: false }));   // sert /assets/*

app.get("/healthz", (_req, res) => res.status(200).send("ok")); // sonde

app.get("/", (_req, res) => {                          // page d’accueil
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  return res.status(500).send("index.html manquant");
});

// ⚠️ PAS de fallback SPA ici (on le remettra après, une fois stable)

app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on 0.0.0.0:${port}`);
});
