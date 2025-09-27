// src/pages/legal/MentionsLegales.jsx
import { META } from "./_meta";

export default function MentionsLegales() {
  const m = META;
  return (
    <main className="mx-auto max-w-screen-sm px-4 py-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Mentions légales</h1>

      <section className="mt-6">
        <h2 className="font-semibold">Éditeur du site</h2>
        <p className="mt-2">
          <strong>{m.companyName}</strong>, {m.legalForm} au capital de <strong>{m.capital}</strong><br />
          Siège social : <strong>{m.address}</strong><br />
          Immatriculée au RCS de {m.rcsCity} sous le n° <strong>{m.rcsOrSiren}</strong><br />
          N° SIRET : <strong>{m.siret}</strong><br />
          {m.vat && <>N° TVA intracommunautaire : <strong>{m.vat}</strong><br /></>}
          Contact : <a className="underline" href={`mailto:${m.contactEmail}`}>{m.contactEmail}</a>
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Directeur de la publication</h2>
        <p className="mt-2">
          {m.directorName}, {m.directorRole}.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Hébergeur</h2>
        <p className="mt-2">
          <strong>{m.hostName}</strong><br />
          {m.hostAddress}<br />
          Support : {m.hostSupport}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Propriété intellectuelle</h2>
        <p className="mt-2">
          Sauf mention contraire, l’ensemble des contenus présents sur ce site est protégé.
          Toute reproduction non autorisée est interdite.
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
