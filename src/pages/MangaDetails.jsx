import { useParams } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { getMangaById } from "@/data/manga.sample"; // ou Firestore plus tard
import { useEffect, useState } from "react";
import { addFavorite, removeFavorite, listenIsFavorite } from "@/features/favorites/favoritesApi";
import { Heart } from "lucide-react";

export default function MangaDetail() {
  const { id } = useParams();
  const manga = getMangaById(id);
  const [isFav, setIsFav] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = listenIsFavorite(id, setIsFav);
    return () => unsub?.();
  }, [id]);

  const toggleFavorite = async () => {
    if (!manga || saving) return;
    setSaving(true);
    try {
      if (isFav) await removeFavorite(manga.id);
      else await addFavorite(manga);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-textc flex">
      <div className="mx-auto w-full max-w-sm flex-1 p-4">
        <section className="relative rounded-2xl bg-background-card shadow border border-borderc p-4">
          <div className="mb-2 flex items-center justify-between">
            <BackButton />
            {/* bouton favori en haut à droite */}
            <button
              onClick={toggleFavorite}
              disabled={saving}
              className="p-2 rounded-full hover:bg-background-soft"
              aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
              title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Heart
                size={22}
                className={isFav ? "fill-brand text-brand" : "text-textc-muted"}
              />
            </button>
          </div>

          {!manga ? (
            <div className="h-[50vh] grid place-items-center text-sm text-textc-muted">
              Manga introuvable.
            </div>
          ) : (
            <>
              <div className="w-full flex justify-center">
                <div className="h-[220px] w-[160px] rounded-xl overflow-hidden border border-borderc bg-background-soft">
                  {manga.coverUrl ? (
                    <img src={manga.coverUrl} alt={manga.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-xs text-textc-muted">Pas d’image</div>
                  )}
                </div>
              </div>

              <div className="mt-4 text-center">
                <h1 className="text-xl font-bold">{manga.title}</h1>
                <p className="muted text-sm mt-1">{manga.author}</p>
              </div>

              <div className="mt-4">
                <h2 className="text-sm font-semibold mb-1">Synopsis</h2>
                <p className="text-sm text-textc-muted">
                  {manga.description || "Aucune description disponible pour le moment."}
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
