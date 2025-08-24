// src/features/rankings/rankingsApi.js
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  writeBatch,
} from "firebase/firestore";

/**
 * Crée un classement vide et renvoie son ID.
 * @param {{title: string, visibility?: 'public'|'private'}} payload
 * @returns {Promise<string>} rankingId
 */
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

/**
 * Ajoute plusieurs mangas à un classement (avec positions).
 * items = [{ mangaId: 'one-piece', position: 1, note?: '...' }, ...]
 */
export async function addRankingItems(rankingId, items = []) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié.");
  if (!rankingId || !Array.isArray(items)) throw new Error("Payload invalide.");

  const batch = writeBatch(db);
  for (const it of items) {
    const { mangaId, position, note = "" } = it;
    if (!mangaId || typeof position !== "number") continue;

    const itemRef = doc(db, "rankings", rankingId, "items", mangaId);
    batch.set(itemRef, {
      mangaId,
      rankingId,          // denormalized: utile pour collectionGroup
      ownerUid: user.uid, // denormalized: utile pour filtres
      position,
      note,
      createdAt: serverTimestamp(),
    });
  }

  // mets aussi à jour le compteur sur le parent
  const parentRef = doc(db, "rankings", rankingId);
  batch.set(
    parentRef,
    { itemsCount: items.length, updatedAt: serverTimestamp() },
    { merge: true }
  );

  await batch.commit();
}
