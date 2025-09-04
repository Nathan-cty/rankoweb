import { useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, storage, auth } from "@/lib/firebase"; // adapte le chemin si besoin
import { MANGA_SAMPLE } from "../data/manga.sample";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// utilitaire : minuscules + sans accents
const fold = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function extFromCoverUrl(coverUrl) {
  if (!coverUrl) return ".jpg";
  const m = coverUrl.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i);
  return m ? `.${m[1].toLowerCase()}` : ".jpg";
}

// essaie thumb/large, sinon fallback sur original
async function getCoverUrls(storage, id, ext, originalCoverUrlOnSite = "") {
  const base = `covers/original/${id}`;
  const thumbPath = `${base}_200x${ext}`;
  const largePath = `${base}_800x${ext}`;
  const origPath = `${base}${ext}`;

  let coverThumbUrl = "";
  let coverLargeUrl = "";

  try { coverThumbUrl = await getDownloadURL(ref(storage, thumbPath)); } catch { /* empty */ }
  try { coverLargeUrl = await getDownloadURL(ref(storage, largePath)); } catch { /* empty */ }

  if (!coverThumbUrl) {
    try { coverThumbUrl = await getDownloadURL(ref(storage, origPath)); } catch { /* empty */ }
  }
  if (!coverLargeUrl) {
    try { coverLargeUrl = await getDownloadURL(ref(storage, origPath)); } catch { /* empty */ }
  }

  // dernier fallback : utilise l’URL locale (ex: /cover/aot.jpg)
  if (!coverThumbUrl && originalCoverUrlOnSite) coverThumbUrl = originalCoverUrlOnSite;
  if (!coverLargeUrl && originalCoverUrlOnSite) coverLargeUrl = originalCoverUrlOnSite;

  return { coverThumbUrl, coverLargeUrl };
}

// barre de login Google pour afficher UID
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

export default function ImportMangas() {
  const [log, setLog] = useState("");
  const [running, setRunning] = useState(false);

  const append = (line) => setLog((l) => l + line + "\n");

  const run = async () => {
    if (!auth.currentUser) {
      append("❌ Tu dois être connecté.");
      return;
    }
    setRunning(true);
    append(`Début import (${MANGA_SAMPLE.length} mangas)…`);

    for (const m of MANGA_SAMPLE) {
      try {
        const id = m.id;
        const ext = extFromCoverUrl(m.coverUrl);
        const { coverThumbUrl, coverLargeUrl } = await getCoverUrls(storage, id, ext, m.coverUrl);

        // Document "léger"
        await setDoc(doc(db, "mangas", id), {
          title: m.title,
          titleLower: fold(m.title),
          author: m.author,
          authorLower: fold(m.author),
          coverThumbUrl,
          updatedAt: serverTimestamp(),
        });

        // Document "détail"
        await setDoc(doc(db, "mangaDetails", id), {
          description: m.description || "",
          coverLargeUrl,
        });

        append(`✅ Importé : ${id}`);
      } catch (e) {
        console.error(e);
        append(`❌ ${m.id} — ${e.code || e.message}`);
      }
    }

    append("🎉 Import terminé.");
    setRunning(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Import Mangas</h1>
      <AuthBar />
      <button onClick={run} disabled={running} style={{ padding: 12 }}>
        {running ? "Import en cours…" : "Importer"}
      </button>
      <pre style={{
        background: "#111",
        color: "#0f0",
        padding: 12,
        marginTop: 12,
        whiteSpace: "pre-wrap"
      }}>
        {log}
      </pre>
    </div>
  );
}
