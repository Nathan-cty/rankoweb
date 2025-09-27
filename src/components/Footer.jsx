import { Link } from "react-router-dom";

// Si tu as déjà la fonction dans src/pages/legal/_meta.jsx, importe-la.
// Sinon, ce fallback couvre Didomi / Cookiebot / Tarteaucitron / IAB TCF.
function openConsentCenter() {
  if (window.didomiOnReady) { window.didomiOnReady.push(() => window.Didomi?.preferences?.show()); return; }
  if (window.Cookiebot) { window.Cookiebot.renew(); return; }
  if (window.tarteaucitron) { window.tarteaucitron.userInterface.openPanel(); return; }
  if (window.__tcfapi) { window.__tcfapi("showConsentTool", 2, () => {}); return; }
  // Fallback : va sur la page cookies
  window.location.href = "/cookies";
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-borderc/40 bg-background-card text-xs text-textc-muted">
      <div className="mx-auto max-w-screen-sm px-4 py-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <Link to="/mentions-legales" className="hover:underline">Mentions légales</Link>
        <span aria-hidden>·</span>
        <Link to="/confidentialite" className="hover:underline">Confidentialité</Link>
        <span aria-hidden>·</span>
        <Link to="/cookies" className="hover:underline">Cookies</Link>
        <span aria-hidden>·</span>
        <Link to="/cgu" className="hover:underline">CGU</Link>
        {/* Garde /cgv pour plus tard si tu lances des abonnements */}
        {/* <span aria-hidden>·</span>
        <Link to="/cgv" className="hover:underline">CGV</Link> */}
        <span aria-hidden>·</span>
        <Link to="/partenariats-affiliation" className="hover:underline">Partenariats & Affiliation</Link>

        <span aria-hidden>·</span>
        <button
          type="button"
          onClick={openConsentCenter}
          className="underline decoration-dotted underline-offset-2 hover:decoration-solid"
          aria-label="Gérer mes préférences cookies"
        >
          Gérer mes cookies
        </button>

        {/* Ligne 2 mobile : copyright */}
        <div className="basis-full text-center text-[11px] text-textc-muted/80 mt-1">
          © {year} — Tous droits réservés
        </div>
      </div>
    </footer>
  );
}

