// src/features/profile/ProfileHeader.jsx
import { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useAuth } from "@/features/auth/AuthProvider.jsx";
import Avatar from "./Avatar.jsx";
import EditProfileModal from "./EditProfileModal.jsx"; // ← modale unifiée
import { LogOut, Heart } from "lucide-react";
import { listenUserProfile } from "@/features/profile/profileApi"; // ← pour la bio temps réel

export default function ProfileHeader({ onCreateClick }) {
  const auth = getAuth();
  const { user } = useAuth();

  const initialDisplay = user?.displayName || user?.email || "Utilisateur";
  const initialPhoto = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(initialDisplay)}&background=4f46e5&color=fff`;

  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState(initialPhoto);
  const [name, setName] = useState(initialDisplay);
  const [bio, setBio] = useState("");

  // Récupère/écoute la bio depuis /users/{uid}
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenUserProfile(user.uid, (data) => {
      if (data?.bio != null) setBio(data.bio);
      if (data?.photoURL && data.photoURL !== photo) {
        setPhoto(`${data.photoURL}`); // on laisse le cache-bust au onSaved
      }
      if (data?.displayName && data.displayName !== name) {
        setName(data.displayName);
      }
    });
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleSignOut = async () => {
    try { await signOut(auth); } catch (err) { console.error(err); }
  };

  return (
    <header className="relative w-full rounded-2xl bg-background-card shadow min-h-[33vh] flex items-center justify-center">
      {/* Icônes en haut (sortie à gauche, cœur à droite) */}
      <div className="absolute top-3 left-3">
        <button
          onClick={handleSignOut}
          className="p-2 rounded-full hover:bg-background-soft"
          aria-label="Déconnexion"
        >
          <LogOut size={22} className="text-brand hover:text-brand-light" />
        </button>
      </div>
      <div className="absolute top-3 right-3">
        <button
          onClick={() => {}}
          className="p-2 rounded-full hover:bg-background-soft"
          aria-label="Favori"
        >
          <Heart size={22} className="text-brand hover:text-brand-light" />
        </button>
      </div>

      {/* Contenu centré */}
      <div className="w-full max-w-sm px-4 flex flex-col items-center">
        {/* Avatar + nom (plus grands) */}
        <div className="grid grid-cols-[88px_1fr] items-center gap-4 w-full">
          <Avatar src={photo} size={88} />
          <div className="text-left">
            <div className="text-lg sm:text-xl font-semibold leading-tight">
              {name}
            </div>
            <div className="truncate text-xs text-textc-muted">
              {user?.email}
            </div>
          </div>
        </div>

        {/* Bio sous le nom */}
        <div className="w-full mt-3">
          <p className="text-sm text-textc-muted break-words">
            {bio ? bio : <span className="opacity-70">Ajoute une description…</span>}
          </p>
        </div>

        {/* Boutons séparés avec arrondis complets (style conservé) */}
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
            if (photoURL) setPhoto(`${photoURL}?t=${Date.now()}`); // cache-bust
            if (typeof newBio === "string") setBio(newBio);
          }}
        />
      )}
    </header>
  );
}
