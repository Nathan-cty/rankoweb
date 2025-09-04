// src/features/manga/mangaApi.js
import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, query, orderBy, limit,
  startAt, endAt, startAfter, where, documentId
} from "firebase/firestore";

// --- utils ---
const fold = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// =====================
// 🔹 DETAILS (fiche)
// =====================
export async function getMangaById(id) {
  // On lit maintenant dans la collection "mangaDetails"
  const snap = await getDoc(doc(db, "mangaDetails", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// =====================
// 🔹 LISTES (cartes)
// =====================
export async function listManga({ pageSize = 50 } = {}) {
  // Liste simple triée (pour un écran catalogue)
  const q = query(collection(db, "mangas"), orderBy("titleLower"), limit(pageSize));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), _cursor: d })); // _cursor utile si tu pagines après
}

// Pagination avec curseur (facultatif, pratique pour infinite scroll)
export async function listMangaPage({ pageSize = 20, cursor = null, order = ["titleLower","asc"] } = {}) {
  let qBase = query(collection(db, "mangas"), orderBy(order[0], order[1]), limit(pageSize));
  if (cursor) {
    qBase = query(collection(db, "mangas"), orderBy(order[0], order[1]), startAfter(cursor), limit(pageSize));
  }
  const snap = await getDocs(qBase);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data(), _cursor: d }));
  const nextCursor = snap.docs.at(-1) || null;
  return { items, nextCursor };
}

// =====================
// 🔹 RECHERCHE (préfixe)
// =====================
export async function searchMangaPrefix(term, { pageSize = 20 } = {}) {
  const t = fold((term || "").trim());
  if (!t) return [];

  const qTitle = query(
    collection(db, "mangas"),
    orderBy("titleLower"),
    startAt(t),
    endAt(t + "\uf8ff"),
    limit(pageSize)
  );

  const qAuthor = query(
    collection(db, "mangas"),
    orderBy("authorLower"),
    startAt(t),
    endAt(t + "\uf8ff"),
    limit(pageSize)
  );

  const [s1, s2] = await Promise.all([getDocs(qTitle), getDocs(qAuthor)]);
  const map = new Map();
  s1.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
  s2.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));

  return Array.from(map.values()).slice(0, pageSize);
}

// =====================
// 🔹 BATCH PAR IDs (rankings)
// =====================
export async function getMangasByIds(ids = []) {
  if (!ids.length) return [];
  // Firestore limite la clause "in" (chunk si nécessaire)
  const CHUNK = 30; // laisse 30 par sécurité
  const chunks = [];
  for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));

  const results = [];
  for (const part of chunks) {
    const qDocs = query(collection(db, "mangas"), where(documentId(), "in", part));
    const snap = await getDocs(qDocs);
    results.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  // remettre dans l’ordre demandé (utile pour les rankings)
  const orderMap = new Map(ids.map((id, i) => [id, i]));
  results.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  return results;
}
