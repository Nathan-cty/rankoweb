// src/pages/legal/CGU.jsx
import { META } from "./_meta";

export default function CGU() {
  const m = META;
  return (
    <main className="mx-auto max-w-screen-sm px-4 py-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Conditions générales d’utilisation</h1>

      <section className="mt-6">
        <h2 className="font-semibold">1. Objet</h2>
        <p className="mt-2">
          Le service <strong>{m.siteName}</strong> permet de recencer, classer et partager vos oeuvres favorites..
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">2. Compte & éligibilité</h2>
        <p className="mt-2">
          Création de compte (si applicable), exactitude des informations. Âge minimum : <strong>[14]</strong> ans.
          Non-respect &rarr; suspension/suppression possible.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">3. Règles de conduite</h2>
        <p className="mt-2">
          Interdits : contenus illégaux/haineux/diffamatoires/violents, violation de droits d’auteur, spam, etc.
          Nous pouvons modérer, retirer des contenus et suspendre des comptes en cas d’abus.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">4. Contenus & propriété intellectuelle</h2>
        <p className="mt-2">
          Vous conservez vos droits. Vous accordez à {m.siteName} une licence non exclusive, mondiale et gratuite
          pour héberger, reproduire et afficher vos contenus dans le cadre du service. En cas de retrait/suppression,
          nous cessons l’affichage (sous réserve d’obligations légales).
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">5. Signalement & modération</h2>
        <p className="mt-2">
          Signaler un contenu : <a className="underline" href={`mailto:${m.contactEmail}`}>{m.contactEmail}</a>.
          Traitement dans un délai raisonnable, mesures appropriées.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">6. Liens externes & affiliation</h2>
        <p className="mt-2">
          Le site peut contenir des liens externes, dont des liens affiliés susceptibles de générer une commission
          sans surcoût pour vous. Le contenu éditorial reste indépendant.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">7. Publicité & contenus sponsorisés</h2>
        <p className="mt-2">
          Certaines zones peuvent comporter de la publicité ou des contenus sponsorisés, clairement identifiés comme tels.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">8. Responsabilité</h2>
        <p className="mt-2">
          Service fourni “en l’état”. Efforts de disponibilité sans garantie d’absence d’erreurs. Pas de responsabilité pour dommages indirects.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">9. Résiliation</h2>
        <p className="mt-2">
          Suppression du compte depuis <strong>[chemin]</strong> ou à <a className="underline" href={`mailto:${m.contactEmail}`}>{m.contactEmail}</a>.
          Suspension/suppression possible en cas de violation des CGU.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">10. Droit applicable</h2>
        <p className="mt-2">Droit français — tribunal compétent : {m.tribunalCity}.</p>
      </section>
    </main>
  );
}
