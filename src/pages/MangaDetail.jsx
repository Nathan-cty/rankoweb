// src/pages/MangaDetail.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMangaById } from "@/features/manga/mangaApi";
import BackButton from "@/components/BackButton";

export default function MangaDetail() {
  const { id } = useParams();
  const [m, setM] = useState(null);

  useEffect(() => {
    getMangaById(id).then(setM);
  }, [id]);

  if (!m) {
    return (
      <main className="min-h-screen bg-background text-textc p-4 grid place-items-center">
        <div className="text-sm text-textc-muted">Chargement…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-textc p-4">
      <div className="mx-auto w-full max-w-sm space-y-3">
        <div className="rounded-2xl bg-background-card border border-borderc p-4 shadow">
          <BackButton />
          <div className="h-40 w-full mt-2 rounded-md overflow-hidden border border-borderc bg-background-soft">
            {m.coverUrl ? (
              <img src={m.coverUrl} alt={m.title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-textc-muted">Pas d’image</div>
            )}
          </div>
          <h1 className="mt-3 text-xl font-bold">{m.title}</h1>
          <p className="text-sm text-textc-muted">{m.author}</p>

          <div className="mt-3 text-sm whitespace-pre-wrap">
            {m.description || "—"}
          </div>
        </div>
      </div>
    </main>
  );
}
