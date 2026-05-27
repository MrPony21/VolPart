import React, { useState, useEffect, useContext } from 'react';
import { getSales } from '../api/api';
import "../styles/Sales.css";
import { BranchContext } from '../context/BranchContext';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ImageIcon from '@mui/icons-material/Image';
import ClearIcon from '@mui/icons-material/Clear';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const PAGE_SIZE = 10;

const adjustFecha = (isoStr) => {
  if (!isoStr) return null;
  return new Date(new Date(isoStr).getTime() - 6 * 60 * 60 * 1000);
};

const formatFecha = (isoStr) => {
  const date = adjustFecha(isoStr);
  if (!date) return "";
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const Sales = () => {
  const [ventas, setVentas] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState(null); // dayjs object o null
  const [currentPage, setCurrentPage] = useState(1);
  const [fotoModal, setFotoModal] = useState({ open: false, url: "", nombre: "" });
  const { selectedBranch } = useContext(BranchContext);

  useEffect(() => {
    if (selectedBranch?.codigoInventario) {
      getSales(selectedBranch.codigoInventario)
        .then(data => setVentas(data))
        .catch(err => console.error(err));
    }
  }, [selectedBranch?.codigoInventario]);

  useEffect(() => {
    let result = ventas;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(v =>
        v.numeroSerie.toLowerCase().includes(term) ||
        String(v.codigoVenta).includes(term) ||
        (v.cliente?.nombreCliente?.toLowerCase().includes(term)) ||
        (v.cliente?.nit?.toLowerCase().includes(term))
      );
    }

    if (fechaFiltro && dayjs(fechaFiltro).isValid()) {
      const fechaBuscada = dayjs(fechaFiltro).format("DD/MM/YYYY");
      result = result.filter(v => {
        const adjusted = adjustFecha(v.fechaIngreso);
        if (!adjusted) return false;
        const dd = String(adjusted.getUTCDate()).padStart(2, '0');
        const mm = String(adjusted.getUTCMonth() + 1).padStart(2, '0');
        const yyyy = adjusted.getUTCFullYear();
        return `${dd}/${mm}/${yyyy}` === fechaBuscada;
      });
    }

    setCurrentPage(1);
    setFiltered(result);
  }, [ventas, searchTerm, fechaFiltro]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const currentVentas = filtered.slice(start, start + PAGE_SIZE);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <div className="sales-container">
        <div className="sales-header">
          <h1 className="sales-title">Historial de Ventas</h1>
        </div>

        <div className="sales-filter-row">
          <div className="sales-filter-input-group">
            <label>Buscar por número de serie, código, cliente o NIT:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: AP-10, Nombre cliente, 123456789"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sales-filter-input-group">
            <label>Buscar por fecha:</label>
            <DatePicker
              value={fechaFiltro}
              onChange={(nuevaFecha) => setFechaFiltro(nuevaFecha)}
              inputFormat="DD/MM/YYYY"
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  fullWidth
                  inputProps={{
                    ...params.inputProps,
                    placeholder: "dd/mm/yyyy"
                  }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {fechaFiltro && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setFechaFiltro(null)}
                              title="Limpiar fecha"
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )}
                        {params.InputProps?.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          </div>
        </div>

        {currentVentas.length === 0 ? (
          <p>No hay ventas para mostrar.</p>
        ) : (
          currentVentas.map(venta => (
            <div className="sales-client-card" key={venta.codigoVenta}>

              {/* Encabezado de la venta */}
              <div className="sales-client-row">
                <div className="sales-client-input-group">
                  <h3 className="sales-client-title">{venta.numeroSerie}</h3>
                </div>
                <div className="sales-client-input-group" style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 13, color: "#888", display: "block" }}>
                    Código venta: {venta.codigoVenta}
                  </span>
                  {venta.fechaIngreso && (
                    <span style={{ fontSize: 13, color: "#888" }}>
                      Fecha: {formatFecha(venta.fechaIngreso)}
                    </span>
                  )}
                </div>
              </div>

              {/* Datos del cliente */}
              {venta.cliente ? (
                <div className="sales-section">
                  <div className="sales-section-title">Datos del Cliente</div>
                  <div className="sales-client-row">
                    <div className="sales-client-input-group">
                      <strong>Nombre:</strong> {venta.cliente.nombreCliente}
                    </div>
                    <div className="sales-client-input-group">
                      <strong>NIT:</strong> {venta.cliente.nit}
                    </div>
                  </div>
                  <div className="sales-client-row">
                    <div className="sales-client-input-group">
                      <strong>Teléfono:</strong> {venta.cliente.telefono}
                    </div>
                    <div className="sales-client-input-group">
                      <strong>Dirección:</strong> {venta.cliente.direccion}
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

              {/* Tabla de productos */}
              <div className="sales-products-title">Productos</div>
              <table className="table table-striped table-bordered sales-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>UPC</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Foto</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.items.map((item, idx) => {
                    const producto = item.inventarioProducto?.producto;
                    return (
                      <tr key={item.codigoItemVenta}>
                        <td>{idx + 1}</td>
                        <td>{producto?.codigoProducto ?? item.codigoInventarioProducto}</td>
                        <td>{producto?.nombreProducto ?? "-"}</td>
                        <td>{producto?.upc ?? "-"}</td>
                        <td>{item.cantidad}</td>
                        <td>Q{parseFloat(item.precioVenta).toFixed(2)}</td>
                        <td className="ventas-foto-cell">
                          {producto?.urlFoto ? (
                            <button
                              className="btn btn-outline-info btn-sm"
                              title="Ver foto"
                              onClick={() => setFotoModal({ open: true, url: producto.urlFoto, nombre: producto.nombreProducto })}
                            >
                              <ImageIcon fontSize="small" />
                            </button>
                          ) : null}
                        </td>
                        <td><b>Q{parseFloat(item.totalItemVenta).toFixed(2)}</b></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="sales-total">
                TOTAL: Q{parseFloat(venta.total).toFixed(2)}
              </div>
            </div>
          ))
        )}

        {/* Paginación */}
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

        {/* Modal de foto */}
        <Modal
          open={fotoModal.open}
          onClose={() => setFotoModal({ open: false, url: "", nombre: "" })}
        >
          <Box className="ventas-modal-box-foto">
            <h4 style={{ marginBottom: 16 }}>{fotoModal.nombre}</h4>
            <img
              src={fotoModal.url}
              alt={fotoModal.nombre}
              style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8 }}
            />
            <div style={{ textAlign: "right", marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setFotoModal({ open: false, url: "", nombre: "" })}>
                Cerrar
              </button>
            </div>
          </Box>
        </Modal>
      </div>
    </LocalizationProvider>
  );
};

export default Sales;