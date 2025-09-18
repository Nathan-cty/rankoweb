// src/features/rankings/ManageRankingModal.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { collection, onSnapshot, orderBy, query, doc, getDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { deleteRankingItem, reorderRankingItems } from "./rankingsApi";
import uselockBodyScroll from "@/hooks/useLockBodyScroll";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { GripHorizontal, Minus } from "lucide-react";

// Firebase Storage
import { getDownloadURL, ref as storageRef } from "firebase/storage";

/* ---------------- Utils ---------------- */
function ordersEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function ellipsize(str, maxChars = 20) {
  if (!str) return "";
  return str.length > maxChars ? `${str.slice(0, maxChars - 1)}…` : str;
}


const isHttp = (s) => /^https?:\/\//i.test(s || "");
const isGs = (s) => /^gs:\/\//i.test(s || "");

// Cache simple pour éviter de re-résoudre les mêmes objets
const urlCache = new Map();

async function resolveOne(raw) {
  if (!raw) return "";

  if (isHttp(raw)) return raw;

  // normaliser vers un objectPath Storage
  let objectPath = raw;
  if (isGs(raw)) {
    const m = raw.match(/^gs:\/\/[^/]+\/(.+)$/i);
    objectPath = m ? m[1] : "";
  } else {
    objectPath = raw.replace(/^\/+/, "");
  }
  if (!objectPath) return "";

  if (urlCache.has(objectPath)) return urlCache.get(objectPath);
  const url = await getDownloadURL(storageRef(storage, objectPath));
  urlCache.set(objectPath, url);
  return url;
}

/** Hook: résout une liste de sources en URLs finales. Renvoie { raw: url }. */
function useResolveStorageUrls(rawList) {
  const [map, setMap] = useState({});
  useEffect(() => {
    let alive = true;
    const uniq = Array.from(new Set((rawList || []).filter(Boolean)));
    (async () => {
      const pairs = await Promise.all(
        uniq.map(async (key) => {
          try {
            const url = await resolveOne(key);
            return [key, url];
          } catch {
            return [key, ""];
          }
        })
      );
      if (alive) setMap(Object.fromEntries(pairs));
    })();
    return () => {
      alive = false;
    };
  }, [rawList]);
  return map;
}

/* ---------------- Row (draggable via poignée) ---------------- */
function Row({ item, displayIndex, onRemove, manga, isActive, coverUrl }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const title = manga?.title || item.title || item.mangaId || item.id;
  const author = manga?.author || item.author || "";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isActive ? "none" : transition,
    willChange: "transform",
    position: "relative",
    zIndex: isActive ? 50 : 1,
    touchAction: "auto",
    visibility: isActive ? "hidden" : "visible",
  };

  const titleText = ellipsize(title, 20);
  const authorText = ellipsize(author, 20);

  const stopDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Log utile en dev pour repérer les champs manquants
  // eslint-disable-next-line no-undef
  if (process.env.NODE_ENV !== "production" && !coverUrl) {
    // eslint-disable-next-line no-console
    console.warn("No cover URL for ranking item:", {
      item: {
        id: item?.id,
        coverUrl: item?.coverUrl,
        cover: item?.cover,
        thumb: item?.thumb,
        thumbnail: item?.thumbnail,
      },
      manga: {
        id: manga?.id,
        coverThumbUrl: manga?.coverThumbUrl,
        sourcescoverUrl: manga?.sourcescoverUrl,
      },
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        "flex items-center gap-3 rounded-xl border border-borderc bg-background-soft px-3 py-2",
        "touch-manipulation select-none",
        "w-full max-w-full overflow-hidden", // évite l'élargissement horizontal
      ].join(" ")}
      aria-label={`Réordonner ${title}`}
    >
      <button
        type="button"
        tabIndex={-1}
        onPointerDown={stopDragStart}
        onMouseDown={stopDragStart}
        onTouchStart={stopDragStart}
        onClick={() => onRemove(item.id)}
        className="shrink-0 p-2 rounded hover:bg-background focus:outline-none active:bg-transparent"
        aria-label={`Supprimer ${title}`}
        title="Supprimer"
      >
        <Minus size={18} className="text-textc-muted" />
      </button>

      {/* ✅ index d'affichage (1..n) calculé depuis orderIds */}
      <div className="shrink-0 w-6 text-right text-sm tabular-nums text-textc-muted">
        {displayIndex}.
      </div>

      <div className="shrink-0 h-10 w-10 rounded bg-background border border-borderc grid place-items-center text-[10px] text-textc-muted overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          "cover"
        )}
      </div>

      {/* Zone texte: seule partie flexible */}
      <div className="flex-1 basis-0 min-w-0">
        <div className="text-sm font-medium truncate">{titleText}</div>
        <div className="text-xs text-textc-muted truncate">{authorText}</div>
      </div>

      {/* Poignée (drag uniquement ici) */}
      <button
        type="button"
        aria-label={`Saisir et déplacer ${title}`}
        className="shrink-0 ml-1 py-3 px-3 rounded-lg cursor-grab active:cursor-grabbing hover:bg-background focus:outline-none"
        style={{ touchAction: "none" }}
        {...listeners}
        {...attributes}
      >
        <div className="flex items-center justify-center">
          <GripHorizontal size={20} className="text-textc-muted" />
        </div>
      </button>
    </li>
  );
}

