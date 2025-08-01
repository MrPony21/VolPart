import React, { useState, useEffect } from 'react';
import { getSales } from '../api/api';
import "../styles/sales.css";

const PAGE_SIZE = 10;

const Sales = () => {
  const [ventas, setVentas] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Carga inicial y orden descendente
  useEffect(() => {
    getSales()
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setVentas(sorted);
      })
      .catch(err => console.error(err));
  }, []);

  // Aplicar filtros cada vez que cambian ventas, searchTerm o fechas
  useEffect(() => {
    let result = ventas;
    if (fromDate) {
      const from = new Date(fromDate);
      result = result.filter(v => new Date(v.date) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      result = result.filter(v => new Date(v.date) <= to);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(v =>
        v.client.nit.toLowerCase().includes(term) ||
        v.client.nombre.toLowerCase().includes(term)
      );
    }
    setCurrentPage(1);
    setFiltered(result);
  }, [ventas, searchTerm, fromDate, toDate]);

  // Paginación
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const currentVentas = filtered.slice(start, start + PAGE_SIZE);

  const handlePrev = () => setCurrentPage(p => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage(p => Math.min(p + 1, pageCount));

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h1 className="sales-title">Historial de Ventas</h1>
      </div>

      {/* Filtros */}
      <div className="sales-filter-row">
        <div className="sales-filter-input-group">
          <label>Desde:</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>
        <div className="sales-filter-input-group">
          <label>Hasta:</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>
        <div className="sales-filter-input-group">
          <label>Buscar cliente:</label>
          <input
            type="text"
            placeholder="NIT o nombre"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de ventas paginada */}
      {currentVentas.length === 0 ? (
        <p>No hay ventas para estos filtros.</p>
      ) : (
        currentVentas.map(venta => (
          <div className="sales-client-card" key={venta.id}>
            <h3 className="sales-client-title">Venta #{venta.id}</h3>

            <div className="sales-client-row">
              <div className="sales-client-input-group">
                <strong>Fecha:</strong> {new Date(venta.date).toLocaleString()}
              </div>
              <div className="sales-client-input-group">
                <strong>Total:</strong> Q{venta.total.toFixed(2)}
              </div>
            </div>

            <div className="sales-client-row">
              <div className="sales-client-input-group">
                <strong>Cliente:</strong> {venta.client.nombre} ({venta.client.nit})
              </div>
              <div className="sales-client-input-group">
                <strong>Teléfono:</strong> {venta.client.telefono}
              </div>
            </div>

            <div className="sales-products-title">Productos</div>
            <table className="sales-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {venta.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{item.codigo}</td>
                    <td>{item.nombre}</td>
                    <td>{item.cantidadVenta}</td>
                    <td>Q{item.precio.toFixed(2)}</td>
                    <td>Q{(item.precio * item.cantidadVenta).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sales-total">
              TOTAL: Q{venta.total.toFixed(2)}
            </div>
          </div>
        ))
      )}

      {/* Paginación */}
      <div className="sales-pagination">
        <button
          className={`sales-pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={handlePrev}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <span className="sales-page-info">
          Página {currentPage} de {pageCount}
        </span>
        <button
          className={`sales-pagination-button ${currentPage === pageCount ? 'disabled' : ''}`}
          onClick={handleNext}
          disabled={currentPage === pageCount}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default Sales;
