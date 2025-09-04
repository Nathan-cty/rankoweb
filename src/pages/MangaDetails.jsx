// src/pages/MangaDetail.jsx
import { useParams } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { useEffect, useState, useMemo } from "react";
import { addFavorite, removeFavorite, listenIsFavorite } from "@/features/favorites/favoritesApi";
import { Heart } from "lucide-react";

// Firestore
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function MangaDetail() {
  const { id } = useParams();

  const [lite, setLite] = useState(null);     // doc dans /mangas
  const [detail, setDetail] = useState(null); // doc dans /mangaDetails
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [saving, setSaving] = useState(false);

  // Écoute du statut favori
  useEffect(() => {
    if (!id) return;
    const unsub = listenIsFavorite(id, setIsFav);
    return () => unsub?.();
  }, [id]);

  // Charge les deux “tiroirs” Firestore
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [liteSnap, detSnap] = await Promise.all([
          getDoc(doc(db, "mangas", id)),
          getDoc(doc(db, "mangaDetails", id)),
        ]);
        if (!mounted) return;
        setLite(liteSnap.exists() ? { id: liteSnap.id, ...liteSnap.data() } : null);
        setDetail(detSnap.exists() ? { id: detSnap.id, ...detSnap.data() } : null);
      } catch (e) {
        console.error(e);
        if (mounted) {
          setLite(null);
          setDetail(null);
        }
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Données affichées (avec fallback)
  const title = lite?.title || "Manga";
  const author = lite?.author || "";
  const coverLarge = detail?.coverLargeUrl || lite?.coverThumbUrl || "";
  const description = detail?.description || "Aucune description disponible pour le moment.";

  // Payload “favori” minimal (compat avec favoritesApi)
  const favPayload = useMemo(() => ({
    id,
    title,
    author,
    coverUrl: lite?.coverThumbUrl || coverLarge || "",
  }), [id, title, author, lite?.coverThumbUrl, coverLarge]);

  const toggleFavorite = async () => {
    if (!id || saving) return;
    setSaving(true);
    try {
      if (isFav) await removeFavorite(id);
      else await addFavorite(favPayload);
    } finally {
      setSaving(false);
    }
  };

  const notFound = !loading && !lite && !detail;

  return (
    <main className="min-h-screen bg-background text-textc flex">
      <div className="mx-auto w-full max-w-sm flex-1 p-4">
        <section className="relative rounded-2xl bg-background-card shadow border border-borderc p-4">
          <div className="mb-2 flex items-center justify-between">
            <BackButton />
            <button
              onClick={toggleFavorite}
              disabled={saving || notFound || loading}
              className="p-2 rounded-full hover:bg-background-soft"
              aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
              title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Heart size={22} className={isFav ? "fill-brand text-brand" : "text-textc-muted"} />
            </button>
          </div>

          {loading ? (
            <div className="h-[50vh] grid place-items-center text-sm text-textc-muted">Chargement…</div>
          ) : notFound ? (
            <div className="h-[50vh] grid place-items-center text-sm text-textc-muted">Manga introuvable.</div>
          ) : (
            <>
              <div className="w-full flex justify-center">
                <div className="h-[220px] w-[160px] rounded-xl overflow-hidden border border-borderc bg-background-soft">
                  {coverLarge ? (
                    <img
                      src={coverLarge}
                      alt={title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-xs text-textc-muted">
                      Pas d’image
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 text-center">
                <h1 className="text-xl font-bold">{title}</h1>
                {author && <p className="muted text-sm mt-1">{author}</p>}
              </div>

              <div className="mt-4">
                <h2 className="text-sm font-semibold mb-1">Synopsis</h2>
                <p className="text-sm text-textc-muted">{description}</p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
