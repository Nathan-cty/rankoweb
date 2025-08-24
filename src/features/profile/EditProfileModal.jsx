// src/features/profile/EditProfileModal.jsx
import { useEffect, useRef, useState } from "react";
import useAvatarUpload from "./useAvatarUpload"; // ton hook existant
import { updateUserProfile } from "./profileApi";
import { X, Pencil } from "lucide-react";

const MAX_BIO = 140;

export default function EditProfileModal({ user, initialBio = "", onClose, onSaved }) {
  const [displayName, setDisplayName] = useState(user?.displayName || user?.email || "");
  const [bio, setBio] = useState(initialBio || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // avatar
  const { preview, saving: savingAvatar, choose, save, setFile } = useAvatarUpload(user);
  const fileInputRef = useRef(null);
  const currentPhoto = user?.photoURL || "";

  const displaySrc = preview || currentPhoto || "";

  useEffect(() => {
    setBio(initialBio || "");
  }, [initialBio]);

  const pickFile = () => fileInputRef.current?.click();
  const onChangeFile = (e) => {
    setErr("");
    try {
      const f = e.target.files?.[0];
      if (f) choose(f);
    } catch (error) {
      setErr(error?.message || "Image invalide.");
      setFile(null);
    }
  };

  const onSubmit = async (e) => {
    e?.preventDefault();
    if (bio.trim().length > MAX_BIO) {
      setErr(`La description doit faire au plus ${MAX_BIO} caractères.`);
      return;
    }
    setErr("");
    setSaving(true);
    try {
      // 1) si une nouvelle image a été choisie, on l’upload et on récupère l’URL
      let photoURL = null;
      if (preview) {
        photoURL = await save(); // ton hook fait uploadBytes + getDownloadURL (+ updateProfile si tu l'avais)
      }

      // 2) on met à jour Auth + Firestore
      const res = await updateUserProfile({
        displayName: displayName.trim(),
        bio,
        photoURL: photoURL || undefined,
      });

      onSaved?.(res); // remonte les nouvelles valeurs au parent si besoin
      onClose?.();
    } catch (error) {
      console.error(error);
      setErr(error?.message || "Impossible de mettre à jour le profil.");
    } finally {
      setSaving(false);
    }
  };

  const len = bio.trim().length;
  const over = len > MAX_BIO;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
      {/* backdrop */}
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fermer" />
      {/* sheet */}
      <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-borderc bg-background-card p-4 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Modifier le profil</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-background-soft" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {err && (
          <p className="mb-3 rounded border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300">
            {err}
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Avatar + bouton crayon */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-borderc">
              {displaySrc ? (
                <img src={displaySrc} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-textc-muted">Aucune photo</div>
              )}
              <button
                type="button"
                onClick={pickFile}
                className="absolute bottom-1 right-1 rounded-full bg-background-soft p-1 hover:bg-background"
                aria-label="Changer la photo"
              >
                <Pencil size={14} className="text-brand" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onChangeFile}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <label className="mb-1 block text-sm">Nom d’utilisateur</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg bg-background-soft border border-borderc px-3 py-2 outline-none focus:border-brand"
                placeholder="Ton nom"
              />
            </div>
          </div>

          {/* Bio avec compteur */}
          <div>
            <label className="mb-1 block text-sm">Description</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full resize-none rounded-lg bg-background-soft border border-borderc px-3 py-2 outline-none focus:border-brand"
              placeholder="Parle de tes goûts (140 caractères max)…"
              maxLength={MAX_BIO + 20} /* tolérance saisie, validée à la soumission */
            />
            <div className="mt-1 text-right text-xs">
              <span className={over ? "text-red-400" : "text-textc-muted"}>{len}/{MAX_BIO}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
            <button
              type="submit"
              disabled={saving || savingAvatar || over}
              className="btn-brand"
            >
              {saving || savingAvatar ? "Enregistrement…" : "Valider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
