// src/pages/MangaDetail.jsx
import { useParams, useLocation, useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { addFavorite, removeFavorite, listenIsFavorite } from "@/features/favorites/favoritesApi";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

// Firestore
import { db, storage } from "@/lib/firebase"; // ⬅️ Assure-toi d'exporter `storage` depuis lib/firebase
import { doc, getDoc } from "firebase/firestore";
// Storage
import { ref as storageRef, getDownloadURL } from "firebase/storage";

/* ---------------- Utils ---------------- */

// URL absolue (http/s) ?
const isHttp = (s) => /^https?:\/\//i.test(s || "");
// URL gs:// ?
const isGs = (s) => /^gs:\/\//i.test(s || "");

// Un petit cache mémoire pour éviter de refaire getDownloadURL
const urlCache = new Map();

/**
 * Résout un chemin d'image vers une URL utilisable par <img>.
 * - http(s) -> tel quel
 * - gs://bucket/path -> getDownloadURL(path)
 * - chemin Storage (ex: "covers/original/a.jpg" ou "/covers/original/a.jpg") -> getDownloadURL(path)
 * - sinon -> "" (rien)
 */
async function resolveImageUrl(input) {
  if (!input) return "";

  // Déjà une URL publique
  if (isHttp(input)) return input;

  // Normaliser en "path" Storage
  let objectPath = input;
  if (isGs(input)) {
    // gs://bucket/path -> on extrait juste "path"
    const m = input.match(/^gs:\/\/[^/]+\/(.+)$/i);
    objectPath = m ? m[1] : "";
  } else {
    // Chemin style "covers/..." ou "/covers/..."
    objectPath = input.replace(/^\/+/, "");
  }

  if (!objectPath) return "";

  // Cache
  if (urlCache.has(objectPath)) return urlCache.get(objectPath);

  // Résoudre via Storage
  const refObj = storageRef(storage, objectPath);
  const url = await getDownloadURL(refObj);
  urlCache.set(objectPath, url);
  return url;
}

/* ----------------------------------------------------------- */

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

  // URL d'image résolue (https) à afficher
  const [coverUrlResolved, setCoverUrlResolved] = useState("");

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

  // Charge les données Firestore
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setCoverUrlResolved(""); // reset pendant le changement
      try {
        const [liteSnap, detSnap] = await Promise.all([
          getDoc(doc(db, "mangas", id)),
          getDoc(doc(db, "mangaDetails", id)),
        ]);
        if (!mounted) return;
        const liteData = liteSnap.exists() ? { id: liteSnap.id, ...liteSnap.data() } : null;
        const detData  = detSnap.exists()  ? { id: detSnap.id,  ...detSnap.data() }  : null;
        setLite(liteData);
        setDetail(detData);
      } catch (e) {
        console.error(e);
        if (mounted) { setLite(null); setDetail(null); }
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Données affichées (sources brutes depuis Firestore)
  const title = lite?.title || "Manga";
  const author = lite?.author || "";
  const coverCandidate =
    detail?.coverLargeUrl ||
    lite?.coverThumbUrl ||
    lite?.sourcescoverUrl ||
    "";

  // 🔑 Résolution asynchrone de l'URL d'image (Storage -> HTTPS)
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!coverCandidate) {
        if (alive) setCoverUrlResolved("");
        return;
      }
      try {
        const url = await resolveImageUrl(coverCandidate);
        if (alive) setCoverUrlResolved(url);
      } catch (e) {
        console.warn("Cover resolve failed:", coverCandidate, e);
        if (alive) setCoverUrlResolved("");
      }
    })();

    return () => { alive = false; };
  }, [coverCandidate]);

  // Payload favoris (on peut mettre la resolue si tu veux de jolies miniatures dans la liste des favoris)
  const favPayload = useMemo(() => ({
    id,
    title,
    author,
    coverUrl: coverUrlResolved || "", // miniature fiable
  }), [id, title, author, coverUrlResolved]);

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

  /* ---------- Synopsis repliable + card stable ---------- */
  const [expanded, setExpanded] = useState(false);
  const WORD_LIMIT = 50;

  const { shownDescription, needsTruncation } = useMemo(() => {
    const text = (detail?.description || "Aucune description disponible pour le moment.").trim();
    const words = text.split(/\s+/);
    const needs = words.length > WORD_LIMIT;
    const shown = needs ? words.slice(0, WORD_LIMIT).join(" ") + "…" : text;
    return { shownDescription: shown, needsTruncation: needs };
  }, [detail?.description]);

  return (
    <main className="min-h-screen bg-background text-textc flex">
      <div className="mx-auto w-full max-w-sm flex-1 p-4">
        <section
          className="relative rounded-2xl bg-background-card shadow border border-borderc p-4 min-h-[620px]"
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
                  {coverUrlResolved ? (
                    <img
                      src={coverUrlResolved}
                      alt={title}
                      className="h-full w-full object-cover"
                      decoding="async"
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

              {/* Synopsis repliable avec hauteur fixe interne */}
              <div className="mt-4">
                <h2 className="text-sm font-semibold mb-1">Synopsis</h2>

                <div
                  id="synopsis-content"
                  className={`relative text-sm text-textc-muted ${
                    expanded ? "max-h-40 overflow-auto pr-1" : "max-h-20 overflow-hidden"
                  } transition-all`}
                >
                  <p>
                    {expanded
                      ? (detail?.description || "Aucune description disponible pour le moment.")
                      : shownDescription}
                  </p>

                  {!expanded && needsTruncation && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background-card to-transparent" />
                  )}
                </div>

                {needsTruncation && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-2 inline-flex items-center text-xs font-medium text-brand hover:underline"
                    aria-expanded={expanded}
                    aria-controls="synopsis-content"
                  >
                    {expanded ? "Afficher moins" : "Afficher plus"}
                  </button>
                )}
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
