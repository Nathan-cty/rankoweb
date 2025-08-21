import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInEmail, signInWithGoogle } from "@/lib/auth";

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
    <main className="min-h-screen grid place-items-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold">Connexion</h1>
        {err && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-red-700 text-sm">{err}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full rounded-lg border px-3 py-2" type="email" placeholder="Email"
                 value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input className="w-full rounded-lg border px-3 py-2" type="password" placeholder="Mot de passe"
                 value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <button disabled={loading} className="w-full rounded-lg bg-indigo-600 py-2 text-white font-semibold">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="my-4 h-px bg-gray-200" />
        <div className="grid gap-2">
          <button onClick={signInWithGoogle} className="w-full rounded-lg border py-2">Continuer avec Google</button>
        </div>

        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <Link to="/signup" className="hover:underline">Créer un compte</Link>
          <Link to="/reset" className="hover:underline">Mot de passe oublié ?</Link>
        </div>
      </div>
    </main>
  );
}
