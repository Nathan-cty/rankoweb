// src/features/auth/SignUp.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUpEmail, signInWithGoogle } from "@/lib/auth";
import GoogleButton from "@/components/GoogleButton";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signUpEmail(email, password);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message ?? "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-background p-6 text-textc">
      <div className="w-full max-w-md rounded-2xl bg-background-card p-6 shadow border border-borderc">
        <h1 className="mb-4 text-2xl font-bold text-center text-brand">Créer un compte</h1>

        {err && (
          <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 p-2 text-red-400 text-sm">
            {err}
          </div>
        )}

        {/* Inscription par email */}
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-lg bg-background-soft border border-borderc px-3 py-2 outline-none focus:border-brand"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg bg-background-soft border border-borderc px-3 py-2 outline-none focus:border-brand"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <button
            className="w-full rounded-full bg-brand py-2 font-semibold text-white hover:bg-brand-light transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Création..." : "S'inscrire"}
          </button>
        </form>

        {/* Séparateur */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-borderc" />
          <span className="text-xs text-textc-muted">ou</span>
          <div className="h-px flex-1 bg-borderc" />
        </div>

        {/* Google Sign-up (même UX que SignIn) */}
        <GoogleButton onClick={signInWithGoogle} />

        <div className="mt-4 text-sm text-textc-muted text-center">
          Déjà un compte ?{" "}
          <Link to="/signin" className="text-brand hover:text-brand-light">
            Se connecter
          </Link>
        </div>
      </div>
    </main>
  );
}
