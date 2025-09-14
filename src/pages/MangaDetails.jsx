// src/pages/MangaDetail.jsx
import { useParams, useLocation, useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { addFavorite, removeFavorite, listenIsFavorite } from "@/features/favorites/favoritesApi";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

// Firestore
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function MangaDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const fromRanking = location.state?.fromRanking; // { rankingId, ids: string[], index?: number }

  const [lite, setLite] = useState(null);     // doc dans /mangas
  const [detail, setDetail] = useState(null); // doc dans /mangaDetails
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---- Contexte classement (navigation + position) ----
  const idsFromRanking = Array.isArray(fromRanking?.ids) ? fromRanking.ids : null;

  const currentIndex = useMemo(() => {
    if (!idsFromRanking) return null;
    const idxFromState = Number.isInteger(fromRanking?.index) ? fromRanking.index : null;
    if (idxFromState != null && idsFromRanking[idxFromState] === id) return idxFromState;
    const found = idsFromRanking.indexOf(id);
    return found >= 0 ? found : null;
  }, [id, idsFromRanking, fromRanking?.index]);

  const hasNavContext = idsFromRanking && currentIndex != null;
  const hasPrev = hasNavContext && currentIndex > 0;
  const hasNext = hasNavContext && currentIndex < idsFromRanking.length - 1;
  const prevId = hasPrev ? idsFromRanking[currentIndex - 1] : null;
  const nextId = hasNext ? idsFromRanking[currentIndex + 1] : null;

  const goToIndex = useCallback(
    (nextIndex) => {
      if (!idsFromRanking) return;
      const targetId = idsFromRanking[nextIndex];
      if (!targetId) return;
      navigate(`/manga/${targetId}`, {
        replace: true,
        state: { fromRanking: { ...fromRanking, index: nextIndex } },
      });
    },
    [idsFromRanking, navigate, fromRanking]
  );

  const goPrev = useCallback(() => { if (hasPrev) goToIndex(currentIndex - 1); }, [hasPrev, currentIndex, goToIndex]);
  const goNext = useCallback(() => { if (hasNext) goToIndex(currentIndex + 1); }, [hasNext, currentIndex, goToIndex]);

  // Navigation clavier
  useEffect(() => {
    if (!hasNavContext) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasNavContext, goPrev, goNext]);

  // Gestes swipe (mobile)
  const touchStartRef = useRef(null);
  const onTouchStart = (e) => {
    if (!hasNavContext) return;
    const t = e.touches?.[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    if (!hasNavContext || !touchStartRef.current) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.t;
    touchStartRef.current = null;

    const THRESHOLD_X = 50;
    const THRESHOLD_RATIO = 2;
    const THRESHOLD_TIME = 600;

    if (Math.abs(dx) > THRESHOLD_X && Math.abs(dx) > THRESHOLD_RATIO * Math.abs(dy) && dt < 1000 + THRESHOLD_TIME) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  // Favoris
  useEffect(() => {
    if (!id) return;
    const unsub = listenIsFavorite(id, setIsFav);
    return () => unsub?.();
  }, [id]);

  // Charge les données
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
        if (mounted) { setLite(null); setDetail(null); }
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Données affichées
  const title = lite?.title || "Manga";
  const author = lite?.author || "";
  const coverLarge = detail?.coverLargeUrl || lite?.coverThumbUrl || "";
  const description = detail?.description || "Aucune description disponible pour le moment.";

  // Payload favoris
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
        <section
          className="relative rounded-2xl bg-background-card shadow border border-borderc p-4"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
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

          {/* Flèches de navigation (uniquement via classement) */}
          {hasNavContext && !loading && !notFound && (
            <>
              <button
                onClick={goPrev}
                disabled={!hasPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 border border-borderc shadow hover:bg-background-soft disabled:opacity-40"
                aria-label="Manga précédent"
                title="Manga précédent"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goNext}
                disabled={!hasNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 border border-borderc shadow hover:bg-background-soft disabled:opacity-40"
                aria-label="Manga suivant"
                title="Manga suivant"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {loading ? (
            <div className="h-[50vh] grid place-items-center text-sm text-textc-muted">Chargement…</div>
          ) : notFound ? (
            <div className="h-[50vh] grid place-items-center text-sm text-textc-muted">Manga introuvable.</div>
          ) : (
            <>
              <div className="w-full flex justify-center">
                {/* Image : même gabarit que dans RankingDetail (190x190) */}
                <div className="relative h-[190px] w-[190px] rounded-xl overflow-hidden border border-borderc bg-background-soft">
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

                  {/* BADGE de position : visible seulement via classement */}
{hasNavContext && (
  <div
    className="absolute bottom-2 right-2 w-9 h-9 rounded-md bg-brand text-white text-lg font-bold grid place-items-center shadow-lg border border-borderc"
    aria-label={`Position ${currentIndex + 1} dans le classement`}
    title={`Position ${currentIndex + 1} dans le classement`}
  >
    {currentIndex + 1}
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

              {/* Indicateur global (optionnel) */}
              {hasNavContext && (
                <div className="mt-3 text-center text-[11px] text-textc-muted">
                  {currentIndex + 1} / {idsFromRanking.length}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
