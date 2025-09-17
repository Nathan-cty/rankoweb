"use client"; // (Next.js seulement)

import { useState } from "react";
import {
  doc, writeBatch, serverTimestamp,
  collection, getDocs, query, where
} from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase";
import { getDownloadURL, ref } from "firebase/storage";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// utilitaire : minuscules + sans accents
function fold(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
const isHttp = (s) => /^https?:\/\//i.test(s || "");

function AuthBar() {
  const user = auth.currentUser;
  async function login() { await signInWithPopup(auth, new GoogleAuthProvider()); }
  async function logout() { await signOut(auth); }
  return (
    <div style={{ marginBottom: 20 }}>
      {user ? (
        <>
          <p>✅ Connecté : {user.email}</p>
          <p><b>UID :</b> {user.uid}</p>
          <button onClick={logout}>Se déconnecter</button>
        </>
      ) : (
        <button onClick={login}>Se connecter avec Google</button>
      )}
    </div>
  );
}

// Cherche un doc existant par anilistId dans /mangas ; si trouvé, renvoie son docId
async function resolveDocIdByAni(db, anilistId, fallbackId) {
  if (anilistId == null) return fallbackId; // pas d'aniId → on ne peut pas garantir l'unicité
  const q = query(collection(db, "mangas"), where("anilistId", "==", anilistId));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id; // réutiliser le doc existant
  return fallbackId ?? String(anilistId);
}

export default function ImportMangas() {
  const [file, setFile] = useState(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState("");
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);

  function append(line) { setLog((l) => l + line + "\n"); }

  async function readJson(f) {
    const text = await f.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error("Le JSON doit être une liste d'objets.");
    return data;
  }

  async function run() {
    if (!auth.currentUser) { append("❌ Tu dois être connecté."); return; }
    if (!file) { append("❌ Sélectionne d'abord un fichier .json."); return; }

    setRunning(true); setLog(""); setDone(0);

    try {
      const items = await readJson(file);
      setTotal(items.length);
      append(`Début import (${items.length} mangas)…`);

      for (const group of chunk(items, 300)) { // 300 pour se laisser de la marge
        const batch = writeBatch(db);

        // ⚠️ On résout les docIds AVANT d'écrire (un await par item, simple & sûr)
        const prepared = [];
        for (const m of group) {
          if (!m || !m.id) { append("⚠️ Entrée sans id — ignorée"); continue; }

          const anilistId = m.anilistId != null ? m.anilistId : null;
          const docId = await resolveDocIdByAni(db, anilistId, m.id); // unicité par ani

          // URLs covers : convertir les chemins Storage en URLs HTTPS
          let coverLarge =
            (m.mangaDetails && m.mangaDetails.coverLargeUrl) ||
            m.sourcescoverUrl || m.sourcesCoverUrl || "";
          let coverThumb =
            m.coverThumbUrl || m.sourcescoverUrl || m.sourcesCoverUrl || coverLarge || "";

          if (coverLarge && !isHttp(coverLarge)) {
            try { coverLarge = await getDownloadURL(ref(storage, coverLarge)); }
            catch { append(`⚠️ ${docId} coverLarge non résolue (${coverLarge})`); }
          }
          if (coverThumb && !isHttp(coverThumb)) {
            try { coverThumb = await getDownloadURL(ref(storage, coverThumb)); }
            catch { append(`⚠️ ${docId} coverThumb non résolue (${coverThumb})`); }
          }

          prepared.push({ m, docId, anilistId, coverLarge, coverThumb });
        }

        // Ecriture OVERWRITE (merge: false) → remplace l'existant
        for (const { m, docId, anilistId, coverLarge, coverThumb } of prepared) {
          batch.set(
            doc(db, "mangas", docId),
            {
              // résumé
              title: m.title || "",
              titleLower: fold(m.title || ""),
              author: m.author || "",
              authorLower: fold(m.author || ""),
              coverThumbUrl: coverThumb || "",
              anilistId: anilistId, // clé d'unicité
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
            },
            { merge: false } // <-- écrase le doc
          );

          batch.set(
            doc(db, "mangaDetails", docId),
            {
              description: (m.mangaDetails && m.mangaDetails.description) || "",
              coverLargeUrl: coverLarge || "",
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
            },
            { merge: false } // <-- écrase le doc
          );
        }

        await batch.commit();
        setDone((d) => d + prepared.length);
        append(`✅ ${Math.min(done + prepared.length, items.length)}/${items.length}`);
      }

      append("🎉 Import terminé (unicité par anilistId, overwrite activé).");
    } catch (e) {
      console.error(e);
      append(`❌ Erreur: ${e.message || e}`);
    } finally {
      setRunning(false);
    }
  }

  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <h1>Import Mangas (unicité par AniList → overwrite)</h1>
      <AuthBar />

      <div style={{ display: "grid", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <input
          type="file"
          accept="application/json"
          onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
          disabled={running}
        />
        <button onClick={run} disabled={running || !file} style={{ padding: 12 }}>
          {running ? "Import en cours…" : "Importer"}
        </button>
      </div>

      {total > 0 && (
        <div style={{ marginTop: 12 }}>
          <div>Progression : {done}/{total} ({percent}%)</div>
          <div style={{ height: 8, background: "#eee", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
            <div style={{ width: `${percent}%`, height: "100%", background: "#4f46e5" }} />
          </div>
        </div>
      )}

      <pre style={{ background: "#0b1020", color: "#d6e1ff", padding: 12, marginTop: 12, whiteSpace: "pre-wrap", borderRadius: 8 }}>
        {log}
      </pre>
    </div>
  );
}