/* ---------------- Clone visuel ---------------- */
function RowOverlay({ item, manga, coverUrl }) {
  if (!item) return null;
  const title = manga?.title || item.title || item.mangaId || item.id;
  const author = manga?.author || item.author || "";

  const titleText = ellipsize(title, 20);
const authorText = ellipsize(author, 20);

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-borderc bg-background-soft px-3 py-2 shadow-2xl max-w-full overflow-hidden"
      style={{ pointerEvents: "none" }}
    >
      <button type="button" tabIndex={-1} className="shrink-0 p-2 rounded pointer-events-none" aria-hidden>
        <Minus size={18} className="opacity-40" />
      </button>
      <div className="shrink-0 w-6 text-right text-sm tabular-nums text-textc-muted"> </div>
      <div className="shrink-0 h-10 w-10 rounded bg-background border border-borderc overflow-hidden grid place-items-center text-[10px] text-textc-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          "cover"
        )}
      </div>
      <div className="flex-1 basis-0 min-w-0">
        <div className="text-sm font-medium truncate">{titleText}</div>
        <div className="text-xs text-textc-muted truncate">{authorText}</div>
      </div>
      <div className="shrink-0 p-2 rounded text-textc-muted">
        <GripHorizontal size={18} />
      </div>
    </div>
  );
}

