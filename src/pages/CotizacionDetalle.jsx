import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getCotizacion,
  convertirCotizacionEnVenta,
  eliminarCotizacion,
  actualizarPreciosCotizacion,
  asignarClienteCotizacion,
  getClientes,
  createCliente,
} from '../api/api';
import { generarCotizacionPDF } from '../tools/generarCotizacion';
import { generarFacturaPDF } from '../tools/generarFactura';
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

  // Alta de cliente cuando la cotizacion se registro sin uno. Es opcional:
  // no bloquea nada mas en la pantalla mientras no se toque.
  const [clientes, setClientes] = useState([]);
  const [clientesCargados, setClientesCargados] = useState(false);
  const [formCliente, setFormCliente] = useState({ codigoCliente: 0, nit: '', nombre: '', telefono: '', direccion: '' });
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [vinculandoCliente, setVinculandoCliente] = useState(false);

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

  // La lista de clientes solo hace falta para detectar un NIT ya registrado,
  // asi que se carga una vez y solo cuando de verdad se va a usar: una
  // cotizacion ya con cliente, vendida o eliminada nunca la necesita.
  useEffect(() => {
    const necesitaClientes = esPendiente && cotizacion && !cotizacion.cliente;
    if (!necesitaClientes || clientesCargados) return;

    getClientes()
      .then(data => { setClientes(data); setClientesCargados(true); })
      .catch(err => console.error("Error al obtener clientes:", err));
  }, [cotizacion, esPendiente, clientesCargados]);

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

  // El comprobante de la venta convertida sale de dos fuentes: la cotizacion
  // recien releida trae cliente y producto completos (el "venta" que devuelve
  // la conversion no viene con esas relaciones cargadas), y la venta trae el
  // numero de serie AP- y el codigo real. El precio de cada linea es el
  // cotizado: es exactamente el que la conversion cobro, no el de lista.
  const construirFacturaDesdeConversion = (cotizacionData, ventaData) => {
    const clienteParaPdf = cotizacionData.cliente
      ? {
          nit: cotizacionData.cliente.nit,
          nombre: cotizacionData.cliente.nombreCliente,
          telefono: cotizacionData.cliente.telefono,
          direccion: cotizacionData.cliente.direccion,
        }
      : {};

    generarFacturaPDF({
      numeroSerie: ventaData?.numeroSerie,
      codigoVenta: ventaData?.codigoVenta,
      cliente: clienteParaPdf,
      items: (cotizacionData.items ?? []).map(item => ({
        codigoproducto: item.inventarioProducto?.producto?.codigoProducto ?? item.codigoInventarioProducto,
        nombreproducto: item.inventarioProducto?.producto?.nombreProducto ?? '-',
        precio: item.precioCotizado,
        cantidadVenta: item.cantidad,
      })),
      total: ventaData?.total ?? cotizacionData.total,
      nombreSucursal: cotizacionData.inventario?.nombreInventario,
      observacion: `Generado a partir de la cotización ${cotizacionData.numeroSerie}`,
    });
  };

  const realizarVenta = async () => {
    setModalConfirmar(null);
    setProcesando(true);
    setAviso("");
    try {
      const resultado = await convertirCotizacionEnVenta(cotizacion.codigoCotizacion);
      setCotizacion(resultado.cotizacion);
      setError("");
      setAviso(`Venta ${resultado.venta?.numeroSerie} registrada a partir de esta cotización. Descargando el comprobante...`);
      construirFacturaDesdeConversion(resultado.cotizacion, resultado.venta);
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

  // Igual que en el punto de venta: escribir el NIT detecta si ya existe un
  // cliente con ese numero y precarga sus datos (bloqueando los campos, para
  // no editarlo de paso). Si no existe, quedan libres para darlo de alta.
  const handleFormClienteChange = (e) => {
    const { name, value } = e.target;

    if (name === 'nit') {
      const nitIngresado = value.trim();
      const encontrado = clientes.find(c => c.nit === nitIngresado);

      if (encontrado) {
        setFormCliente({
          codigoCliente: encontrado.codigoCliente ?? 0,
          nit: encontrado.nit,
          nombre: encontrado.nombreCliente,
          telefono: encontrado.telefono,
          direccion: encontrado.direccion,
        });
        setClienteEncontrado(true);
      } else {
        setFormCliente(prev => ({
          ...prev,
          codigoCliente: 0,
          nit: nitIngresado,
          nombre: '',
          telefono: '',
          direccion: '',
        }));
        setClienteEncontrado(false);
      }
    } else {
      setFormCliente(prev => ({ ...prev, [name]: value }));
    }
  };

  const datosClienteFormCompletos =
    formCliente.nit.trim() !== '' &&
    formCliente.nombre.trim() !== '' &&
    formCliente.telefono.trim() !== '' &&
    formCliente.direccion.trim() !== '';

  // Vincula un cliente a una cotizacion que se registro sin uno. Si el NIT
  // coincidio con un cliente existente, se vincula directo; si no, primero
  // se registra -igual que en el punto de venta- y despues se vincula con
  // el codigo nuevo. Es opcional: la cotizacion funciona igual sin esto.
  const vincularCliente = async () => {
    if (!datosClienteFormCompletos) return;

    setVinculandoCliente(true);
    setAviso("");
    try {
      let codigoCliente = formCliente.codigoCliente;

      if (!codigoCliente) {
        const respuesta = await createCliente({
          nombreCliente: formCliente.nombre.trim(),
          nit: formCliente.nit.trim(),
          telefono: formCliente.telefono.trim(),
          direccion: formCliente.direccion.trim(),
        });
        const nuevoCliente = respuesta?.clienteSave ?? respuesta;
        codigoCliente = nuevoCliente.codigoCliente;
      }

      const actualizada = await asignarClienteCotizacion(cotizacion.codigoCotizacion, codigoCliente);
      setCotizacion(actualizada);
      setError("");
      setAviso(`Cliente ${actualizada.cliente?.nombreCliente ?? ""} vinculado a la cotización.`);
      setFormCliente({ codigoCliente: 0, nit: '', nombre: '', telefono: '', direccion: '' });
      setClienteEncontrado(false);
    } catch (err) {
      console.error("Error al vincular el cliente a la cotizacion:", err);
      setError(err.message || "No se pudo vincular el cliente.");
    } finally {
      setVinculandoCliente(false);
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
          <div className="sales-section">
            <div className="sales-client-row">
              <div className="sales-client-input-group" style={{ color: "#888" }}>
                Sin cliente registrado
              </div>
            </div>

            {esPendiente && (
              <div style={{ marginTop: 10 }}>
                <div className="sales-client-row">
                  <div className="sales-client-input-group">
                    <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>NIT</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nit"
                      placeholder="NIT del cliente"
                      value={formCliente.nit}
                      onChange={handleFormClienteChange}
                    />
                  </div>
                  <div className="sales-client-input-group">
                    <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      placeholder="Nombre"
                      value={formCliente.nombre}
                      onChange={handleFormClienteChange}
                      disabled={clienteEncontrado}
                    />
                  </div>
                </div>
                <div className="sales-client-row">
                  <div className="sales-client-input-group">
                    <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      name="telefono"
                      placeholder="Teléfono"
                      value={formCliente.telefono}
                      onChange={handleFormClienteChange}
                      disabled={clienteEncontrado}
                    />
                  </div>
                  <div className="sales-client-input-group">
                    <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Dirección</label>
                    <input
                      type="text"
                      className="form-control"
                      name="direccion"
                      placeholder="Dirección"
                      value={formCliente.direccion}
                      onChange={handleFormClienteChange}
                      disabled={clienteEncontrado}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  {clienteEncontrado && (
                    <span style={{ color: "#888", fontSize: 13 }}>
                      Cliente existente encontrado por NIT.
                    </span>
                  )}
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={vincularCliente}
                    disabled={!datosClienteFormCompletos || vinculandoCliente}
                  >
                    {vinculandoCliente ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Vinculando...
                      </>
                    ) : clienteEncontrado ? "Vincular cliente" : "Registrar cliente"}
                  </button>
                </div>
              </div>
            )}
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
