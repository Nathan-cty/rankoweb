import { useEffect, useState } from "react";
import { listenFavorites } from "@/features/favorites/favoritesApi";
import BackButton from "@/components/BackButton";
import { Link } from "react-router-dom";

export default function Favorites() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const unsub = listenFavorites(setList);
    return () => unsub?.();
  }, []);

  return (
    <main className="min-h-screen bg-background text-textc flex">
      <div className="mx-auto w-full max-w-sm flex flex-col gap-4 p-4 flex-1">
        <section className="relative flex-1 rounded-2xl bg-background-card shadow border border-borderc p-4 overflow-auto">
          <div className="mb-3 flex items-center justify-between">
            <BackButton />
            <h1 className="text-lg font-bold w-full text-center">Mes favoris</h1>
            <div className="w-8" />
          </div>

          {list.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-textc-muted">
              Aucun favori pour le moment.
            </div>
          ) : (
            <ul className="space-y-3">
              {list.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-borderc bg-background-soft px-3 py-2"
                >
                  <Link to={`/manga/${m.id}`} className="h-12 w-12 rounded bg-background border border-borderc overflow-hidden grid place-items-center text-[10px] text-textc-muted">
                    {m.coverUrl ? (
                      <img src={m.coverUrl} alt={m.title} className="h-full w-full object-cover" />
                    ) : (
                      "cover"
                    )}
                  </Link>
                  <Link to={`/manga/${m.id}`} className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.title || m.id}</div>
                    <div className="text-xs text-textc-muted truncate">{m.author || ""}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
