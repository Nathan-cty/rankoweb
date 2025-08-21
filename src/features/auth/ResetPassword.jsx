import { useState } from "react";
import { resetPassword } from "@/lib/auth";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await resetPassword(email);
      setMsg("Email de réinitialisation envoyé.");
    } catch (e) {
      setErr(e.message ?? "Erreur");
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold">Réinitialiser le mot de passe</h1>
        {msg && <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-green-700 text-sm">{msg}</div>}
        {err && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-red-700 text-sm">{err}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full rounded-lg border px-3 py-2" type="email" placeholder="Email"
                 value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <button className="w-full rounded-lg bg-indigo-600 py-2 text-white font-semibold">Envoyer</button>
        </form>
      </div>
    </main>
  );
}
