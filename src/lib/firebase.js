// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function assertFirebaseEnv(cfg) {
  const missing = Object.entries(cfg).filter(([_, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error("Firebase env manquantes:", missing);
    throw new Error("Firebase config incomplète (variables VITE_* manquantes)");
  }
  console.log("Firebase projectId:", cfg.projectId);
  console.log("Firebase apiKey (début):", String(cfg.apiKey).slice(0, 8) + "…");
}
assertFirebaseEnv(firebaseConfig);

const app = initializeApp(firebaseConfig);

if (import.meta.env.DEV) {
  console.log("Storage bucket →", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
