// src/features/rankings/ManageRankingModal.jsx
import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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

/* ---------------- Utils ---------------- */
function ordersEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/* ---------------- Row (draggable via poignée) ---------------- */
function Row({ item, displayIndex, onRemove, manga, isActive }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const title = manga?.title || item.title || item.mangaId || item.id;
  const author = manga?.author || item.author || "";
  const cover = manga?.coverThumbUrl || item.coverUrl || "";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isActive ? "none" : transition,
    willChange: "transform",
    position: "relative",
    zIndex: isActive ? 50 : 1,
    touchAction: "auto",
    visibility: isActive ? "hidden" : "visible",
  };

  const stopDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        "flex items-center gap-3 rounded-xl border border-borderc bg-background-soft px-3 py-2",
        "touch-manipulation select-none",
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
        className="p-2 rounded hover:bg-background focus:outline-none active:bg-transparent"
        aria-label={`Supprimer ${title}`}
        title="Supprimer"
      >
        <Minus size={18} className="text-textc-muted" />
      </button>

      {/* ✅ index d'affichage (1..n) calculé depuis orderIds */}
      <div className="w-6 text-right text-sm tabular-nums text-textc-muted">{displayIndex}.</div>

      <div className="h-10 w-10 rounded bg-background border border-borderc grid place-items-center text-[10px] text-textc-muted overflow-hidden">
        {cover ? (
          <img src={cover} alt={title} className="h-full w-full object-cover" draggable={false} />
        ) : (
          "cover"
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-textc-muted truncate">{author}</div>
      </div>

      {/* Poignée élargie (drag uniquement ici) */}
      <button
        type="button"
        aria-label={`Saisir et déplacer ${title}`}
        className="ml-1 -mr-2 py-3 px-4 rounded-lg cursor-grab active:cursor-grabbing hover:bg-background focus:outline-none"
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
function RowOverlay({ item, manga }) {
  if (!item) return null;
  const title = manga?.title || item.title || item.mangaId || item.id;
  const author = manga?.author || item.author || "";
  const cover = manga?.coverThumbUrl || item?.coverUrl || "";

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-borderc bg-background-soft px-3 py-2 shadow-2xl"
      style={{ pointerEvents: "none" }}
    >
      <button type="button" tabIndex={-1} className="p-2 rounded pointer-events-none" aria-hidden>
        <Minus size={18} className="opacity-40" />
      </button>
      <div className="w-6 text-right text-sm tabular-nums text-textc-muted"> </div>
      <div className="h-10 w-10 rounded bg-background border border-borderc overflow-hidden grid place-items-center text-[10px] text-textc-muted">
        {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : "cover"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-textc-muted truncate">{author}</div>
      </div>
      <div className="p-2 rounded text-textc-muted">
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
  useEffect(() => { mangaMapRef.current = mangaMap; }, [mangaMap]);

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

        // 2) Maj UI ORDER (orderIds) — on ne remplace JAMAIS brutalement par l'ordre Firestore
        setOrderIds((prev) => {
          // Si tout nouveau (premier snapshot) : initialiser à l'ordre reçu
          if (prev.length === 0) return snapshotIds;

          // Si on attend un ordre précis après drag, n'applique que si ça matche
          if (waitingForExpectedSnapshotRef.current && lastSavedOrderRef.current) {
            if (ordersEqual(snapshotIds, lastSavedOrderRef.current)) {
              waitingForExpectedSnapshotRef.current = false;
              lastSavedOrderRef.current = null;
              return snapshotIds.slice(); // validé par la base
            }
            // Sinon, on ne touche pas l'ordre UI (on attend le bon snapshot)
            return prev;
          }

          // Cas normal (inclut suppressions/ajouts) :
          // - on conserve l'ordre précédent pour les ids encore présents
          // - on ajoute en fin les ids nouveaux présents dans le snapshot
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

      // UI ORDER optimiste: on enlève l'id → séquence 1..n immédiate
      setOrderIds((prev) => prev.filter((id) => id !== mangaId));

      // On n'attend rien de spécial côté ordre
      waitingForExpectedSnapshotRef.current = false;
      lastSavedOrderRef.current = null;
    } catch (e) {
      console.error(e);
      setErr("Suppression impossible.");
    }
  };

  const activeItem = activeId ? itemsById.get(activeId) : null;
  const activeManga = activeItem ? mangaMap.get(activeItem.mangaId ?? activeItem.id) : null;

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
          <button onClick={onClose} className="rounded-full p-2 hover:bg-background-soft justify-self-start" aria-label="Fermer">
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
        <div className="flex-1 overscroll-contain relative overflow-auto">
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

                  return (
                    <Row
                      key={id}
                      item={it}
                      displayIndex={displayIndex}
                      onRemove={onRemove}
                      manga={manga}
                      isActive={activeId === id}
                    />
                  );
                })}
              </ul>
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {activeItem ? <RowOverlay item={activeItem} manga={activeManga} /> : null}
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
