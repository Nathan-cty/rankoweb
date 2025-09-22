// src/app/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import SignIn from "@/features/auth/SignIn.jsx";
import SignUp from "@/features/auth/SignUp.jsx";
import ResetPassword from "@/features/auth/ResetPassword.jsx";
import Dashboard from "@/pages/Dashboard.jsx";
import RankingDetail from "@/pages/RankingDetail.jsx";
import Rankings from "@/pages/Rankings.jsx";

import ProtectedRoute from "@/features/auth/ProtectedRoute.jsx";
import AnonOnly from "@/features/auth/AnonOnly.jsx";
import MangaDetail from "@/pages/MangaDetails";
import Favorites from "@/pages/Favorites.jsx";
import ImportMangas from "../pages/admin/ImportMangas";
import RankingResolver from "@/pages/RankingResolver.jsx";

export default function App() {
  return (
    <Routes>
      {/* Redirige la racine vers le dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Pages d'auth visibles seulement si NON connecté */}
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
      <Route
      path="/rankings/:id" element={<RankingDetail/>}
      />

      <Route
      path="/rankings" 
      element={
      <ProtectedRoute>
        <Rankings/>
        </ProtectedRoute>
      } />

      <Route
      path="/manga/:id"
      element={
        <ProtectedRoute>
          <MangaDetail/>
        </ProtectedRoute>
      }
      />

      <Route
  path="/favorites"
  element={
    <ProtectedRoute>
      <Favorites />
    </ProtectedRoute>
  }
/>

<Route path="/:username/:slug" element={<RankingResolver />} />
<Route path="/r/:slugShort" element={<RankingResolver />} />


      {/* Pages protégées (connexion requise) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

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
    </Routes>
  );
}
