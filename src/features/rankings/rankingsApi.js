// src/features/rankings/rankingsApi.js
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Crée un classement vide pour l'utilisateur connecté.
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
 * Récupère les IDs (mangaId) déjà présents dans un ranking (triés par position ASC).
 */
export async function getRankingItemIds(rankingId) {
  const q = query(
    collection(db, "rankings", rankingId, "items"),
    orderBy("position", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

/**
 * Ajoute une liste d'items [{mangaId, title?, author?, coverUrl?}] au classement
 * et met à jour itemsCount dans la même transaction.
 *
 * - Évite les doublons (si un doc items/{mangaId} existe déjà, il est ignoré)
 * - Positionne chaque nouvel item à partir de itemsCount + 1
 * - Retourne le nouveau total réel après ajout
 */
export async function addRankingItems(rankingId, items = []) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié.");
  if (!rankingId || !Array.isArray(items) || items.length === 0) {
    throw new Error("Payload invalide.");
  }

  const rankingRef = doc(db, "rankings", rankingId);
  const itemsCol = collection(rankingRef, "items");

  const newTotal = await runTransaction(db, async (tx) => {
    const rankingSnap = await tx.get(rankingRef);
    if (!rankingSnap.exists()) throw new Error("Classement introuvable.");

    let base = Number(rankingSnap.data()?.itemsCount || 0);
    let added = 0;

    for (const input of items) {
      const mangaId = input?.mangaId;
      if (!mangaId) continue;

      const itemRef = doc(itemsCol, mangaId);
      const exists = (await tx.get(itemRef)).exists();

      if (exists) continue; // on ignore les doublons

      added += 1;
      tx.set(
        itemRef,
        {
          mangaId,
          title: input.title || "",
          author: input.author || "",
          coverUrl: input.coverUrl || "",
          position: base + added, // positions consécutives
          addedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    if (added > 0) {
      tx.update(rankingRef, {
        itemsCount: base + added,
        updatedAt: serverTimestamp(),
      });
    }

    return base + added;
  });

  return newTotal;
}

/**
 * Supprime un item (mangaId) et décrémente le compteur dans la même transaction.
 * Recompacte le compteur (min 0). Ne touche pas aux positions des autres items.
 */
export async function deleteRankingItem(rankingId, mangaId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié.");
  if (!rankingId || !mangaId) throw new Error("Paramètres invalides.");

  const rankingRef = doc(db, "rankings", rankingId);
  const itemRef = doc(db, "rankings", rankingId, "items", mangaId);

  await runTransaction(db, async (tx) => {
    const parentSnap = await tx.get(rankingRef);
    if (!parentSnap.exists()) throw new Error("Classement introuvable.");

    const itemSnap = await tx.get(itemRef);
    if (!itemSnap.exists()) return; // rien à faire

    tx.delete(itemRef);

    const base = Number(parentSnap.data()?.itemsCount || 0);
    const next = Math.max(0, base - 1);

    tx.update(rankingRef, {
      itemsCount: next,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Réordonne la liste (ne change pas itemsCount).
 * @param {string} rankingId
 * @param {string[]} orderedIds - ordre complet des IDs (mangaId)
 */
export async function reorderRankingItems(rankingId, orderedIds = []) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié.");
  if (!rankingId || !Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new Error("Paramètres invalides.");
  }

  const rankingRef = doc(db, "rankings", rankingId);

  await runTransaction(db, async (tx) => {
    const parentSnap = await tx.get(rankingRef);
    if (!parentSnap.exists()) throw new Error("Classement introuvable.");

    orderedIds.forEach((mangaId, idx) => {
      const itemRef = doc(db, "rankings", rankingId, "items", mangaId);
      // on ne crée pas si absent; on update seulement s'il existe
      tx.update(itemRef, { position: idx + 1 });
    });

    tx.update(rankingRef, { updatedAt: serverTimestamp() });
  });
}
