import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getCotizacion,
  convertirCotizacionEnVenta,
  eliminarCotizacion,
  actualizarPreciosCotizacion,
} from '../api/api';
import { generarCotizacionPDF } from '../tools/generarCotizacion';
import { formatFecha, quetzales } from '../tools/ventas';
import { ETIQUETA_ESTADO } from './Cotizaciones';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import "../styles/Sales.css";
import "../styles/Cotizaciones.css";

const CotizacionDetalle = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const codigoCotizacion = searchParams.get('codigoCotizacion');

  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(null); // 'venta' | 'eliminar' | 'actualizarPrecios' | null

  const cargar = async () => {
    if (!codigoCotizacion) return;
    try {
      setLoading(true);
      const data = await getCotizacion(codigoCotizacion);
      setCotizacion(data);
      setError("");
    } catch (err) {
      console.error("Error al obtener la cotizacion:", err);
      setError(err.message || "No se pudo cargar la cotización.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [codigoCotizacion]);

  const items = cotizacion?.items ?? [];
  const esPendiente = cotizacion?.estado === "PENDIENTE";

  // Existencia de hoy contra lo cotizado: es lo que decide si la conversion
  // va a pasar o la va a rechazar el API.
  const faltantes = items.filter(
    item => item.cantidad > Number(item.inventarioProducto?.existencia ?? 0)
  );

  // El precio pudo moverse desde que se cotizo. Se cobra el cotizado, pero
  // conviene que quien convierte lo sepa antes de pulsar el boton.
  const preciosCambiados = items.filter(
    item => Number(item.precioCotizado) !== Number(item.inventarioProducto?.precio ?? 0)
  );

  // Solo para el modal de confirmacion: cuanto quedaria el total si se
  // recalcula con el precio de hoy. El backend vuelve a leer el precio en
  // el momento de ejecutar, asi que esto es una vista previa, no el valor
  // que se aplica.
  const totalConPreciosActuales = items.reduce(
    (acc, item) => acc + Number(item.inventarioProducto?.precio ?? 0) * item.cantidad,
    0
  );

  // Recibe el objeto cotizacion explicito en vez de leerlo del estado del
  // componente: justo despues de actualizar precios se llama con la
  // respuesta fresca del API, y el estado todavia no se habria repintado.
  const construirPdfCotizacion = (data) => {
    const cliente = data.cliente
      ? {
          nit: data.cliente.nit,
          nombre: data.cliente.nombreCliente,
          telefono: data.cliente.telefono,
          direccion: data.cliente.direccion,
        }
      : {};

    generarCotizacionPDF({
      numeroSerie: data.numeroSerie,
      codigoCotizacion: data.codigoCotizacion,
      cliente,
      items: (data.items ?? []).map(item => ({
        codigo: item.inventarioProducto?.producto?.codigoProducto ?? item.codigoInventarioProducto,
        descripcion: item.inventarioProducto?.producto?.nombreProducto ?? '-',
        cantidad: item.cantidad,
        precio: item.precioCotizado,
      })),
      total: data.total,
      nombreSucursal: data.inventario?.nombreInventario,
    });
  };

  const descargarPdf = () => construirPdfCotizacion(cotizacion);

  const realizarVenta = async () => {
    setModalConfirmar(null);
    setProcesando(true);
    setAviso("");
    try {
      const resultado = await convertirCotizacionEnVenta(cotizacion.codigoCotizacion);
      setCotizacion(resultado.cotizacion);
      setError("");
      setAviso(`Venta ${resultado.venta?.numeroSerie} registrada a partir de esta cotización.`);
    } catch (err) {
      console.error("Error al convertir la cotizacion:", err);
      // El API rechaza por existencia o por estado; el mensaje ya viene claro.
      setError(err.message || "No se pudo realizar la venta.");
      // La existencia pudo cambiar: se recarga para que la pantalla no siga
      // mostrando el stock viejo que motivo el rechazo.
      cargar();
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = async () => {
    setModalConfirmar(null);
    setProcesando(true);
    setAviso("");
    try {
      const actualizada = await eliminarCotizacion(cotizacion.codigoCotizacion);
      setCotizacion(actualizada);
      setError("");
      setAviso("La cotización quedó eliminada.");
    } catch (err) {
      console.error("Error al eliminar la cotizacion:", err);
      setError(err.message || "No se pudo eliminar la cotización.");
    } finally {
      setProcesando(false);
    }
  };

  // Recalcula cada linea al precio de hoy y descarga el comprobante nuevo.
  // La cotizacion en si queda actualizada: el documento anterior deja de
  // representar lo que dice el sistema, asi que se reemplaza de una vez.
  const actualizarPrecios = async () => {
    setModalConfirmar(null);
    setProcesando(true);
    setAviso("");
    try {
      const actualizada = await actualizarPreciosCotizacion(cotizacion.codigoCotizacion);
      setCotizacion(actualizada);
      setError("");
      setAviso(`Precios actualizados. Nuevo total: ${quetzales(actualizada.total)}. Descargando el comprobante...`);
      // Con la respuesta del API directamente, no con el estado: el estado
      // todavia tiene el valor viejo mientras React no vuelve a renderizar.
      construirPdfCotizacion(actualizada);
    } catch (err) {
      console.error("Error al actualizar los precios de la cotizacion:", err);
      setError(err.message || "No se pudieron actualizar los precios.");
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <div className="sales-container">
        <Alert variant="filled" severity="info">Cargando cotización...</Alert>
      </div>
    );
  }

  if (!cotizacion) {
    return (
      <div className="sales-container">
        <Alert variant="filled" severity="error">
          {error || "No se encontró la cotización."}
        </Alert>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/Cotizaciones")}>
          Volver
        </button>
      </div>
    );
  }

  const estadoInfo = ETIQUETA_ESTADO[cotizacion.estado] ?? { texto: cotizacion.estado, clase: "" };

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h1 className="sales-title">
          {cotizacion.numeroSerie}
          <span className={`cotizacion-estado ${estadoInfo.clase}`} style={{ marginLeft: 12 }}>
            {estadoInfo.texto}
          </span>
        </h1>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/Cotizaciones")}>
          Volver
        </button>
      </div>

      {error && (
        <Alert variant="filled" severity="error" style={{ marginBottom: 16 }}>
          {error}
        </Alert>
      )}
      {aviso && (
        <Alert variant="filled" severity="success" style={{ marginBottom: 16 }}>
          {aviso}
        </Alert>
      )}

      <div className="sales-client-card">
        <div className="sales-client-row">
          <div className="sales-client-input-group">
            <strong>Código:</strong> {cotizacion.codigoCotizacion}
          </div>
          <div className="sales-client-input-group">
            <strong>Fecha:</strong> {formatFecha(cotizacion.fechaIngreso)}
          </div>
        </div>

        {cotizacion.venta && (
          <div className="sales-client-row">
            <div className="sales-client-input-group">
              <strong>Venta generada:</strong>{" "}
              <button
                className="btn btn-link btn-sm p-0"
                onClick={() => navigate(`/VentaDetalle?codigoVenta=${cotizacion.venta.codigoVenta}`)}
              >
                {cotizacion.venta.numeroSerie}
              </button>
            </div>
            <div className="sales-client-input-group">
              <strong>Convertida el:</strong> {formatFecha(cotizacion.fechaEstado)}
            </div>
          </div>
        )}

        {cotizacion.estado === "ELIMINADA" && (
          <div className="sales-client-row">
            <div className="sales-client-input-group">
              <strong>Eliminada el:</strong> {formatFecha(cotizacion.fechaEstado)}
            </div>
          </div>
        )}

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
            <div className="sales-client-row">
              <div className="sales-client-input-group">
                <strong>Teléfono:</strong> {cotizacion.cliente.telefono}
              </div>
              <div className="sales-client-input-group">
                <strong>Dirección:</strong> {cotizacion.cliente.direccion}
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

        <div className="sales-products-title">Productos cotizados</div>
        <table className="table table-striped table-bordered sales-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Código</th>
              <th>Nombre</th>
              <th>UPC</th>
              <th>Cantidad</th>
              <th>Precio cotizado</th>
              {esPendiente && <th>Precio actual</th>}
              {esPendiente && <th>Existencia</th>}
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const producto = item.inventarioProducto?.producto;
              const existencia = Number(item.inventarioProducto?.existencia ?? 0);
              const precioActual = Number(item.inventarioProducto?.precio ?? 0);
              const falta = item.cantidad > existencia;
              const cambioPrecio = Number(item.precioCotizado) !== precioActual;

              return (
                <tr key={item.codigoItemCotizacion}>
                  <td>{idx + 1}</td>
                  <td>
                    {producto?.codigoProducto ? (
                      <button
                        className="btn btn-link btn-sm p-0"
                        title="Ver el producto"
                        onClick={() => navigate(`/ProductoDetalle?codigoProducto=${producto.codigoProducto}`)}
                      >
                        {producto.codigoProducto}
                      </button>
                    ) : item.codigoInventarioProducto}
                  </td>
                  <td>{producto?.nombreProducto ?? "-"}</td>
                  <td>{producto?.upc ?? "-"}</td>
                  <td>{item.cantidad}</td>
                  <td>{quetzales(item.precioCotizado)}</td>
                  {esPendiente && (
                    <td className={cambioPrecio ? "cotizacion-precio-cambiado" : ""}>
                      {quetzales(precioActual)}
                    </td>
                  )}
                  {esPendiente && (
                    <td className={falta ? "cotizacion-sin-stock" : ""}>
                      {existencia}
                      {falta && (
                        <span className="cotizacion-aviso-stock">
                          faltan {item.cantidad - existencia}
                        </span>
                      )}
                    </td>
                  )}
                  <td><b>{quetzales(item.totalItemCotizacion)}</b></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="sales-total">
          TOTAL: {quetzales(cotizacion.total)}
        </div>
      </div>

      {esPendiente && faltantes.length > 0 && (
        <Alert severity="warning" style={{ marginBottom: 12 }}>
          No hay existencia suficiente para {faltantes.length} producto(s). La venta
          no se puede realizar hasta que haya stock; el resto de la cotización queda
          intacta mientras tanto.
        </Alert>
      )}

      {esPendiente && preciosCambiados.length > 0 && (
        <Alert severity="info" style={{ marginBottom: 12 }}>
          {preciosCambiados.length} producto(s) cambiaron de precio desde que se
          cotizó. La venta cobrará el precio cotizado, que es el que recibió el cliente.
        </Alert>
      )}

      <div className="cotizacion-acciones">
        <button className="btn btn-outline-primary" onClick={descargarPdf}>
          Descargar PDF
        </button>

        {esPendiente && preciosCambiados.length > 0 && (
          <button
            className="btn btn-outline-warning"
            onClick={() => setModalConfirmar('actualizarPrecios')}
            disabled={procesando}
          >
            Actualizar cotización con precios actuales
          </button>
        )}

        {esPendiente && (
          <>
            <button
              className="btn btn-outline-danger"
              onClick={() => setModalConfirmar('eliminar')}
              disabled={procesando}
            >
              Eliminar
            </button>
            <button
              className="btn btn-success"
              onClick={() => setModalConfirmar('venta')}
              disabled={procesando || faltantes.length > 0}
              title={faltantes.length > 0 ? "No hay existencia suficiente" : undefined}
            >
              {procesando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Procesando...
                </>
              ) : "Realizar venta"}
            </button>
          </>
        )}
      </div>

      <Modal open={modalConfirmar !== null} onClose={() => setModalConfirmar(null)}>
        <Box className="ventas-modal-box">
          {modalConfirmar === 'venta' ? (
            <>
              <h4>Realizar venta</h4>
              <p style={{ marginTop: 12 }}>
                Se va a registrar la venta de {cotizacion.numeroSerie} por{" "}
                <b>{quetzales(cotizacion.total)}</b>, con los precios cotizados.
                Esto descuenta la existencia y no se puede deshacer.
              </p>
              <div className="ventas-modal-actions">
                <button className="btn btn-secondary" onClick={() => setModalConfirmar(null)}>
                  Cancelar
                </button>
                <button className="btn btn-success" onClick={realizarVenta}>
                  Realizar venta
                </button>
              </div>
            </>
          ) : modalConfirmar === 'eliminar' ? (
            <>
              <h4>Eliminar cotización</h4>
              <p style={{ marginTop: 12 }}>
                {cotizacion.numeroSerie} quedará marcada como eliminada y ya no se
                podrá convertir en venta. El documento se conserva en el historial.
              </p>
              <div className="ventas-modal-actions">
                <button className="btn btn-secondary" onClick={() => setModalConfirmar(null)}>
                  Cancelar
                </button>
                <button className="btn btn-danger" onClick={eliminar}>
                  Eliminar
                </button>
              </div>
            </>
          ) : (
            <>
              <h4>Actualizar precios</h4>
              <p style={{ marginTop: 12 }}>
                Se va a recalcular {cotizacion.numeroSerie} con los precios de hoy.
                El total pasará de <b>{quetzales(cotizacion.total)}</b> a{" "}
                <b>{quetzales(totalConPreciosActuales)}</b>. Se descargará un
                comprobante nuevo con los precios actualizados.
              </p>
              <div className="ventas-modal-actions">
                <button className="btn btn-secondary" onClick={() => setModalConfirmar(null)}>
                  Cancelar
                </button>
                <button className="btn btn-warning" onClick={actualizarPrecios}>
                  Actualizar
                </button>
              </div>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default CotizacionDetalle;
