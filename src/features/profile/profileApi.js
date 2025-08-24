// src/features/profile/profileApi.js
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

export function listenUserProfile(uid, cb) {
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (snap) => cb(snap.exists() ? snap.data() : null));
}

export async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile({ displayName, bio, photoURL } = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non authentifié.");

  // Sanitize (éviter undefined)
  const clean = {
    displayName: typeof displayName === "string" ? displayName.trim() : undefined,
    bio: typeof bio === "string" ? bio.trim() : undefined,
    photoURL: typeof photoURL === "string" ? photoURL.trim() : undefined,
  };

  // 1) Auth (seulement si changement)
  const patch = {};
  if (clean.displayName && clean.displayName !== user.displayName) patch.displayName = clean.displayName;
  if (clean.photoURL && clean.photoURL !== user.photoURL) patch.photoURL = clean.photoURL;

  try {
    if (Object.keys(patch).length) {
      await updateProfile(user, patch);
    }
  } catch (e) {
    console.error("updateProfile(Auth) failed:", { code: e.code, message: e.message });
    throw e;
  }

  // 2) Firestore (merge)
  const toMerge = {
    updatedAt: serverTimestamp(),
    ...(clean.displayName ? { displayName: clean.displayName } : {}),
    ...(clean.photoURL ? { photoURL: clean.photoURL } : {}),
    ...(typeof clean.bio === "string" ? { bio: clean.bio } : {}),
  };

  try {
    await setDoc(doc(db, "users", user.uid), toMerge, { merge: true });
  } catch (e) {
    console.error("setDoc(/users) failed:", { code: e.code, message: e.message });
    throw e;
  }

  return {
    displayName: clean.displayName ?? user.displayName,
    photoURL: clean.photoURL ?? user.photoURL,
    bio: clean.bio,
  };
}
