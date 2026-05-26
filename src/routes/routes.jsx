import { Routes, Route, Navigate } from "react-router-dom";
import Inventory from "../pages/Inventory";
import ProductoDetalle from "../pages/ProductoDetalle";
import CrearProducto from "../pages/CrearProducto";
import Reportes from "../pages/Reportes";
import CargarArchivo from "../pages/CargarArchivo";
import Ventas from "../pages/Ventas";
import Clientes from "../pages/Clientes";
import Sales from "../pages/Sales";
import Login from "../pages/login";
import Usuarios from "../pages/Usuarios";
import RegistrarUsuarios from "../pages/RegistrarUsuarios";
import ProtectedRoute from "../components/ProtectedRoute";

const AppRouter = () => {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/" element={<Login />} />

      {/* Página de acceso denegado */}
      <Route
        path="/no-autorizado"
        element={
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <h2>Sin autorización</h2>
            <p>No tienes permiso para acceder a esta sección.</p>
            <a href="/">Volver al inicio</a>
          </div>
        }
      />

      {/* Rutas protegidas — ProtectedRoute verifica auth + rol */}
      <Route path="/Inventory"       element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/ProductoDetalle" element={<ProtectedRoute><ProductoDetalle /></ProtectedRoute>} />
      <Route path="/CrearProducto"   element={<ProtectedRoute><CrearProducto /></ProtectedRoute>} />
      <Route path="/Ventas"          element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
      <Route path="/Clientes"        element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
      <Route path="/Reportes"        element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
      <Route path="/CargarArchivo"   element={<ProtectedRoute><CargarArchivo /></ProtectedRoute>} />
      <Route path="/Sales"           element={<ProtectedRoute><Sales /></ProtectedRoute>} />
      <Route path="/Usuarios"        element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
      <Route path="/CrearUsuario"    element={<ProtectedRoute><RegistrarUsuarios /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;