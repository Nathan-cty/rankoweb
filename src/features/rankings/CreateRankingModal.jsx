// src/features/rankings/CreateRankingModal.jsx
import { useState } from "react";
import { createRanking } from "./rankingsApi";

export default function CreateRankingModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const name = title.trim();
    if (!name) return setErr("Donne un nom à ton classement.");
    setLoading(true);
    try {
      const rankingId = await createRanking({ title: name, visibility: "public" });
      onCreated?.({ id: rankingId, title: name, itemsCount: 0 });
      onClose?.();
    } catch (error) {
      console.error(error);
      setErr("Impossible de créer le classement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Fermer" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-borderc bg-background-card p-4 shadow-2xl">
        <h3 className="text-lg font-semibold">Nouveau classement</h3>
        <p className="muted text-sm mt-1">Choisis un nom. Tu pourras ajouter des mangas ensuite.</p>

        {err && (
          <p className="mt-3 rounded border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300">
            {err}
          </p>
        )}

        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Top Shonen"
            className="w-full rounded-lg bg-background-soft border border-borderc px-3 py-2 outline-none focus:border-brand"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn-brand">
              {loading ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
