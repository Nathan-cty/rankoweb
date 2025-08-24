// src/pages/Rankings.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthProvider.jsx";
import RankingCard from "@/features/rankings/RankingCard";
import BackButton from "../components/BackButton";

export default function Rankings() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState([]);

  const q = useMemo(() => {
    if (!user) return null;
    // Si tu as créé l’index composite ownerUid ASC, createdAt DESC, garde l’orderBy:
    return query(
      collection(db, "rankings"),
      where("ownerUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    // Sinon (en attendant l’index), retire l’orderBy et trie côté client.
  }, [user]);

  useEffect(() => {
    if (!q) return;
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRankings(list);
      },
      (err) => console.error("Rankings list error:", err)
    );
    return () => unsub();
  }, [q]);

  return (
    <main className="min-h-screen bg-background text-textc flex">
      <div className="mx-auto w-full max-w-sm flex flex-col gap-4 p-4 flex-1">
        <section className="relative flex-1 rounded-2xl bg-background-card shadow border border-borderc p-4 overflow-auto">
            <BackButton className="absolute top-3 left-3"/>
          <h1 className="text-lg font-bold text-center">Tous tes classements</h1>

          {rankings.length === 0 ? (
            <div className="h-[50vh] flex items-center justify-center">
              <p className="muted text-sm">Aucun classement pour le moment.</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3">
              {rankings.map((r) => (
                <RankingCard key={r.id} ranking={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
