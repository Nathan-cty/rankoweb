// src/features/manga/mangaApi.js
import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, query, orderBy, limit,
  startAt, endAt
} from "firebase/firestore";
// ----------------------
// 🔹 CRUD - MANGA
// ----------------------

// Lire une fiche
export async function getMangaById(id) {
  const snap = await getDoc(doc(db, "manga", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Lister un batch (tri alphabétique)
export async function listManga({ pageSize = 50 } = {}) {
  const q = query(collection(db, "manga"), orderBy("titleLower"), limit(pageSize));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Recherche "prefix" sur titleLower + authorLower, fusion des résultats
export async function searchMangaPrefix(term, { pageSize = 20 } = {}) {
  const t = (term || "").trim().toLowerCase();
  if (!t) return [];

  const qTitle = query(
    collection(db, "manga"),
    orderBy("titleLower"),
    startAt(t),
    endAt(t + "\uf8ff"),
    limit(pageSize)
  );

  const qAuthor = query(
    collection(db, "manga"),
    orderBy("authorLower"),
    startAt(t),
    endAt(t + "\uf8ff"),
    limit(pageSize)
  );

  const [s1, s2] = await Promise.all([getDocs(qTitle), getDocs(qAuthor)]);
  const map = new Map();
  s1.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
  s2.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
  return Array.from(map.values());
}