/* ---------------- Modal ---------------- */
export default function ManageRankingModal({ rankingId, onClose }) {
  uselockBodyScroll(true);

  // Données par id (source de vérité data)
  const [itemsById, setItemsById] = useState(new Map());
  // Ordre d'affichage (ids) — source de vérité UI
  const [orderIds, setOrderIds] = useState([]);

  const [err, setErr] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  // Contrôle de cohérence après drag
  const lastSavedOrderRef = useRef(null);
  const waitingForExpectedSnapshotRef = useRef(false);

  // Cache mangas
  const [mangaMap, setMangaMap] = useState(new Map());
  const mangaMapRef = useRef(mangaMap);
  useEffect(() => {
    mangaMapRef.current = mangaMap;
  }, [mangaMap]);

  /* ---------- DnD (poignée) ---------- */
  const sensors = useSensors(useSensor(PointerSensor, {}));

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = orderIds.indexOf(active.id);
    const newIndex = orderIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const nextOrder = arrayMove(orderIds, oldIndex, newIndex);

    // UI optimiste + on attend le snapshot qui matche cet ordre
    setOrderIds(nextOrder);
    lastSavedOrderRef.current = nextOrder.slice();
    waitingForExpectedSnapshotRef.current = true;

    try {
      setSavingId(active.id);
      await reorderRankingItems(rankingId, nextOrder);
    } catch (e) {
      console.error(e);
      setErr("Erreur lors de la mise à jour de l’ordre.");
      waitingForExpectedSnapshotRef.current = false;
      lastSavedOrderRef.current = null;
    } finally {
      setSavingId(null);
    }
  };

  /* ---------- Temps réel + cache mangas ---------- */
  useEffect(() => {
    if (!rankingId) return;
    const qy = query(collection(db, "rankings", rankingId, "items"), orderBy("position", "asc"));

    const unsub = onSnapshot(
      qy,
      async (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const snapshotIds = list.map((i) => i.id);

        // 1) Maj DATA (itemsById)
        setItemsById((prev) => {
          const next = new Map(prev);
          // upsert
          list.forEach((it) => next.set(it.id, it));
          // remove deleted
          for (const id of Array.from(next.keys())) {
            if (!snapshotIds.includes(id)) next.delete(id);
          }
          return next;
        });

        // 2) Maj UI ORDER (orderIds) — ne pas écraser brutalement
        setOrderIds((prev) => {
          if (prev.length === 0) return snapshotIds;

          if (waitingForExpectedSnapshotRef.current && lastSavedOrderRef.current) {
            if (ordersEqual(snapshotIds, lastSavedOrderRef.current)) {
              waitingForExpectedSnapshotRef.current = false;
              lastSavedOrderRef.current = null;
              return snapshotIds.slice();
            }
            return prev;
          }

          const inSnap = new Set(snapshotIds);
          const kept = prev.filter((id) => inSnap.has(id));
          const appended = snapshotIds.filter((id) => !kept.includes(id));
          return [...kept, ...appended];
        });

        // 3) Cache mangas (facultatif)
        const idsForManga = list.map((it) => it.mangaId ?? it.id).filter(Boolean);
        const current = new Map(mangaMapRef.current);
        const missing = idsForManga.filter((id) => !current.has(id));
        if (missing.length) {
          try {
            const fetched = await Promise.all(
              missing.map(async (mid) => {
                const s = await getDoc(doc(db, "mangas", mid));
                return s.exists() ? { id: s.id, ...s.data() } : null;
              })
            );
            fetched.forEach((m) => m && current.set(m.id, m));
            setMangaMap(current);
          } catch (e) {
            console.error("Fetch mangas:", e);
          }
        }
      },
      (e) => console.error("listen items:", e)
    );

    return () => unsub();
  }, [rankingId]);

  /* ---------- Résolution des thumbnails via Storage ---------- */
  // Préparer toutes les "raw sources" à résoudre
  const rawList = useMemo(() => {
    const list = [];
    for (const id of orderIds) {
      const it = itemsById.get(id);
      if (!it) continue;
      const mid = it.mangaId ?? it.id;
      const manga = mid ? mangaMap.get(mid) : null;

      const raw =
        manga?.coverThumbUrl ||
        manga?.sourcescoverUrl ||
        it.coverUrl ||
        it.cover ||
        it.thumb ||
        it.thumbnail ||
        "";
      if (raw) list.push(raw);
    }
    return list;
  }, [orderIds, itemsById, mangaMap]);

  const resolvedMap = useResolveStorageUrls(rawList);

  /* ---------- Supprimer ---------- */
  const onRemove = async (mangaId) => {
    try {
      await deleteRankingItem(rankingId, mangaId);

      // DATA optimiste
      setItemsById((prev) => {
        const next = new Map(prev);
        next.delete(mangaId);
        return next;
      });

      // UI ORDER optimiste
      setOrderIds((prev) => prev.filter((id) => id !== mangaId));

      waitingForExpectedSnapshotRef.current = false;
      lastSavedOrderRef.current = null;
    } catch (e) {
      console.error(e);
      setErr("Suppression impossible.");
    }
  };

  const activeItem = activeId ? itemsById.get(activeId) : null;
  const activeManga = activeItem ? mangaMap.get(activeItem.mangaId ?? activeItem.id) : null;

  // cover pour l’overlay (résolue depuis la même map)
  const activeRaw =
    (activeManga?.coverThumbUrl ||
      activeManga?.sourcescoverUrl ||
      activeItem?.coverUrl ||
      activeItem?.cover ||
      activeItem?.thumb ||
      activeItem?.thumbnail ||
      "") || "";
  const activeCoverUrl = resolvedMap[activeRaw] || "";

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center overscroll-contain">
      {/* backdrop */}
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fermer" />
      {/* feuille (modale) */}
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
          <h3 className="text-lg font-semibold text-center">Modifier le classement</h3>
          <div />
        </div>

        {err && (
          <p className="mb-2 rounded border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300">
            {err}
          </p>
        )}

        {/* zone scrollable — scroll natif */}
        <div className="flex-1 overscroll-contain relative overflow-y-auto overflow-x-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            measuring={{
              draggable: { strategy: MeasuringStrategy.Always },
              droppable: { strategy: MeasuringStrategy.Always },
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
              <ul className="space-y-3">
                {orderIds.map((id, idx) => {
                  const it = itemsById.get(id);
                  if (!it) return null; // si data pas encore là
                  const mid = it.mangaId ?? it.id;
                  const manga = mid ? mangaMap.get(mid) : null;
                  const displayIndex = idx + 1; // ✅ toujours compact

                  const raw =
                    manga?.coverThumbUrl ||
                    manga?.sourcescoverUrl ||
                    it.coverUrl ||
                    it.cover ||
                    it.thumb ||
                    it.thumbnail ||
                    "";
                  const coverUrl = resolvedMap[raw] || "";

                  return (
                    <Row
                      key={id}
                      item={it}
                      displayIndex={displayIndex}
                      onRemove={onRemove}
                      manga={manga}
                      isActive={activeId === id}
                      coverUrl={coverUrl}
                    />
                  );
                })}
              </ul>
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {activeItem ? (
                <RowOverlay item={activeItem} manga={activeManga} coverUrl={activeCoverUrl} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {savingId && (
          <div className="mt-2 text-center text-xs text-textc-muted">Sauvegarde…</div>
        )}
      </div>
    </div>
  );
}
