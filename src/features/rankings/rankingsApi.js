// src/features/rankings/rankingsApi.js
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  increment
} from "firebase/firestore";


export async function createRanking({ title, visibility = "public" }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié.");
  const ref = await addDoc(collection(db, "rankings"), {
    ownerUid: user.uid,
    title: String(title || "").trim(),
    visibility,
    itemsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Récupère les mangaIds déjà présents dans un ranking
export async function getRankingItemIds(rankingId) {
  const q = query(collection(db, "rankings", rankingId, "items"), orderBy("position", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

// Ajoute une liste d'items [{mangaId, position, note?}]
export async function addRankingItems(rankingId, items = [], currentCount = 0) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié.");
  if (!rankingId || !Array.isArray(items)) throw new Error("Payload invalide.");

  const batch = writeBatch(db);
  let pos = currentCount;

  for (const it of items) {
    const mangaId = it.mangaId;
    if (!mangaId) continue;
    pos += 1;

    const itemRef = doc(db, "rankings", rankingId, "items", mangaId);
    batch.set(itemRef, {
      mangaId,
      rankingId,
      ownerUid: user.uid,
      position: pos,
      note: it.note || "",
      createdAt: serverTimestamp(),
    });
  }

  // MAJ compteur parent
  const parentRef = doc(db, "rankings", rankingId);
  batch.set(parentRef, { itemsCount: pos, updatedAt: serverTimestamp() }, { merge: true });

  await batch.commit();
  return pos; // nouveau total
}

export async function deleteRankingItem(rankingId, mangaId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié.");
  if (!rankingId || !mangaId) throw new Error("Paramètres invalides.");

  const batch = writeBatch(db);

  // supprime l'item
  const itemRef = doc(db, "rankings", rankingId, "items", mangaId);
  batch.delete(itemRef);

  // décrémente le compteur du parent
  const parentRef = doc(db, "rankings", rankingId);
  batch.set(
    parentRef,
    { itemsCount: increment(-1), updatedAt: serverTimestamp() },
    { merge: true }
  );

  await batch.commit();
}

export async function reorderRankingItems(rankingId, orderedMangaIds = []) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié.");
  if (!rankingId || !Array.isArray(orderedMangaIds)) {
    throw new Error("Paramètres invalides.");
  }

  const batch = writeBatch(db);
  orderedMangaIds.forEach((mangaId, idx) => {
    const ref = doc(db, "rankings", rankingId, "items", mangaId);
    batch.set(ref, { position: idx + 1, updatedAt: serverTimestamp() }, { merge: true });
  });
  // MAJ parent.updatedAt (optionnel)
  batch.set(doc(db, "rankings", rankingId), { updatedAt: serverTimestamp() }, { merge: true });

  await batch.commit();
}
