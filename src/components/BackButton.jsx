// src/components/BackIconButton.jsx
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BackButton({ className = "" }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className={`p-2 rounded-full hover:bg-background-soft ${className}`}
      aria-label="Retour"
      title="Retour"
    >
      <ArrowLeft size={22} className="text-brand hover:text-brand-light" />
    </button>
  );
}
