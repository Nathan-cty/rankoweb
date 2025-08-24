// src/features/profile/useAvatarUpload.js
import { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function useAvatarUpload(user) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const choose = (f) => {
    if (!f) return;
    if (!f.type?.startsWith("image/")) throw new Error("Veuillez sélectionner une image.");
    if (f.size > 5 * 1024 * 1024) throw new Error("Image trop lourde (max 5 Mo).");
    setFile(f);
  };


  const save = async () => {
    if (!file || !user) return;
    setSaving(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
const objectRef = ref(storage, `users/${user.uid}/avatar.${ext}`);
await uploadBytes(objectRef, file); // ← sans options pour tester
const url = await getDownloadURL(objectRef);
      await updateProfile(user, { photoURL: url });
      return url;
    } finally {
      setSaving(false);
    }
  };

  return { file, preview, saving, choose, save, setFile };
}
