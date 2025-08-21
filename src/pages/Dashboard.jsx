// src/pages/Dashboard.jsx
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthProvider.jsx";
import { updateProfile } from "firebase/auth";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <ProfileHeader user={user} />
      {/* le reste de ton dashboard ici */}
      <section className="mt-6 rounded-xl bg-white p-4 shadow">
        <h2 className="text-lg font-semibold">Contenu du dashboard</h2>
        <p className="text-sm text-gray-600">À toi de jouer ✨</p>
      </section>
    </main>
  );
}

function ProfileHeader({ user }) {
  const [open, setOpen] = useState(false);
  const photo = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || "U")}&background=4f46e5&color=fff`;

  return (
    <header className="rounded-2xl bg-white p-4 shadow">
      {/* Mobile-first : avatar à gauche, nom à droite centré dans sa colonne */}
      <div className="grid grid-cols-[72px_1fr] items-center gap-4">
        <div className="relative h-16 w-16">
          <img
            src={photo}
            alt="Avatar"
            className="h-16 w-16 rounded-full object-cover"
          />
          {/* Bouton crayon en bas à droite de l’avatar */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Modifier la photo"
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-white shadow ring-2 ring-white active:scale-95"
          >
            {/* icône crayon (SVG inline) */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M15.232 5.232a2.5 2.5 0 113.536 3.536L8.5 19H5v-3.5l10.232-10.268z" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {/* Nom utilisateur centré horizontalement dans la colonne droite */}
        <div className="text-center">
          <div className="text-base font-semibold leading-tight">
            {user?.displayName || user?.email || "Utilisateur"}
          </div>
          <div className="text-xs text-gray-500 truncate">{user?.email}</div>
        </div>
      </div>

      {open && <EditAvatarModal onClose={() => setOpen(false)} user={user} />}
    </header>
  );
}

function EditAvatarModal({ onClose, user }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  // génère un aperçu local
  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPick = () => inputRef.current?.click();

  const onChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // filtre simple
    if (!f.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image.");
      return;
    }
    // limite (ex: 5 Mo)
    if (f.size > 5 * 1024 * 1024) {
      alert("Image trop lourde (max 5 Mo).");
      return;
    }
    setFile(f);
  };

  const onSave = async () => {
    if (!file || !user) return;
    setSaving(true);
    try {
      // chemin de stockage : users/{uid}/avatar.jpg (ou .png)
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const objectRef = ref(storage, `users/${user.uid}/avatar.${ext}`);

      await uploadBytes(objectRef, file, { contentType: file.type });
      const url = await getDownloadURL(objectRef);

      // met à jour le profil Auth (photoURL)
      await updateProfile(user, { photoURL: url });

      onClose();
      // Optionnel: forcer un refresh local (certaines versions gardent l’ancien URL en cache)
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Échec de la mise à jour de la photo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* feuille modale mobile-first (bottom sheet) */}
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Modifier la photo</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100" aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="h-24 w-24 overflow-hidden rounded-full border">
            {preview ? (
              <img src={preview} alt="Aperçu" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs text-gray-500">
                Aucun fichier
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
          <button
            onClick={onPick}
            className="w-full rounded-xl border px-4 py-2 font-medium active:scale-[0.99]"
          >
            Choisir une image
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border px-4 py-2 font-medium"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={!file || saving}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
}
