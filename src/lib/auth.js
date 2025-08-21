import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export const signUpEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signInEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const signInWithGithub = () => signInWithPopup(auth, new GithubAuthProvider());
