// src/features/profile/ProfileHeader.jsx
import { useEffect, useState, useCallback } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useAuth } from "@/features/auth/AuthProvider.jsx";
import Avatar from "./Avatar.jsx";
import EditProfileModal from "./EditProfileModal.jsx";
import { LogOut, Heart } from "lucide-react";
import { listenUserProfile } from "@/features/profile/profileApi";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "@/components/ConfirmModal.jsx";

// ⬇️ importe ton logo (adapte le chemin/format si besoin)
import logoUrl from "@/assets/logo-ranko.png";

/* ---------- Header profil ---------- */
export default function ProfileHeader({ onCreateClick }) {
  const auth = getAuth();
  const { user } = useAuth();
  const navigate = useNavigate();

  const initialDisplay = user?.displayName || user?.email || "Utilisateur";
  const initialPhoto =
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(initialDisplay)}&background=4f46e5&color=fff`;

  const [open, setOpen] = useState(false); // modal édition profil
  const [photo, setPhoto] = useState(initialPhoto);
  const [name, setName] = useState(initialDisplay);
  const [bio, setBio] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false); // modal confirmation déconnexion
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenUserProfile(user.uid, (data) => {
      if (data?.bio != null) setBio(data.bio);
      if (data?.photoURL && data.photoURL !== photo) {
        setPhoto(`${data.photoURL}`); // cache-bust géré au onSaved
      }
      if (data?.displayName && data.displayName !== name) {
        setName(data.displayName);
      }
    });
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true);
      await signOut(auth);
      // Redirection post-logout gérée par le guard si besoin
    } catch (err) {
      console.error(err);
    } finally {
      setSigningOut(false);
      setConfirmOpen(false);
    }
  }, [auth]);

  return (
    <header className="w-full rounded-2xl bg-background-card shadow min-h-[33vh] flex flex-col">
      {/* Barre supérieure : icône logout / LOGO / icône favoris */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 pt-[env(safe-area-inset-top)] pb-2">
        <button
          onClick={() => setConfirmOpen(true)}
          className="p-2 rounded-full hover:bg-background-soft justify-self-start"
          aria-label="Déconnexion"
          title="Déconnexion"
        >
          <LogOut size={22} className="text-brand hover:text-brand-light" />
        </button>

        {/* LOGO centré */}
        <div className="justify-self-center">
          <img
            src={logoUrl}
            alt="Rankõ"
            className="block h-6 w-auto sm:h-18 md:h-20 select-none"
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </div>

        <button
          onClick={() => navigate("/favorites")}
          className="p-2 rounded-full hover:bg-background-soft justify-self-end"
          aria-label="Favoris"
          title="Favoris"
        >
          <Heart size={22} className="text-brand hover:text-brand-light" />
        </button>
      </div>

      {/* Contenu centré */}
      <div className="w-full max-w-sm mx-auto px-4 pb-4 flex-1 flex flex-col items-center justify-center">
        {/* Avatar + nom */}
        <div className="grid grid-cols-[88px_1fr] items-center gap-4 w-full">
          <Avatar src={photo} size={88} />
          <div className="text-left">
            <div className="text-lg sm:text-xl font-semibold leading-tight">
              {name}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="w-full mt-3">
          <p className="text-sm text-textc-muted break-words">
            {bio ? (
              bio
            ) : (
              <span className="opacity-70">Ajoute une description…</span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="w-full mt-6 flex gap-3">
          <button
            className="btn-brand text-xs font-medium px-4 py-1.5 rounded-full"
            onClick={() => onCreateClick?.()}
          >
            Créer
          </button>
          <button
            className="btn-brand text-xs font-medium px-4 py-1.5 rounded-full"
            onClick={() => setOpen(true)}
          >
            Modifier
          </button>
        </div>
      </div>

      {open && (
        <EditProfileModal
          user={user}
          initialBio={bio}
          onClose={() => setOpen(false)}
          onSaved={({ displayName, photoURL, bio: newBio }) => {
            if (displayName) setName(displayName);
            if (photoURL) setPhoto(`${photoURL}?t=${Date.now()}`);
            if (typeof newBio === "string") setBio(newBio);
          }}
        />
      )}

      {/* Modal de confirmation de déconnexion */}
      <ConfirmModal
        open={confirmOpen}
        title="Se déconnecter ?"
        description="Tu es sur le point de te déconnecter de l’application. Tu pourras te reconnecter à tout moment."
        confirmText={signingOut ? "Déconnexion…" : "Se déconnecter"}
        cancelText="Annuler"
        onConfirm={signingOut ? undefined : handleSignOut}
        onCancel={() => (signingOut ? null : setConfirmOpen(false))}
      />
    </header>
  );
}
