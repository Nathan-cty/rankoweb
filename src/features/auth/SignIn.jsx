// src/features/auth/SignIn.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInEmail, signInWithGoogle } from "@/lib/auth";
import GoogleButton from "@/components/GoogleButton.jsx";

import logoUrl from "@/assets/logo-ranko.png";

function LogoSpot({ src = logoUrl, alt = "Rankõ" }) {
  return (
    <img
      src={src}
      alt={alt}
      className="block mx-auto h-16 w-auto sm:h-20 md:h-24"
      loading="eager"
      decoding="async"
      draggable={false}
    />
  );
}

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await signInEmail(email, password);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message ?? "Erreur de connexion");
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-background p-6 text-textc">
      <div className="w-full max-w-md rounded-2xl bg-background-card p-6 shadow border border-borderc">
    <LogoSpot to="/" />

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
          <input
            className="w-full rounded-lg bg-background-soft border border-borderc px-3 py-2 outline-none focus:border-brand"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />
          <button
            disabled={loading}
            className="w-full rounded-full bg-brand py-2 font-semibold text-white hover:bg-brand-light transition disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="my-4 h-px bg-borderc" />

        <GoogleButton onClick={signInWithGoogle} />

        <div className="mt-4 flex justify-between text-sm text-textc-muted">
          <Link to="/signup" className="hover:text-brand">Créer un compte</Link>
          <Link to="/reset" className="hover:text-brand">Mot de passe oublié ?</Link>
        </div>
      </div>
    </main>
  );
}
