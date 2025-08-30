import { auth, db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

// Ajoute/écrase un favori
export async function addFavorite(manga) {
  const user = auth.currentUser;
  if (!user) throw new Error("Non authentifié");
  const ref = doc(db, "users", user.uid, "favorites", manga.id);
  await setDoc(ref, {
    mangaId: manga.id,
    title: manga.title || "",
    author: manga.author || "",
    coverUrl: manga.coverUrl || "",
    createdAt: serverTimestamp(),
  }, { merge: true });
}

// Retire des favoris
export async function removeFavorite(mangaId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Non authentifié");
  const ref = doc(db, "users", user.uid, "favorites", mangaId);
  await deleteDoc(ref);
}

// Ecoute si un manga est favori (booléen)
export function listenIsFavorite(mangaId, cb) {
  const user = auth.currentUser;
  if (!user) return () => {};
  const ref = doc(db, "users", user.uid, "favorites", mangaId);
  const unsub = onSnapshot(ref, (snap) => cb(snap.exists()));
  return unsub;
}

// Ecoute la liste des favoris (tri par date ↓)
export function listenFavorites(cb) {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, "users", user.uid, "favorites"),
    orderBy("createdAt", "desc")
  );
  const unsub = onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(list);
  });
  return unsub;
}
