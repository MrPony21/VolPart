import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { allowedRoutes } from "../config/navConfig";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Espera a que AuthContext termine de leer el token del localStorage
  if (loading) return null;

  // No autenticado → al login
  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Rol no tiene acceso a esta ruta
  const permitted = allowedRoutes[user.rol] ?? [];
  if (!permitted.includes(location.pathname)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
}