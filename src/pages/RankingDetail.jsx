// src/pages/RankingDetail.jsx
import { useParams } from "react-router-dom";
import { useState } from "react";

export default function RankingDetail() {
  const { id } = useParams();

  // Visuel uniquement (mock) — on branchera Firestore ensuite
  const [title] = useState(`Mon classement ${id}`);
  const [itemsCount] = useState(0);
  const [coverUrl] = useState(""); // quand on aura des mangas, on pourra mettre une cover principale

  return (
    <main className="min-h-screen bg-background text-textc flex">
      <div className="mx-auto w-full max-w-sm flex-1 p-4">
        <section className="rounded-2xl bg-background-card shadow border border-borderc p-4">
          {/* Image 190x190 */}
          <div className="w-full flex justify-center">
            <div className="h-[190px] w-[190px] rounded-xl overflow-hidden border border-borderc bg-background-soft">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Couverture"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs text-textc-muted">
                  Pas d’image
                </div>
              )}
            </div>
          </div>

          {/* Titre + compteur */}
          <div className="mt-4 text-center">
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="muted text-sm mt-1">{itemsCount} manga(s)</p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-center gap-3">
            <button className="btn-brand">Ajouter</button>
            <button className="btn-ghost">Modifier</button>
          </div>
        </section>
      </div>
    </main>
  );
}
