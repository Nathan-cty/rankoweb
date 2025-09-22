// src/components/BackIconButton.jsx
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";

export default function BackButton({
  className = "",
  unauthTo = "/dashboard", // où envoyer si non connecté
  fallback = "/dashboard", // où envoyer s'il n'y a pas d'historique
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    const isAuthed = !!auth.currentUser;

    // Visiteur non connecté → va au dashboard
    if (!isAuthed) {
      navigate(unauthTo, { replace: true });
      return;
    }

    // Utilisateur connecté → back si possible, sinon fallback
    const idx = typeof window !== "undefined" ? window.history.state?.idx : undefined;
    const canGoBack = typeof idx === "number" && idx > 0;

    if (canGoBack) navigate(-1);
    else navigate(fallback, { replace: true });
  };

  return (
    <button
      onClick={handleBack}
      className={`p-2 rounded-full hover:bg-background-soft ${className}`}
      aria-label="Retour"
      title="Retour"
    >
      <ArrowLeft size={22} className="text-brand hover:text-brand-light" />
    </button>
  );
}
