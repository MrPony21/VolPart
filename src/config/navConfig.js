import { FEATURES } from "./features";

export const navConfig = {
  ADMIN: [
    { label: "Inventario",   icon: "InventoryIcon",    to: "/Inventory" },
    { label: "Punto Venta",  icon: "SellIcon",          to: "/Ventas" },
    { label: "Ventas",       icon: "ReceiptIcon",       to: "/Sales" },
    { label: "Cotizaciones", icon: "RequestQuoteIcon",  to: "/Cotizaciones" },
    { label: "Clientes",     icon: "FaceIcon",          to: "/Clientes" },
    { label: "Usuarios",     icon: "PeopleIcon",        to: "/Usuarios" },
    { label: "Reportes",     icon: "DescriptionIcon",   to: "/Reportes" },
    ...(FEATURES.CARGAR_ARCHIVO
      ? [{ label: "Importar", icon: "FileUploadIcon",    to: "/CargarArchivo" }]
      : []),
  ],
  OPERADOR: [
    { label: "Inventario",   icon: "InventoryIcon",    to: "/Inventory" },
    { label: "Punto Venta",  icon: "SellIcon",          to: "/Ventas" },
    { label: "Ventas",       icon: "ReceiptIcon",       to: "/Sales" },
    { label: "Cotizaciones", icon: "RequestQuoteIcon",  to: "/Cotizaciones" },
    { label: "Clientes",     icon: "FaceIcon",          to: "/Clientes" },
    { label: "Reportes",     icon: "DescriptionIcon",   to: "/Reportes" },
  ],
};

export const allowedRoutes = {
  ADMIN: [
    "/Inventory", "/ProductoDetalle", "/CrearProducto",
    "/Ventas", "/Clientes", "/Reportes",
    ...(FEATURES.CARGAR_ARCHIVO ? ["/CargarArchivo"] : []),
    "/Sales", "/VentaDetalle", "/Usuarios", "/CrearUsuario", "/CrearSucursal",
    "/Cotizaciones", "/CrearCotizacion", "/CotizacionDetalle",
  ],
  OPERADOR: [
    "/Inventory", "/ProductoDetalle", "/CrearProducto",
    "/Ventas", "/Clientes", "/Reportes", "/Sales", "/VentaDetalle",
    "/Cotizaciones", "/CrearCotizacion", "/CotizacionDetalle",
  ],
};