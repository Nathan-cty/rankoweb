// src/features/auth/ResetPassword.jsx
import { useState } from "react";
import { resetPassword } from "@/lib/auth";
import { Link } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);
    try {
      await resetPassword(email);
      setMsg("Email de réinitialisation envoyé ✅");
    } catch (e) {
      setErr(e.message ?? "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-background p-6 text-textc">
      <div className="w-full max-w-md rounded-2xl bg-background-card p-6 shadow border border-borderc">
        <h1 className="mb-4 text-2xl font-bold text-center text-brand">
          Réinitialiser le mot de passe
        </h1>

        {msg && (
          <div className="mb-3 rounded border border-green-500/30 bg-green-500/10 p-2 text-green-400 text-sm">
            {msg}
          </div>
        )}
        {err && (
          <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 p-2 text-red-400 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-lg bg-background-soft border border-borderc px-3 py-2 outline-none focus:border-brand"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <button
            className="w-full rounded-full bg-brand py-2 font-semibold text-white hover:bg-brand-light transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Envoi..." : "Envoyer"}
          </button>
          <div className="mt-4 text-sm text-textc-muted text-center">
          Déjà un compte ?{" "}
          <Link to="/signin" className="text-brand hover:text-brand-light">
            Se connecter
          </Link>
        </div>
        </form>
      </div>
    </main>
  );
}
