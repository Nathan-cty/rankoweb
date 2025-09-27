// src/app/App.jsx
import { Routes, Route, Navigate, Outlet, useNavigate, useParams, useLocation } from "react-router-dom";

import SignIn from "@/features/auth/SignIn.jsx";
import SignUp from "@/features/auth/SignUp.jsx";
import ResetPassword from "@/features/auth/ResetPassword.jsx";
import Dashboard from "@/pages/Dashboard.jsx";
import RankingDetail from "@/pages/RankingDetail.jsx";
import Rankings from "@/pages/Rankings.jsx";

import ProtectedRoute from "@/features/auth/ProtectedRoute.jsx";
import AnonOnly from "@/features/auth/AnonOnly.jsx";
import MangaDetail from "@/pages/MangaDetails.jsx"; // ⚠️ vérifie bien le nom du fichier
import Favorites from "@/pages/Favorites.jsx";
import ImportMangas from "@/pages/admin/ImportMangas";
import RankingResolver from "@/pages/RankingResolver.jsx";
import AddMangaModal from "@/features/rankings/AddMangaModal.jsx";

// Pages légales (publiques)
import MentionsLegales from "@/pages/legal/MentionsLegales";
import Confidentialite from "@/pages/legal/Confidentialite";
import Cookies from "@/pages/legal/Cookies";
import CGU from "@/pages/legal/CGU";
// import CGV from "@/pages/legal/CGV"; // ← décommente quand le fichier existe
import PartenariatsAffiliation from "@/pages/legal/PartenariatsAffiliation";

// Layout avec Footer
import SiteLayout from "@/layouts/SiteLayout";

/* ---------------- util: smart close (pop si possible, sinon replace) ---------------- */
function useSmartClose(toParent = "..") {
  const navigate = useNavigate();
  const location = useLocation();

  const canGoBack =
    typeof window !== "undefined" &&
    window.history &&
    window.history.state &&
    typeof window.history.state.idx === "number" &&
    window.history.state.idx > 0;

  return () => {
    if (canGoBack) navigate(-1);
    else navigate(toParent, { relative: "path", replace: true });
  };
}

/* ---------------- Wrappers overlay (locaux à ce fichier) ---------------- */

// Modale d’ajout rendue en overlay, par-dessus RankingDetail
function AddMangaModalOverlay() {
  const { id: rankingId } = useParams();
  const smartClose = useSmartClose("..");

  return (
    <div className="fixed inset-0 z-[60]">
      <AddMangaModal rankingId={rankingId} onClose={smartClose} />
      {/* Outlet pour empiler la fiche détail au-dessus de la modale */}
      <Outlet />
    </div>
  );
}

// Fiche détail rendue en overlay (au-dessus de la modale)
function MangaDetailOverlay() {
  const smartClose = useSmartClose("..");

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      <button
        aria-label="Fermer la fiche"
        className="absolute inset-0 bg-black/30"
        onClick={smartClose}
      />
      <div className="relative z-10 h-full w-full pointer-events-none">
        <div className="pointer-events-auto h-full w-full">
          <MangaDetail />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Layout parent pour /rankings/:id ---------------- */
function RankingDetailLayout() {
  return (
    <>
      <RankingDetail />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Redirige la racine vers le dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Tout le site sous un layout commun AVEC Footer */}
      <Route element={<SiteLayout />}>
        {/* Pages publiques légales */}
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/confidentialite" element={<Confidentialite />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/cgu" element={<CGU />} />
        {/* <Route path="/cgv" element={<CGV />} /> */}
        <Route path="/partenariats-affiliation" element={<PartenariatsAffiliation />} />

        {/* Auth (visibles seulement si NON connecté) */}
        <Route
          path="/signin"
          element={
            <AnonOnly>
              <SignIn />
            </AnonOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <AnonOnly>
              <SignUp />
            </AnonOnly>
          }
        />
        <Route
          path="/reset"
          element={
            <AnonOnly>
              <ResetPassword />
            </AnonOnly>
          }
        />

        {/* Pages protégées */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rankings"
          element={
            <ProtectedRoute>
              <Rankings />
            </ProtectedRoute>
          }
        />

        {/* Détail + overlays (protégés) */}
        <Route
          path="/rankings/:id"
          element={
            <ProtectedRoute>
              <RankingDetailLayout />
            </ProtectedRoute>
          }
        >
          <Route path="add" element={<AddMangaModalOverlay />}>
            <Route path="manga/:id" element={<MangaDetailOverlay />} />
          </Route>
        </Route>

        {/* Fiche manga autonome (accès direct) */}
        <Route
          path="/manga/:id"
          element={
            <ProtectedRoute>
              <MangaDetail />
            </ProtectedRoute>
          }
        />

        {/* Favoris (protégé) */}
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />

        {/* Résolution publique de classements */}
        <Route path="/:username/:slug" element={<RankingResolver />} />
        <Route path="/r/:slugShort" element={<RankingResolver />} />

        {/* Import (protégé) */}
        <Route
          path="/import"
          element={
            <ProtectedRoute>
              <ImportMangas />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
