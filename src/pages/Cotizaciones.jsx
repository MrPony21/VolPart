import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCotizaciones } from '../api/api';
import { BranchContext } from '../context/BranchContext';
import { formatFecha, quetzales } from '../tools/ventas';
import Alert from '@mui/material/Alert';
import "../styles/Sales.css";
import "../styles/Cotizaciones.css";

const PAGE_SIZE = 10;

// El valor va al query string del API; null trae todas.
// Cada filtro lleva el color de su estado puesto o no: relleno cuando esta
// seleccionado, borde y texto del mismo color cuando no.
const FILTROS = [
  { clave: "PENDIENTE", etiqueta: "Pendientes",      claseActiva: "cotizacion-filtro-pendiente", claseInactiva: "cotizacion-filtro-pendiente-outline" },
  { clave: "VENDIDA",   etiqueta: "Venta realizada", claseActiva: "cotizacion-filtro-vendida",   claseInactiva: "cotizacion-filtro-vendida-outline" },
  { clave: "ELIMINADA", etiqueta: "Eliminadas",      claseActiva: "cotizacion-filtro-eliminada", claseInactiva: "cotizacion-filtro-eliminada-outline" },
  // "Todas" no es un estado, asi que se queda con el azul del boton base.
  { clave: null,        etiqueta: "Todas",           claseActiva: "btn-primary",                 claseInactiva: "btn-outline-primary" },
];

export const ETIQUETA_ESTADO = {
  PENDIENTE: { texto: "Pendiente",       clase: "cotizacion-estado-pendiente" },
  VENDIDA:   { texto: "Venta realizada", clase: "cotizacion-estado-vendida" },
  ELIMINADA: { texto: "Eliminada",       clase: "cotizacion-estado-eliminada" },
};

const Cotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  // Al entrar al modulo se muestran las pendientes, que son las accionables.
  const [estado, setEstado] = useState("PENDIENTE");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const { selectedBranch } = useContext(BranchContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedBranch?.codigoInventario) return;

    setCargando(true);
    getCotizaciones(selectedBranch.codigoInventario, estado)
      .then(data => {
        setCotizaciones(data);
        setError("");
      })
      .catch(err => {
        console.error(err);
        setError(err.message || "No se pudieron cargar las cotizaciones.");
      })
      .finally(() => setCargando(false));

    setCurrentPage(1);
  }, [selectedBranch?.codigoInventario, estado]);

  const term = searchTerm.trim().toLowerCase();
  const filtered = term === "" ? cotizaciones : cotizaciones.filter(c =>
    (c.numeroSerie ?? "").toLowerCase().includes(term) ||
    String(c.codigoCotizacion).includes(term) ||
    (c.cliente?.nombreCliente?.toLowerCase().includes(term)) ||
    (c.cliente?.nit?.toLowerCase().includes(term))
  );

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const currentCotizaciones = filtered.slice(start, start + PAGE_SIZE);

  // Una linea no se puede vender si hoy no hay existencia para cubrirla.
  const lineasSinStock = (cotizacion) =>
    (cotizacion.items ?? []).filter(
      item => item.cantidad > Number(item.inventarioProducto?.existencia ?? 0)
    ).length;

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h1 className="sales-title">Cotizaciones</h1>
        <button className="btn btn-primary" onClick={() => navigate("/CrearCotizacion")}>
          Nueva cotización
        </button>
      </div>

      {error && (
        <Alert variant="filled" severity="error" style={{ marginBottom: 16 }}>
          {error}
        </Alert>
      )}

      <div className="cotizacion-filtros">
        {FILTROS.map(({ clave, etiqueta, claseActiva, claseInactiva }) => (
          <button
            key={etiqueta}
            className={`btn ${estado === clave ? claseActiva : claseInactiva}`}
            onClick={() => setEstado(clave)}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div className="sales-filter-row">
        <div className="sales-filter-input-group">
          <label>Buscar por número, código, cliente o NIT:</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej: COT-10, Nombre cliente, 123456789"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {cargando ? (
        <p>Cargando cotizaciones...</p>
      ) : currentCotizaciones.length === 0 ? (
        <p>No hay cotizaciones para mostrar.</p>
      ) : (
        currentCotizaciones.map(cotizacion => {
          const estadoInfo = ETIQUETA_ESTADO[cotizacion.estado] ?? {
            texto: cotizacion.estado, clase: "",
          };
          const faltantes = cotizacion.estado === "PENDIENTE" ? lineasSinStock(cotizacion) : 0;

          return (
            <div className="sales-client-card" key={cotizacion.codigoCotizacion}>

              <div className="sales-client-row">
                <div className="sales-client-input-group">
                  <h3 className="sales-client-title">{cotizacion.numeroSerie}</h3>
                  <span className={`cotizacion-estado ${estadoInfo.clase}`}>
                    {estadoInfo.texto}
                  </span>
                  {faltantes > 0 && (
                    <span
                      className="badge bg-warning text-dark"
                      style={{ marginLeft: 8, fontWeight: 500, fontSize: 12 }}
                      title="Hoy no hay existencia suficiente para convertir esta cotización en venta"
                    >
                      {faltantes} producto(s) sin stock
                    </span>
                  )}
                </div>
                <div className="sales-client-input-group" style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 13, color: "#888", display: "block" }}>
                    Código: {cotizacion.codigoCotizacion}
                  </span>
                  {cotizacion.fechaIngreso && (
                    <span style={{ fontSize: 13, color: "#888" }}>
                      Fecha: {formatFecha(cotizacion.fechaIngreso)}
                    </span>
                  )}
                  {cotizacion.venta && (
                    <span style={{ fontSize: 13, color: "#198754", display: "block" }}>
                      Venta: {cotizacion.venta.numeroSerie}
                    </span>
                  )}
                  <div style={{ marginTop: 6 }}>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate(`/CotizacionDetalle?codigoCotizacion=${cotizacion.codigoCotizacion}`)}
                    >
                      Ver detalle
                    </button>
                  </div>
                </div>
              </div>

              {cotizacion.cliente ? (
                <div className="sales-section">
                  <div className="sales-section-title">Datos del Cliente</div>
                  <div className="sales-client-row">
                    <div className="sales-client-input-group">
                      <strong>Nombre:</strong> {cotizacion.cliente.nombreCliente}
                    </div>
                    <div className="sales-client-input-group">
                      <strong>NIT:</strong> {cotizacion.cliente.nit}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="sales-client-row">
                  <div className="sales-client-input-group" style={{ color: "#888" }}>
                    Sin cliente registrado
                  </div>
                </div>
              )}

              <div className="sales-total">
                TOTAL: {quetzales(cotizacion.total)}
              </div>
            </div>
          );
        })
      )}

      <div className="sales-pagination">
        <button
          className={`sales-pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <span className="sales-page-info">
          Página {currentPage} de {pageCount}
        </span>
        <button
          className={`sales-pagination-button ${currentPage === pageCount ? 'disabled' : ''}`}
          onClick={() => setCurrentPage(p => Math.min(p + 1, pageCount))}
          disabled={currentPage === pageCount}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default Cotizaciones;
