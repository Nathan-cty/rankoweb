// src/pages/legal/Cookies.jsx
import { META, openConsentCenter } from "./_meta";

export default function Cookies() {
  const m = META;
  return (
    <main className="mx-auto max-w-screen-sm px-4 py-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Politique cookies</h1>

      <section className="mt-6">
        <h2 className="font-semibold">1. Qu’est-ce qu’un cookie ?</h2>
        <p className="mt-2">
          Un cookie/traceur est un fichier déposé sur votre appareil pour permettre le fonctionnement du site,
          mesurer l’audience ou personnaliser la publicité.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">2. Catégories de traceurs</h2>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><strong>Essentiels</strong> : authentification, sécurité, préférences techniques.</li>
          <li><strong>Mesure d’audience</strong> : {m.analyticsTool || "outil d’analyse d’audience"}.</li>
          <li><strong>Publicité</strong> : {m.adNetwork || "régie publicitaire"} — uniquement si vous y consentez.</li>
          <li><strong>Réseaux sociaux</strong> : partage et intégrations (widgets).</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">3. Votre choix</h2>
        <p className="mt-2">
          À l’arrivée, un bandeau vous permet de <strong>Refuser</strong>, <strong>Accepter</strong> ou <strong>Personnaliser</strong>.
          Vous pouvez modifier vos choix à tout moment :
        </p>
        <button
          onClick={openConsentCenter}
          className="mt-3 inline-flex items-center rounded-lg border px-3 py-2 hover:bg-neutral-50"
        >
          Gérer mes cookies
        </button>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">4. Durées</h2>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Consentement : 6 mois (recommandé).</li>
          <li>Cookies d’audience : jusqu’à 13 mois (selon l’outil).</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">5. Partenaires</h2>
        <p className="mt-2">
          La liste des partenaires/traceurs et leurs finalités est disponible dans le centre de préférences ({m.cmpName || "CMP"}).
        </p>
      </section>
    </main>
  );
}
