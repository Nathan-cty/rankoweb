import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-center">Chargement…</div>;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}
