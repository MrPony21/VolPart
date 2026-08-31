import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import { getSale } from '../api/api';
import { useAuth } from '../context/AuthContext';
import {
  costoItem,
  gananciaItem,
  itemSinCosto,
  totalVendidoVenta,
  totalCostoVenta,
  gananciaVenta,
  tieneItemSinCosto,
  margenPorcentaje,
  formatFecha,
  quetzales,
} from '../tools/ventas';
import "../styles/Sales.css";

// Tarjeta de un número del resumen
const Tarjeta = ({ etiqueta, valor, color }) => (
  <div
    style={{
      flex: '1 1 160px',
      background: '#fff',
      border: '1px solid #e0e6ed',
      borderRadius: 8,
      padding: '14px 18px',
    }}
  >
    <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{etiqueta}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color }}>{valor}</div>
  </div>
);

const VentaDetalle = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // El operador ve la venta completa, pero nada de costos ni ganancia:
  // esas columnas y el resumen son exclusivos del administrador.
  const esAdmin = user?.rol === "ADMIN";

  const searchParams = new URLSearchParams(location.search);
  const codigoVenta = searchParams.get('codigoVenta');

  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!codigoVenta) {
      setError("No se indicó qué venta mostrar.");
      setLoading(false);
      return;
    }

    const obtenerVenta = async () => {
      try {
        setLoading(true);
        const data = await getSale(codigoVenta);
        setVenta(data);
        setError("");
      } catch (err) {
        console.error("Error al obtener la venta:", err);
        setError("No se pudo cargar la venta.");
      } finally {
        setLoading(false);
      }
    };

    obtenerVenta();
  }, [codigoVenta]);

  const vendido = venta ? totalVendidoVenta(venta) : 0;
  const costo = venta ? totalCostoVenta(venta) : 0;
  const ganancia = venta ? gananciaVenta(venta) : 0;
  const margen = margenPorcentaje(ganancia, vendido);

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h1 className="sales-title">Detalle de Venta</h1>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          Regresar
        </button>
      </div>

      {loading && (
        <Alert variant="filled" severity="info">Cargando la venta...</Alert>
      )}

      {!loading && error && (
        <Alert variant="filled" severity="error">{error}</Alert>
      )}

      {!loading && venta && (
        <div className="sales-client-card">

          {/* Encabezado de la venta */}
          <div className="sales-client-row">
            <div className="sales-client-input-group">
              <h3 className="sales-client-title">{venta.numeroSerie}</h3>
              <span style={{ fontSize: 13, color: "#888" }}>
                Código venta: {venta.codigoVenta}
              </span>
            </div>
            <div className="sales-client-input-group" style={{ textAlign: "right" }}>
              <span style={{ fontSize: 13, color: "#888" }}>
                Fecha: {formatFecha(venta.fechaIngreso)}
              </span>
            </div>
          </div>

          {/* Cliente */}
          <div className="sales-section">
            <div className="sales-section-title">Datos del Cliente</div>
            {venta.cliente ? (
              <>
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
              </>
            ) : (
              <div style={{ color: "#888" }}>Sin cliente registrado</div>
            )}
          </div>

          {/* Resumen de la ganancia — solo administrador */}
          {esAdmin && (
            <div className="sales-section" style={{ marginTop: 20 }}>
              <div className="sales-section-title">Resumen de la ganancia</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
                <Tarjeta etiqueta="Vendido"     valor={quetzales(vendido)} color="#388e3c" />
                <Tarjeta etiqueta="Costo total" valor={quetzales(costo)}   color="#b58105" />
                <Tarjeta etiqueta="Ganancia"    valor={quetzales(ganancia)} color="#0d6efd" />
                <Tarjeta etiqueta="Margen"      valor={`${margen.toFixed(1)}%`} color="#555" />
              </div>
            </div>
          )}

          {esAdmin && tieneItemSinCosto(venta) && (
            <Alert severity="warning" style={{ marginTop: 16 }}>
              Esta venta tiene productos sin precio de compra registrado. Esos
              productos suman <strong>0</strong> de ganancia, no el precio de
              venta completo, para no reportar una utilidad que no fue real.
              Por eso <em>Vendido − Costo</em> puede no dar exactamente la ganancia.
            </Alert>
          )}

          {/* Detalle por producto */}
          <div className="sales-products-title" style={{ marginTop: 20 }}>
            Productos vendidos
          </div>
          <div className="table-responsive">
            <table className="table table-striped table-bordered sales-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>UPC</th>
                  <th>Cant.</th>
                  <th>P. Venta</th>
                  <th>Subtotal</th>
                  {esAdmin && (
                    <>
                      <th>P. Compra</th>
                      <th>Costo T</th>
                      <th>Ganancia</th>
                      <th>Margen</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {venta.items?.map((item, idx) => {
                  const producto = item.inventarioProducto?.producto;
                  const subtotal = parseFloat(item.totalItemVenta);
                  const costoLinea = costoItem(item);
                  const gananciaLinea = gananciaItem(item);
                  const sinCosto = itemSinCosto(item);

                  return (
                    <tr key={item.codigoItemVenta}>
                      <td>{idx + 1}</td>
                      <td>
                        {producto?.codigoProducto ? (
                          <button
                            className="btn btn-link btn-sm p-0"
                            title="Ver el producto"
                            onClick={() =>
                              navigate(`/ProductoDetalle?codigoProducto=${producto.codigoProducto}`)
                            }
                          >
                            {producto.codigoProducto}
                          </button>
                        ) : "-"}
                      </td>
                      <td>{producto?.nombreProducto ?? "-"}</td>
                      <td>{producto?.upc ?? "-"}</td>
                      <td>{item.cantidad}</td>
                      <td>{quetzales(item.precioVenta)}</td>
                      <td>{quetzales(subtotal)}</td>
                      {esAdmin && (
                        <>
                          <td>
                            {sinCosto ? (
                              <span style={{ color: "#b58105", fontSize: 13 }}>
                                No tiene costo registrado
                              </span>
                            ) : quetzales(item.precioCompra)}
                          </td>
                          <td>{quetzales(costoLinea)}</td>
                          <td>
                            <b style={{ color: sinCosto ? "#888" : "#0d6efd" }}>
                              {quetzales(gananciaLinea)}
                            </b>
                          </td>
                          <td>{margenPorcentaje(gananciaLinea, subtotal).toFixed(1)}%</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6}><b>Totales</b></td>
                  <td><b>{quetzales(vendido)}</b></td>
                  {esAdmin && (
                    <>
                      <td></td>
                      <td><b>{quetzales(costo)}</b></td>
                      <td><b style={{ color: "#0d6efd" }}>{quetzales(ganancia)}</b></td>
                      <td><b>{margen.toFixed(1)}%</b></td>
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="sales-total" style={{ marginTop: 16 }}>
            TOTAL: {quetzales(venta.total)}
          </div>
        </div>
      )}
    </div>
  );
};

export default VentaDetalle;
