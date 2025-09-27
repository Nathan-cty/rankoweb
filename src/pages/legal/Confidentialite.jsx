// src/pages/legal/Confidentialite.jsx
import { META } from "./_meta";

export default function Confidentialite() {
  const m = META;
  return (
    <main className="mx-auto max-w-screen-sm px-4 py-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Politique de confidentialité</h1>
      <p className="text-xs text-neutral-500 mt-1">Dernière mise à jour : {m.lastUpdate}</p>

      <section className="mt-6">
        <h2 className="font-semibold">1. Responsable du traitement</h2>
        <p className="mt-2">
          <strong>{m.companyName}</strong> — RCS {m.rcsCity} {m.rcsOrSiren} — Siège : {m.address}.<br />
          Contact privacy : <a className="underline" href={`mailto:${m.privacyEmail}`}>{m.privacyEmail}</a>.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">2. Données que nous collectons</h2>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Compte / profil (si applicable) : e-mail, pseudonyme, avatar, préférences.</li>
          <li>Usage du service : pages consultées, interactions, logs techniques.</li>
          <li>Mesure d’audience : événements via {m.analyticsTool || "notre outil d’analytics"} (IP partiellement masquée si configuré).</li>
          <li>Publicité (si consentie) : identifiants publicitaires/cookies, segments d’intérêt.</li>
          <li>Affiliation : clics sortants vers des marchands partenaires.</li>
          <li>Support : messages via formulaires.</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">3. Finalités & bases légales</h2>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Fourniture du service / sécurité : exécution du contrat ou intérêt légitime.</li>
          <li>Mesure d’audience : consentement (ou exemption CNIL si configuration stricte).</li>
          <li>Publicités personnalisées : consentement.</li>
          <li>Newsletters (si applicable) : consentement.</li>
          <li>Lutte anti-fraude / abus : intérêt légitime.</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">4. Durées de conservation (exemples)</h2>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Compte : pendant l’usage + <strong>[X]</strong> mois après suppression.</li>
          <li>Logs techniques / sécurité : <strong>[X]</strong> mois.</li>
          <li>Cookies/traceurs : voir la Politique cookies.</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">5. Destinataires & sous-traitants</h2>
        <p className="mt-2">
          Hébergeur, {m.analyticsTool || "outil analytics"}, {m.adNetwork || "régie publicitaire"}, {m.cmpName || "CMP"}, outil emailing, etc.
          La liste détaillée et les finalités figurent dans la Politique cookies / centre de préférences.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">6. Transferts hors UE</h2>
        <p className="mt-2">
          Le cas échéant, des garanties appropriées sont mises en place.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">7. Vos droits</h2>
        <p className="mt-2">
          Accès, rectification, effacement, opposition (incl. prospection), limitation, portabilité. <br />
          Exercer vos droits : <a className="underline" href={`mailto:${m.privacyEmail}`}>{m.privacyEmail}</a>. <br />
          Réclamation possible auprès de la CNIL (cnil.fr).
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">8. Comptes & suppression</h2>
        <p className="mt-2">
          Vous pouvez supprimer votre compte depuis <strong>[chemin/page]</strong> ou en écrivant à {m.privacyEmail}.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">9. Modifications</h2>
        <p className="mt-2">Cette politique peut évoluer. La date en haut de page reflète la dernière version.</p>
      </section>
    </main>
  );
}
