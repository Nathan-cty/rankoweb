// src/features/rankings/ManageRankingModal.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteRankingItem, reorderRankingItems } from "./rankingsApi";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";

import { GripHorizontal, Minus } from "lucide-react";

function Row({ item, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border border-borderc bg-background-soft px-3 py-2 ${
        isDragging ? "opacity-80 ring-1 ring-brand" : ""
      }`}
    >
      {/* Supprimer à gauche */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-2 rounded hover:bg-background"
        aria-label={`Supprimer ${item.title || item.mangaId}`}
        title="Supprimer"
      >
        <Minus size={18} className="text-textc-muted" />
      </button>

      {/* Numéro */}
      <div className="w-6 text-right text-sm tabular-nums text-textc-muted">
        {index + 1}.
      </div>

      {/* Cover */}
      <div className="h-10 w-10 rounded bg-background border border-borderc grid place-items-center text-[10px] text-textc-muted overflow-hidden">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          "cover"
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.title || item.mangaId}</div>
        <div className="text-xs text-textc-muted truncate">{item.author || ""}</div>
      </div>

      {/* Poignée drag */}
      <button
        className="p-2 rounded hover:bg-background cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Déplacer"
        title="Déplacer"
      >
        <GripHorizontal size={18} className="text-textc-muted" />
      </button>
    </li>
  );
}

export default function ManageRankingModal({ rankingId, onClose }) {
  const [items, setItems] = useState([]); // [{id, position, ...}]
  const [err, setErr] = useState("");
  const [savingId, setSavingId] = useState(null); // id de l’item en cours de save (facultatif visuel)

  // Hauteur stable + liste scrollable
  const sheetStyle = { minHeight: "70vh", maxHeight: "85vh" };

  // Écoute en temps réel (tri par position ASC)
  useEffect(() => {
    if (!rankingId) return;
    const q = query(collection(db, "rankings", rankingId, "items"), orderBy("position", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(list);
      },
      (e) => console.error("listen items:", e)
    );
    return () => unsub();
  }, [rankingId]);

  // DnD sensors + contraintes (parent & vertical)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const modifiers = [restrictToParentElement, restrictToVerticalAxis];

  // Autosave à chaque drop
  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setErr("");
    // réordonner localement
    let next;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      next = arrayMove(prev, oldIndex, newIndex);
      return next;
    });

    try {
      // sauvegarde immédiate en base (positions 1..n)
      const orderedIds = next.map((i) => i.id);
      setSavingId(active.id);
      await reorderRankingItems(rankingId, orderedIds);
    } catch (e) {
      console.error(e);
      setErr("Erreur lors de la mise à jour de l’ordre.");
    } finally {
      setSavingId(null);
    }
  };

  const onRemove = async (mangaId) => {
    setErr("");
    try {
      await deleteRankingItem(rankingId, mangaId);
      // onSnapshot rafraîchira; on peut aussi filtrer localement:
      setItems((prev) => prev.filter((i) => i.id !== mangaId));
    } catch (e) {
      console.error(e);
      setErr("Suppression impossible.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
      {/* backdrop */}
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fermer" />
      {/* feuille dans la grille */}
      <div
        className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-background-card border border-borderc shadow-2xl p-4 flex flex-col"
        style={sheetStyle}
      >
        {/* header : X à gauche, titre centré */}
        <div className="mb-3 flex items-center justify-between">
          <button onClick={onClose} className="rounded-full p-2 hover:bg-background-soft" aria-label="Fermer">
            ✕
          </button>
          <h3 className="text-lg font-semibold flex-1 text-center">Modifier le classement</h3>
          <div className="w-8" />
        </div>

        {err && (
          <p className="mb-2 rounded border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300">
            {err}
          </p>
        )}

        {/* Liste triable (prend l’espace) */}
        <div className="flex-1 overflow-auto relative">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            modifiers={modifiers}
          >
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-3">
                {items.map((it, idx) => (
                  <Row key={it.id} item={it} index={idx} onRemove={onRemove} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>

        {/* plus de footer "Enregistrer" — autosave instantané */}
      </div>
    </div>
  );
}
