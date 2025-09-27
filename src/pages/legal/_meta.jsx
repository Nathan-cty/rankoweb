// src/pages/legal/_meta.jsx
export const META = {
  siteName: "Ranko",
  companyName: "Associe Numerique",
  legalForm: "SAS",
  capital: "1000 €",
  address: "France",
  rcsOrSiren: "930402201",
  directorName: "Nathan C",
  directorRole: "Président",
  hostName: "OVH",
  hostAddress: "2, rue Kellermann – 59100 Roubaix – France",
};

// Helper générique pour rouvrir la CMP (gérer plusieurs CMP courantes)
export function openConsentCenter() {
  // Didomi
  if (window.didomiOnReady) {
    window.didomiOnReady.push(() => window.Didomi?.preferences?.show());
    return;
  }
  // Cookiebot
  if (window.Cookiebot) {
    window.Cookiebot.renew();
    return;
  }
  // Tarteaucitron
  if (window.tarteaucitron) {
    window.tarteaucitron.userInterface.openPanel();
    return;
  }
  // IAB __tcfapi (fallback)
  if (window.__tcfapi) {
    window.__tcfapi('showConsentTool', 2, () => {});
    return;
  }
  // Fallback : scroll vers /cookies si pas de CMP
  window.location.href = '/cookies';
}
