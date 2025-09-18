// src/components/ConfirmModal.jsx
import { useEffect } from "react";

export default function ConfirmModal({
  open,
  title = "Confirmer",
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
}) {
  // Fermer sur Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-title"
    >
      {/* Overlay */}
      <button
        aria-hidden="true"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        tabIndex={-1}
      />

      {/* Card */}
      <div className="relative w-full sm:w-[28rem] mx-3 rounded-2xl bg-background-card border border-borderc shadow-xl p-4 sm:p-5 animate-in fade-in zoom-in duration-150">
        <h3 id="confirm-title" className="text-base sm:text-lg font-semibold">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-textc-muted">
            {description}
          </p>
        )}

        {/* Boutons élargis */}
       <div className="mt-6 flex items-center justify-end gap-3">
  <button
    onClick={onCancel}
    className="min-w-[110px] px-5 py-2 text-sm rounded-full border border-borderc hover:bg-background-soft transition whitespace-nowrap"
  >
    {cancelText}
  </button>
  <button
    onClick={onConfirm}
    className="min-w-[140px] px-5 py-2 text-sm rounded-full btn-brand transition whitespace-nowrap"
    autoFocus
  >
    {confirmText}
  </button>
</div>
      </div>
    </div>
  );
}
