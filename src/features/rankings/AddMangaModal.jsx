// src/features/rankings/AddMangaModal.jsx
import { useEffect, useRef, useState } from "react";
import SearchInput from "@/components/SearchInput";
import { addRankingItems, getRankingItemIds } from "./rankingsApi";
import { Plus } from "lucide-react";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

// 🔗 API Firestore (liste + recherche)
import { listMangaPage, searchMangaPrefix } from "@/features/manga/mangaApi";

export default function AddMangaModal({ rankingId, initialCount = 0, onClose, onAdded }) {
  useLockBodyScroll(true); // 🔒 bloque le scroll de la page

  const [query, setQuery] = useState("");
  const [existingIds, setExistingIds] = useState(new Set());
  const [err, setErr] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const [count, setCount] = useState(initialCount);

  // 🔎 résultats depuis Firestore
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les ids déjà présents (one-shot)
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

  // Debounce pour la recherche — ⚠️ ne dépend QUE de "query" pour éviter le rafraîchissement à l’ajout
  const timerRef = useRef(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(true);
    setErr("");

    timerRef.current = setTimeout(async () => {
      try {
        let docs = [];
        const q = query.trim();
        if (!q) {
          // Pas de texte → liste initiale
          const { items } = await listMangaPage({ pageSize: 30, order: ["titleLower", "asc"] });
          docs = items;
        } else {
          // Recherche préfixe (titre + auteur)
          docs = await searchMangaPrefix(q, { pageSize: 30 });
        }
        // Filtrer côté client ceux déjà présents
        const filtered = docs.filter((m) => !existingIds.has(m.id));
        setResults(filtered);
      } catch (e) {
        console.error(e);
        setErr("Impossible de charger les mangas.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]); // ← uniquement query

  // Si existingIds change (ajouts externes), retire localement sans déclencher "Chargement…"
  useEffect(() => {
    if (!results.length) return;
    setResults((prev) => prev.filter((m) => !existingIds.has(m.id)));
  }, [existingIds, results.length]);

  // Ajout optimiste : on retire visuellement l’item tout de suite (rollback si erreur)
  const addOne = async (mangaId) => {
    if (!mangaId || loadingId) return;
    setErr("");
    setLoadingId(mangaId);

    // retrait immédiat + sauvegarde pour rollback
    const backup = results.find((m) => m.id === mangaId);
    setResults((prev) => prev.filter((m) => m.id !== mangaId));

    try {
      await addRankingItems(rankingId, [{ mangaId }], count);
      setExistingIds((prev) => new Set(prev).add(mangaId));
      setCount((c) => c + 1);
      onAdded?.({ added: 1, newTotal: count + 1 });
    } catch (e) {
      console.error(e);
      setErr("Impossible d’ajouter ce manga.");
      if (backup) setResults((prev) => [backup, ...prev]); // rollback
    } finally {
      setLoadingId("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center overflow-hidden overscroll-contain"
      aria-modal="true"
      role="dialog"
    >
      {/* backdrop (bloque les interactions derrière) */}
      <button
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Fermer"
      />

      {/* feuille / card — largeur IDENTIQUE à ton code */}
      <div
        className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-background-card border border-borderc shadow-2xl p-4 flex flex-col"
        style={{ minHeight: "70vh", maxHeight: "85vh" }}
      >
        {/* header */}
        <div className="mb-3 grid grid-cols-[32px_1fr_32px] items-center">
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-background-soft justify-self-start"
            aria-label="Fermer"
          >
            ✕
          </button>
          <h3 className="text-lg font-semibold text-center">Ajouter des mangas</h3>
          <div /> {/* spacer */}
        </div>

        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Titre ou auteur…"
        />

        {err && (
          <p className="mt-3 rounded border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300">
            {err}
          </p>
        )}

        {/* zone scrollable interne uniquement */}
        <div className="mt-3 flex-1 overflow-auto overscroll-contain divide-y divide-borderc/40">
          {loading ? (
            <div className="h-full grid place-items-center text-sm text-textc-muted">
              Chargement…
            </div>
          ) : results.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-textc-muted">
              Aucun résultat
            </div>
          ) : (
            results.map((m) => (
              <div key={m.id} className="py-2 flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-background-soft border border-borderc overflow-hidden grid place-items-center text-[10px] text-textc-muted">
                  {m.coverThumbUrl ? (
                    <img
                      src={m.coverThumbUrl}
                      alt={m.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
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
                  onClick={() => addOne(m.id)}
                  disabled={loadingId === m.id}
                  className="p-2 hover:bg-background-soft disabled:opacity-50"
                  title="Ajouter"
                  aria-label={`Ajouter ${m.title}`}
                >
                  {loadingId === m.id ? (
                    <span className="text-xs text-textc-muted">…</span>
                  ) : (
                    <Plus size={20} className="text-textc-muted hover:text-textc" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
