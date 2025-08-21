import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUpEmail } from "@/lib/auth";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await signUpEmail(email, password);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message ?? "Erreur d'inscription");
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold">Créer un compte</h1>
        {err && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-red-700 text-sm">{err}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full rounded-lg border px-3 py-2" type="email" placeholder="Email"
                 value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input className="w-full rounded-lg border px-3 py-2" type="password" placeholder="Mot de passe"
                 value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <button className="w-full rounded-lg bg-indigo-600 py-2 text-white font-semibold">S&apos;inscrire</button>
        </form>
        <div className="mt-4 text-sm">
          Déjà un compte ? <Link to="/signin" className="text-indigo-600 hover:underline">Se connecter</Link>
        </div>
      </div>
    </main>
  );
}
