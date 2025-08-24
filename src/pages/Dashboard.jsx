// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider.jsx";
import ProfileHeader from "@/features/profile/ProfileHeader";
import CreateRankingModal from "@/features/rankings/CreateRankingModal";
import RankingCard from "@/features/rankings/RankingCard";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth(); // ← utilisateur réactif
  const [openCreate, setOpenCreate] = useState(false);
  const [rankings, setRankings] = useState([]);

  const q = useMemo(() => {
    if (!user) return null;
    return query(
      collection(db, "rankings"),
      where("ownerUid", "==", user.uid),
      orderBy("createdAt", "desc") // nécessite l’index composite
    );
  }, [user]);

  useEffect(() => {
    if (!q) return;
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRankings(list);
      },
      (err) => {
        console.error("Rankings listener error:", err);
      }
    );
    return () => unsub();
  }, [q]);

  const handleCreated = (r) => {
    
  };

  // État de chargement pendant l’hydratation de la session
  if (authLoading || (!user && rankings.length === 0)) {
    return (
      <main className="min-h-screen bg-background text-textc flex">
        <div className="mx-auto w-full max-w-sm flex-1 p-4">
          <section className="rounded-2xl bg-background-card shadow border border-borderc p-4 h-full grid place-items-center">
            <p className="muted text-sm">Chargement…</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-textc flex">
      <div className="mx-auto w-full max-w-sm flex flex-col gap-4 p-4 flex-1">
        <ProfileHeader onCreateClick={() => setOpenCreate(true)} />
        <section className="flex-1 rounded-2xl bg-background-card shadow border border-borderc p-4 overflow-auto">
          {rankings.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <p className="muted text-sm">Tu n’as pas encore de classement.</p>
                <button
                  onClick={() => setOpenCreate(true)}
                  className="btn-brand text-sm font-medium px-6 py-2 rounded-full w-48"
                >
                  Créer un classement
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {rankings.map((r) => (
                <RankingCard
                  key={r.id}
                  ranking={r}
                  onOpen={(rk) => console.log("ouvrir détail/édition :", rk.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {openCreate && (
        <CreateRankingModal
          onClose={() => setOpenCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </main>
  );
}
