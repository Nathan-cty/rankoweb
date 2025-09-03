// src/components/GoogleButton.jsx
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function GoogleButton({ onClick }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onClick?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Continuer avec Google"
      className={[
        "w-full rounded-full",
        "bg-white text-[#3c4043]",
        "border border-borderc shadow-sm",
        "h-10 px-4",
        "inline-flex items-center justify-center gap-3",
        "hover:bg-[#f8f9fa]",
        "active:bg-[#f1f3f4]",
        "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-brand/60",
        "transition disabled:opacity-60",
      ].join(" ")}
      disabled={loading}
    >
      {/* Logo Google SVG officiel-like */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 5.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.1-.4-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.8 16 19.1 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 5.5 29.3 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.2 35.3 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.6 5C9.2 39.4 16.1 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3.1 5.2-5.9 6.6l6.2 5.2c-.4.3 8.4-4.9 8.4-15.8 0-1.2-.1-2.1-.4-3.5z"/>
      </svg>

      <span className="text-sm font-medium">
        {loading ? "Connexion…" : "Continuer avec Google"}
      </span>

      {/* Réserve l’espace du spinner pour éviter le “saut” */}
      <span className="w-5 h-5 grid place-items-center">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </span>
    </button>
  );
}
