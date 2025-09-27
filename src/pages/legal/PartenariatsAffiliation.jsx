// src/pages/legal/PartenariatsAffiliation.jsx
import { META } from "./_meta";

export default function PartenariatsAffiliation() {
  const m = META;
  return (
    <main className="mx-auto max-w-screen-sm px-4 py-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Partenariats & Affiliation</h1>

      <section className="mt-6">
        <h2 className="font-semibold">Transparence</h2>
        <p className="mt-2">
          Certains liens sur ce site sont des <strong>liens d’affiliation</strong>.
          Si vous cliquez et achetez, nous pouvons percevoir une commission, <strong>sans surcoût</strong> pour vous.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Indépendance éditoriale</h2>
        <p className="mt-2">
          Nos sélections et recommandations restent <strong>indépendantes</strong>.
          Les contenus sponsorisés/partenariats rémunérés sont <strong>clairement identifiés</strong> (“Publicité”, “Partenariat rémunéré”).
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Contact</h2>
        <p className="mt-2">
          <a className="underline" href={`mailto:${m.contactEmail}`}>{m.contactEmail}</a>
        </p>
      </section>
    </main>
  );
}
