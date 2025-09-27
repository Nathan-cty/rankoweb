// src/features/rankings/AddMangaModal.jsx
import { useEffect, useRef, useState } from "react";
import SearchInput from "@/components/SearchInput";
import { addRankingItems, getRankingItemIds } from "./rankingsApi";
import { Plus } from "lucide-react";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";
import { listMangaPage, searchMangaPrefixPage } from "@/features/manga/mangaApi";
import { useNavigate } from "react-router-dom";

export default function AddMangaModal({ rankingId, initialCount = 0, onClose, onAdded }) {
  useLockBodyScroll(true); // 🔒 bloque le scroll de la page
  const navigate = useNavigate();

  // 🔔 Toast de confirmation
  const [toast, setToast] = useState("");
  const toastTimerRef = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 2000);
  };
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const [query, setQuery] = useState("");
  const [existingIds, setExistingIds] = useState(new Set());
  const [err, setErr] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const [count, setCount] = useState(initialCount);

  // Résultats cumulés + pagination
  const [results, setResults] = useState([]);
  const [seenIds, setSeenIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false); // chargement initial / recherche
  const [isLoadingMore, setIsLoadingMore] = useState(false); // chargement des pages suivantes
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Réf du conteneur scrollable
  const containerRef = useRef(null);

  // 🗂️ Ref unique qui agrège l'état utile au scroll (évite les closures périmées)
  const stateRef = useRef({
    loading: false,
    isLoadingMore: false,
    hasMore: false,
    nextCursor: null,
    seenIds: new Set(),
    existingIds: new Set(),
    query: "",
  });

  // 🔄 Synchronise la ref unique à chaque changement d'état
  useEffect(() => {
    stateRef.current = {
      loading,
      isLoadingMore,
      hasMore,
      nextCursor,
      seenIds,
      existingIds,
      query,
    };
  }, [loading, isLoadingMore, hasMore, nextCursor, seenIds, existingIds, query]);

  // 1) Charger les ids déjà présents (one-shot)
  useEffect(() => {
    (async () => {
      try {
        const ids = await getRankingItemIds(rankingId);
        setExistingIds(new Set(ids));
      } catch (e) {
        console.error(e);
        setExistingIds(new Set());
      }
    })();
  }, [rankingId]);

  // 2) Si existingIds change (ajouts externes), retire localement
  useEffect(() => {
    if (!results.length) return;
    setResults((prev) => prev.filter((m) => !existingIds.has(m.id)));
    setSeenIds((prev) => new Set([...prev].filter((id) => !existingIds.has(id))));
  }, [existingIds, results.length]);

  const PAGE_SIZE = 20;

  // ⚙️ Récupère une page (utilise stateRef pour lire la query fraîche)
  const fetchPage = async (cursor = null) => {
    const q = (stateRef.current.query || "").trim();
    if (!q) {
      const res = await listMangaPage({ pageSize: PAGE_SIZE, cursor, order: ["titleLower", "asc"] });
      return { items: res.items || [], next: res.nextCursor || null };
    } else {
      const res = await searchMangaPrefixPage(q, { pageSize: PAGE_SIZE, cursor, field: "titleLower" });
      return { items: res.items || [], next: res.nextCursor || null };
    }
  };

  // 3) Debounce recherche (reset + 1ère page à chaque changement de query)
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setErr("");
    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        // reset pagination
        setResults([]);
        setSeenIds(new Set());
        setNextCursor(null);
        setHasMore(false);
        // remonte en haut
        if (containerRef.current) containerRef.current.scrollTop = 0;

        const { items, next } = await fetchPage(null);
        // filtre doublons / existants
        const filtered = items.filter((m) => m && m.id && !stateRef.current.existingIds.has(m.id));
        const unique = [];
        const newSeen = new Set();
        for (const m of filtered) {
          if (!newSeen.has(m.id)) {
            newSeen.add(m.id);
            unique.push(m);
          }
        }
        setResults(unique);
        setSeenIds(newSeen);
        setNextCursor(next);
        setHasMore(Boolean(next));
      } catch (e) {
        console.error(e);
        setErr("Impossible de charger les mangas.");
        setResults([]);
        setHasMore(false);
        setNextCursor(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Charger la page suivante — lit tout via stateRef
  const loadMore = async () => {
    const st = stateRef.current;
    if (!st.hasMore || st.isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const { items, next } = await fetchPage(st.nextCursor);

      const filtered = items.filter(
        (m) => m && m.id && !st.existingIds.has(m.id) && !st.seenIds.has(m.id)
      );

      if (filtered.length) {
        setResults((prev) => [...prev, ...filtered]);
        setSeenIds((prev) => {
          const s = new Set(prev);
          for (const m of filtered) s.add(m.id);
          return s;
        });
      }
      setNextCursor(next);
      setHasMore(Boolean(next));
    } catch (e) {
      console.error(e);
      setErr("Le chargement supplémentaire a échoué.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 4) Listener de scroll: charge quand on approche du bas (200 px)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const st = stateRef.current;
      if (!st.hasMore || st.loading || st.isLoadingMore) return;
      const threshold = 200;
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
      if (nearBottom) loadMore();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Ajout optimiste
  const addOne = async (mangaId) => {
    if (!mangaId || loadingId) return;
    setErr("");
    setLoadingId(mangaId);

    const backup = results.find((m) => m.id === mangaId);
    setResults((prev) => prev.filter((m) => m.id !== mangaId));

    try {
      await addRankingItems(rankingId, [{ mangaId }], count);
      setExistingIds((prev) => new Set(prev).add(mangaId));
      setCount((c) => c + 1);
      onAdded?.({ added: 1, newTotal: count + 1 });

      // ✅ Toast de confirmation
      const title = backup?.title || "Manga";
      showToast(`« ${title} » ajouté au classement`);
    } catch (e) {
      console.error(e);
      setErr("Impossible d’ajouter ce manga.");
      if (backup) setResults((prev) => [backup, ...prev]); // rollback
    } finally {
      setLoadingId("");
    }
  };

  // Navigation vers la page détail (ne ferme plus la modale)
  const goToDetails = (id) => {
    if (!id) return;
    navigate(`/rankings/${rankingId}/add/manga/${id}`);
  };

  // Accessibilité clavier pour la carte
  const onCardKeyDown = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToDetails(id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center overflow-hidden overscroll-contain"
      aria-modal="true"
      role="dialog"
    >
      {/* backdrop */}
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fermer" />

      {/* feuille / modale — alignée avec ManageRankingModal */}
      <div
        className={[
          "relative z-10 w-full max-w-md",
          "h-[90svh] sm:h-auto",
          "max-h-[100svh] sm:max-h-[85vh]",
          "rounded-t-2xl sm:rounded-2xl bg-background-card border border-borderc shadow-2xl",
          "flex flex-col overflow-hidden overflow-x-hidden",
          "p-4 pb-[max(env(safe-area-inset-bottom),1rem)]",
        ].join(" ")}
      >
        {/* header */}
        <div className="mb-3 grid grid-cols-[32px_1fr_32px] items-center shrink-0">
          <button onClick={onClose} className="rounded-full p-2 hover:bg-background-soft justify-self-start" aria-label="Fermer">
            ✕
          </button>
          <h3 className="text-lg font-semibold text-center">Ajouter des mangas</h3>
          <div />
        </div>

        <div className="shrink-0">
          <SearchInput value={query} onChange={setQuery} placeholder="Titre ou auteur…" />
        </div>

        {err && (
          <p className="mt-3 rounded border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300 shrink-0">{err}</p>
        )}

        {/* zone scrollable interne */}
        <div
          ref={containerRef}
          className="mt-3 flex-1 relative overflow-y-auto overflow-x-hidden overscroll-contain divide-y divide-borderc/40"
        >
          {loading && results.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-textc-muted">Chargement…</div>
          ) : results.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-textc-muted">Aucun résultat</div>
          ) : (
            <ul className="w-full">
              {results.map((m) => (
                <li
                  key={m.id}
                  className="py-2 flex items-center gap-3 cursor-pointer hover:bg-background-soft/60 focus-within:bg-background-soft/60"
                  onClick={() => goToDetails(m.id)}
                  onKeyDown={(e) => onCardKeyDown(e, m.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Voir les détails de ${m.title}`}
                >
                  <div className="h-10 w-10 rounded bg-background-soft border border-borderc overflow-hidden grid place-items-center text-[10px] text-textc-muted shrink-0">
                    {m.coverThumbUrl ? (
                      <img
                        src={m.coverThumbUrl}
                        alt={m.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    ) : (
                      "cover"
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.title}</div>
                    <div className="text-xs text-textc-muted truncate">{m.author}</div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // ⛔ Empêche d'ouvrir la page détail
                      addOne(m.id);
                    }}
                    disabled={loadingId === m.id}
                    className="p-2 hover:bg-background-soft disabled:opacity-50 shrink-0 rounded"
                    title="Ajouter"
                    aria-label={`Ajouter ${m.title}`}
                  >
                    {loadingId === m.id ? (
                      <span className="text-xs text-textc-muted">…</span>
                    ) : (
                      <Plus size={20} className="text-textc-muted hover:text-textc" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* État bas / actions */}
          <div className="py-2 text-center">
            {isLoadingMore && results.length > 0 && (
              <p className="text-xs text-textc-muted">Chargement supplémentaire…</p>
            )}
            {!loading && !hasMore && results.length > 0 && (
              <p className="text-xs text-textc-muted">— Fin des résultats —</p>
            )}
            {hasMore && !isLoadingMore && (
              <button type="button" onClick={loadMore} className="mt-2 text-sm underline text-textc-muted hover:text-textc">
                Charger plus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🔔 Toast de confirmation */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[70]"
        >
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-600 text-white px-3 py-2 shadow-lg text-sm">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
