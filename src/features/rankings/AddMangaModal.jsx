// src/features/rankings/AddMangaModal.jsx
import { useEffect, useMemo, useState } from "react";
import SearchInput from "@/components/SearchInput";
import { MANGA_SAMPLE } from "@/data/manga.sample";
import { addRankingItems, getRankingItemIds } from "./rankingsApi";
import { Plus } from "lucide-react";
import useLockBodyScroll from "@/hooks/useLockBodyScroll";

export default function AddMangaModal({ rankingId, initialCount = 0, onClose, onAdded }) {
  useLockBodyScroll(true); // 🔒 bloque le scroll de la page

  const [query, setQuery] = useState("");
  const [existingIds, setExistingIds] = useState(new Set());
  const [err, setErr] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const [count, setCount] = useState(initialCount);

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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MANGA_SAMPLE.filter((m) => {
      if (existingIds.has(m.id)) return false;
      if (!q) return true;
      return m.title.toLowerCase().includes(q) || m.author.toLowerCase().includes(q);
    });
  }, [query, existingIds]);

  const addOne = async (mangaId) => {
    if (!mangaId || loadingId) return;
    setErr("");
    setLoadingId(mangaId);
    try {
      await addRankingItems(rankingId, [{ mangaId }], count);
      setExistingIds((prev) => new Set(prev).add(mangaId));
      setCount((c) => c + 1);
      onAdded?.({ added: 1, newTotal: count + 1 });
    } catch (e) {
      console.error(e);
      setErr("Impossible d’ajouter ce manga.");
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

      {/* feuille / card */}
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
          {results.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-textc-muted">
              Aucun résultat
            </div>
          ) : (
            results.map((m) => (
              <div key={m.id} className="py-2 flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-background-soft border border-borderc overflow-hidden grid place-items-center text-[10px] text-textc-muted">
                  {m.coverUrl ? (
                    <img
                      src={m.coverUrl}
                      alt={m.title}
                      className="h-full w-full object-cover"
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
