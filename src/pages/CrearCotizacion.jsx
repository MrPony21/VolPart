import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductsByInventory, getClientes, createCotizacion, createCliente } from '../api/api';
import { generarCotizacionPDF } from '../tools/generarCotizacion';
import ScannerInput from '../tools/ScannerInput';
import DeleteIcon from '@mui/icons-material/Delete';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import { BranchContext } from '../context/BranchContext';

import "../styles/Ventas.css";
import "../styles/Cotizaciones.css";

const CrearCotizacion = () => {
  const [products, setProducts] = useState([]);
  const [cotizacionList, setCotizacionList] = useState([]);
  const [alertMsg, setAlertMsg] = useState("");
  const [cliente, setCliente] = useState({ codigoCliente: 0, nit: '', nombre: '', telefono: '', direccion: '' });
  const [modalCantidadOpen, setModalCantidadOpen] = useState(false);
  const [productoEdit, setProductoEdit] = useState(null);
  const [cantidadEdit, setCantidadEdit] = useState(1);
  const [modalAlert, setModalAlert] = useState("");
  const [fotoModal, setFotoModal] = useState({ open: false, url: "", nombre: "" });
  const [clientes, setClientes] = useState([]);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [registrandoCliente, setRegistrandoCliente] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [manualCodigo, setManualCodigo] = useState("");
  const [manualCodigoProducto, setManualCodigoProducto] = useState("");
  const { selectedBranch } = useContext(BranchContext);
  const navigate = useNavigate();

  useEffect(() => {
    getProductsByInventory(selectedBranch?.codigoInventario)
      .then(data => setProducts(data))
      .catch(err => console.error(err));
    getClientes()
      .then(data => setClientes(data))
      .catch(err => console.error(err));
  }, [selectedBranch?.codigoInventario]);

  const handleClienteChange = (e) => {
    const { name, value } = e.target;

    if (name === 'nit') {
      const nitIngresado = value.trim();
      const encontrado = clientes.find(c => c.nit === nitIngresado);

      if (encontrado) {
        setCliente({
          codigoCliente: encontrado.codigoCliente ?? 0,
          nit: encontrado.nit,
          nombre: encontrado.nombreCliente,
          telefono: encontrado.telefono,
          direccion: encontrado.direccion,
        });
        setClienteEncontrado(true);
      } else {
        setCliente(prev => ({
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
      setCliente(prev => ({ ...prev, [name]: value }));
    }
  };

  const datosClienteCompletos =
    cliente.nit.trim() !== '' &&
    cliente.nombre.trim() !== '' &&
    cliente.telefono.trim() !== '' &&
    cliente.direccion.trim() !== '';

  const mostrarRegistrarCliente = !clienteEncontrado && cliente.nit.trim() !== '';

  const registrarClienteNuevo = async () => {
    if (!datosClienteCompletos) {
      setAlertMsg("Completa NIT, nombre, telefono y direccion para registrar al cliente.");
      return;
    }

    setRegistrandoCliente(true);
    try {
      const respuesta = await createCliente({
        nombreCliente: cliente.nombre.trim(),
        nit: cliente.nit.trim(),
        telefono: cliente.telefono.trim(),
        direccion: cliente.direccion.trim(),
      });

      const nuevoCliente = respuesta?.clienteSave ?? respuesta;

      setClientes(prev => [...prev, nuevoCliente]);
      setCliente({
        codigoCliente: nuevoCliente.codigoCliente ?? 0,
        nit: nuevoCliente.nit,
        nombre: nuevoCliente.nombreCliente,
        telefono: nuevoCliente.telefono,
        direccion: nuevoCliente.direccion,
      });
      setClienteEncontrado(true);
      setAlertMsg(`Cliente ${nuevoCliente.nombreCliente} registrado correctamente.`);
    } catch (err) {
      console.error("Error al registrar el cliente", err);
      setAlertMsg(err.message || "No se pudo registrar el cliente.");
    } finally {
      setRegistrandoCliente(false);
    }
  };

  const handleManualVerificar = () => {
    const codigo = manualCodigo.trim();
    if (!codigo) return;
    handleScan(codigo);
    setManualCodigo("");
  };

  const handleManualCodigoProductoVerificar = () => {
    const codigo = manualCodigoProducto.trim();
    if (!codigo) return;
    const producto = products.find(p => Number(p.codigoproducto) === Number(codigo));
    if (producto) {
      agregarProducto(producto);
    } else {
      setAlertMsg(`No se encontró el producto con código de producto ${codigo}`);
    }
    setManualCodigoProducto("");
  };

  const handleEliminarProducto = (codigoproducto) => {
    setCotizacionList(prev => prev.filter(item => item.codigoproducto !== codigoproducto));
  };

  // A diferencia del punto de venta, aqui no se corta por existencia: se puede
  // cotizar lo que el cliente pida aunque hoy no haya. Lo que falta se marca
  // en la tabla y el stock se exige al convertir la cotizacion en venta.
  const agregarProducto = (producto) => {
    setCotizacionList(prev => {
      const idx = prev.findIndex(item => item.codigoproducto === producto.codigoproducto);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], cantidadCotizada: updated[idx].cantidadCotizada + 1 };
        return updated;
      }
      return [...prev, { ...producto, cantidadCotizada: 1 }];
    });
    setAlertMsg("");
  };

  const handleScan = (codigo) => {
    const codigoLimpio = codigo.trim();
    const producto = products.find(p => p.upc === codigoLimpio);
    if (producto) {
      agregarProducto(producto);
    } else {
      setAlertMsg(`No se encontró el producto con código ${codigoLimpio}`);
    }
  };

  const totalCotizacion = cotizacionList.reduce(
    (acc, el) => acc + (parseFloat(el.precio) * el.cantidadCotizada), 0
  );

  const hayFaltantes = cotizacionList.some(el => el.cantidadCotizada > Number(el.existencia));

  const handleGuardarCotizacion = async () => {
    if (cotizacionList.length === 0) {
      setAlertMsg("Agrega al menos un producto a la cotización");
      return;
    }

    const itemsSnapshot = [...cotizacionList];
    const clienteSnapshot = { ...cliente };

    setGuardando(true);
    try {
      const cotizacionCreada = await createCotizacion({
        codigoCliente: clienteSnapshot.codigoCliente,
        codigoInventario: selectedBranch?.codigoInventario,
        items: itemsSnapshot.map(el => ({
          codigoProducto: el.codigoproducto,
          cantidad: el.cantidadCotizada,
        })),
      });

      // El total que se imprime es el que devolvio el API, calculado con los
      // precios que quedaron congelados en la cotizacion.
      generarCotizacionPDF({
        numeroSerie: cotizacionCreada?.numeroSerie,
        codigoCotizacion: cotizacionCreada?.codigoCotizacion,
        cliente: clienteSnapshot,
        items: itemsSnapshot.map(el => ({
          codigo: el.codigoproducto,
          descripcion: el.nombreproducto,
          cantidad: el.cantidadCotizada,
          precio: el.precio,
        })),
        total: cotizacionCreada?.total ?? totalCotizacion,
        nombreSucursal: selectedBranch?.nombreInventario,
      });

      setCotizacionList([]);
      setCliente({ codigoCliente: 0, nit: '', nombre: '', telefono: '', direccion: '' });
      setClienteEncontrado(false);
      setAlertMsg(`Cotización ${cotizacionCreada?.numeroSerie} guardada. Documento descargado.`);
    } catch (err) {
      console.error(err);
      setAlertMsg(err.message || "Error al guardar la cotización.");
    } finally {
      setGuardando(false);
    }
  };

  const handleOpenCantidadModal = (producto) => {
    setProductoEdit(producto);
    setCantidadEdit(producto.cantidadCotizada);
    setModalAlert("");
    setModalCantidadOpen(true);
  };

  const handleSaveCantidad = () => {
    if (productoEdit) {
      setCotizacionList(prev => prev.map(item =>
        item.codigoproducto === productoEdit.codigoproducto
          ? { ...item, cantidadCotizada: Number(cantidadEdit) }
          : item
      ));
    }
    setModalCantidadOpen(false);
    setProductoEdit(null);
  };

  const onChangeCantidad = (e) => {
    const value = e.target.value;
    setCantidadEdit(value);

    if (Number(value) <= 0) {
      setModalAlert("Selecciona una cantidad válida");
    } else if (Number(value) > Number(productoEdit.existencia)) {
      // Aviso, no bloqueo: cotizar mas de lo disponible es valido.
      setModalAlert(`Se cotizarán más unidades de las disponibles (${productoEdit.existencia}).`);
    } else {
      setModalAlert("");
    }
  };

  const cantidadInvalida = Number(cantidadEdit) <= 0 || cantidadEdit === "";

  return (
    <div className="ventas-container">
      <div className="ventas-header">
        <h1 className="ventas-title">Nueva Cotización</h1>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/Cotizaciones")}>
          Ver cotizaciones
        </button>
      </div>

      <h3 className="ventas-datosfactura-title">Datos del Cliente</h3>
      <div className="ventas-datosfactura-card">
        <div className="ventas-datosfactura-row">
          <div className="ventas-datosfactura-input-group">
            <label className="ventas-label-bold">Nit</label>
            <input
              type="text"
              name="nit"
              className="form-control"
              placeholder="NIT"
              value={cliente.nit}
              onChange={handleClienteChange}
            />
          </div>
          <div className="ventas-datosfactura-input-group">
            <label className="ventas-label-bold">Nombre</label>
            <input
              type="text"
              name="nombre"
              className="form-control"
              placeholder="Nombre"
              value={cliente.nombre}
              onChange={handleClienteChange}
              disabled={clienteEncontrado}
            />
          </div>
        </div>
        <div className="ventas-datosfactura-row">
          <div className="ventas-datosfactura-input-group">
            <label className="ventas-label-bold">Teléfono</label>
            <input
              type="text"
              name="telefono"
              className="form-control"
              placeholder="Teléfono"
              value={cliente.telefono}
              onChange={handleClienteChange}
              disabled={clienteEncontrado}
            />
          </div>
          <div className="ventas-datosfactura-input-group">
            <label className="ventas-label-bold">Dirección</label>
            <input
              type="text"
              name="direccion"
              className="form-control"
              placeholder="Dirección"
              value={cliente.direccion}
              onChange={handleClienteChange}
              disabled={clienteEncontrado}
            />
          </div>
        </div>

        {mostrarRegistrarCliente && (
          <div
            className="ventas-datosfactura-row"
            style={{ alignItems: 'center', marginBottom: 0, marginTop: 6 }}
          >
            <span style={{ color: '#777', flex: 1, minWidth: 220 }}>
              Este NIT no está registrado. Completa los datos para darlo de alta.
            </span>
            <button
              className="btn btn-primary"
              onClick={registrarClienteNuevo}
              disabled={!datosClienteCompletos || registrandoCliente}
            >
              {registrandoCliente ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registrando...
                </>
              ) : "Registrar cliente"}
            </button>
          </div>
        )}
      </div>

      <h3 className="ventas-productos-title">Productos a cotizar</h3>
      {cotizacionList.length > 0 && (
        <div className="ventas-total">
          Total: Q {totalCotizacion.toFixed(2)}
        </div>
      )}
      <div className="ventas-clear" />

      <div className="ventas-scanner-card">
        <label className="ventas-label-bold" style={{ marginBottom: 8, display: "block" }}>
          Escanea el producto o ingrésalo manualmente
        </label>
        <ScannerInput onScan={handleScan} />
        <div className="ventas-manual-row">
          <input
            type="text"
            className="form-control"
            placeholder="Ingresar UPC manualmente"
            value={manualCodigo}
            onChange={e => setManualCodigo(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleManualVerificar()}
          />
          <button className="btn btn-primary" onClick={handleManualVerificar}>
            Verificar
          </button>
        </div>
        <div className="ventas-manual-row">
          <input
            type="text"
            className="form-control"
            placeholder="Ingresar código de producto"
            value={manualCodigoProducto}
            onChange={e => /^\d*$/.test(e.target.value) && setManualCodigoProducto(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleManualCodigoProductoVerificar()}
          />
          <button className="btn btn-primary" onClick={handleManualCodigoProductoVerificar}>
            Verificar
          </button>
        </div>
        {alertMsg && (
          <div className="alert alert-info ventas-alert">
            {alertMsg}
          </div>
        )}
      </div>

      <table className="table table-striped table-bordered ventas-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Código</th>
            <th>UPC</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Cantidad</th>
            <th>Existencia</th>
            <th>Precio</th>
            <th>Foto</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cotizacionList.map((el, idx) => {
            const falta = el.cantidadCotizada > Number(el.existencia);
            return (
              <tr key={`${el.codigoproducto}+${idx}`}>
                <td>{idx + 1}</td>
                <td>{el.codigoproducto}</td>
                <td>{el.upc}</td>
                <td>{el.nombreproducto}</td>
                <td>{el.marca}</td>
                <td>
                  <div className="ventas-cantidad-cell">
                    <span className="ventas-cantidad-span">
                      {el.cantidadCotizada}
                    </span>
                    <button
                      className="btn btn-outline-warning btn-sm"
                      onClick={() => handleOpenCantidadModal(el)}
                    >
                      <EditIcon fontSize="small" />
                    </button>
                  </div>
                </td>
                <td className={falta ? "cotizacion-sin-stock" : ""}>
                  {el.existencia}
                  {falta && (
                    <span className="cotizacion-aviso-stock" title="Hoy no hay existencia suficiente para convertir esta línea en venta">
                      no alcanza
                    </span>
                  )}
                </td>
                <td>Q{el.precio}</td>
                <td className="ventas-foto-cell">
                  {el.urlfoto && (
                    <button
                      className="btn btn-outline-info btn-sm"
                      title="Ver foto"
                      onClick={() => setFotoModal({ open: true, url: el.urlfoto, nombre: el.nombreproducto })}
                    >
                      <ImageIcon fontSize="small" />
                    </button>
                  )}
                </td>
                <td><b>Q{(parseFloat(el.precio) * el.cantidadCotizada).toFixed(2)}</b></td>
                <td className="ventas-delete-cell">
                  <button
                    className="btn btn-danger btn-sm"
                    title="Eliminar"
                    onClick={() => handleEliminarProducto(el.codigoproducto)}
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Modal
        open={modalCantidadOpen}
        onClose={() => setModalCantidadOpen(false)}
        aria-labelledby="modal-cantidad-title"
      >
        <Box className="ventas-modal-box">
          <h4 id="modal-cantidad-title">Editar cantidad</h4>
          {productoEdit && (
            <>
              <div className="ventas-modal-info">
                <b>{productoEdit.nombreproducto}</b><br />
                <span className="ventas-info-blue">
                  Disponible hoy: {productoEdit.existencia}
                </span>
              </div>
              <input
                type="number"
                value={cantidadEdit}
                onChange={onChangeCantidad}
                className="form-control ventas-modal-input"
              />
              <span className="ventas-modal-alert">
                {modalAlert}
              </span>
              <div className="ventas-modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setModalCantidadOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveCantidad}
                  disabled={cantidadInvalida}
                >
                  Guardar
                </button>
              </div>
            </>
          )}
        </Box>
      </Modal>

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

      {cotizacionList.length > 0 && (
        <div className="ventas-boton-realizar">
          {hayFaltantes && (
            <div className="cotizacion-nota-faltantes">
              Hay líneas que superan la existencia actual. Se pueden cotizar, pero
              la cotización no se podrá convertir en venta hasta que haya stock.
            </div>
          )}
          <button
            className="btn btn-primary ventas-btn-realizar"
            onClick={handleGuardarCotizacion}
            disabled={guardando}
          >
            {guardando ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Guardando...
              </>
            ) : "Guardar Cotización"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CrearCotizacion;
