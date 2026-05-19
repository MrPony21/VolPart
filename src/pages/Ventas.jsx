import React, { useState, useEffect, useContext } from 'react';
import { getProductsByInventory, getClientes, createSale } from '../api/api';
import ScannerInput from '../tools/ScannerInput';
import DeleteIcon from '@mui/icons-material/Delete';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import { BranchContext } from '../context/BranchContext';

import "../styles/Ventas.css";

const Ventas = () => {
  const [products, setProducts] = useState([]);
  const [ventasList, setVentasList] = useState([]);
  const [alertMsg, setAlertMsg] = useState("");
  const [cliente, setCliente] = useState({ nit: '', nombre: '', telefono: '', direccion: '' });
  const [modalCantidadOpen, setModalCantidadOpen] = useState(false);
  const [productoEdit, setProductoEdit] = useState(null);
  const [cantidadEdit, setCantidadEdit] = useState(1);
  const [modalAlert, setModalAlert] = useState("");
  const [fotoModal, setFotoModal] = useState({ open: false, url: "", nombre: "" });
  const [clientes, setClientes] = useState([]);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [manualCodigo, setManualCodigo] = useState("");
  const { selectedBranch } = useContext(BranchContext);
  

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
          nit: encontrado.nit,
          nombre: encontrado.nombreCliente,
          telefono: encontrado.telefono,
          direccion: encontrado.direccion,
        });
        setClienteEncontrado(true);
      }
      else {
        setCliente(prev => ({
          ...prev,
          nit: nitIngresado,
          nombre: '',
          telefono: '',
          direccion: '',
        }));
        setClienteEncontrado(false);
      }
    }
    else {
      setCliente(prev => ({ ...prev, [name]: value }));
    }
  };


  const handleManualVerificar = () => {
    const codigo = manualCodigo.trim();
    if (!codigo) return;
    handleScan(codigo);
    setManualCodigo("");
  };

  const handleEliminarProducto = (codigoproducto) => {
    setVentasList(prev => prev.filter(item => item.codigoproducto !== codigoproducto));
  };

  const handleScan = (codigo) => {
    const codigoLimpio = codigo.trim();
    const producto = products.find(p => p.upc === codigoLimpio);
    if (producto) {
      setVentasList(prev => {
        const idx = prev.findIndex(item => item.codigoproducto === producto.codigoproducto);
        if (idx !== -1) {
          if (prev[idx].cantidadVenta < producto.existencia) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], cantidadVenta: updated[idx].cantidadVenta + 1 };
            return updated;
          } else {
            setAlertMsg(`No hay suficiente stock para ${producto.nombreproducto}`);
            return prev;
          }
        }
        if (producto.existencia > 0) {
          return [...prev, { ...producto, cantidadVenta: 1 }];
        } else {
          setAlertMsg(`No hay stock disponible para ${producto.nombreproducto}`);
          return prev;
        }
      });
      setAlertMsg("");
    } else {
      setAlertMsg(`No se encontró el producto con código ${codigoLimpio}`);
    }
  };

const handleVenta = async () => {
  if (!cliente.nit || ventasList.length === 0) {
    setAlertMsg("Ingrese un cliente válido y al menos un producto");
    return;
  }

  const ventaPayload = {
    client: cliente,
    items: ventasList,
    total: totalVenta,
    date: new Date().toISOString()
  };

  try {
    const { nuevaVenta, invoicePath } = await createSale(ventaPayload);
    // Refrescar inventario en frontend
    const productosActualizados = await getProductsByInventory(selectedBranch?.codigoInventario);
    setProducts(productosActualizados);

    setAlertMsg(`Venta #${nuevaVenta.id} registrada.`);
    setVentasList([]);

    if (invoicePath) {
      setAlertMsg(prev => prev + ` Factura guardada en: ${invoicePath}`);
    }
  } catch (err) {
    console.error(err);
    setAlertMsg("Error al procesar la venta.");
  }
};


  const totalVenta = ventasList.reduce((acc, el) => acc + (parseFloat(el.precio) * el.cantidadVenta), 0);

  const handleOpenCantidadModal = (producto) => {
    setProductoEdit(producto);
    setCantidadEdit(producto.cantidadVenta);
    setModalCantidadOpen(true);
  };

  const handleSaveCantidad = () => {
    if (productoEdit) {
      setVentasList(prev => prev.map(item =>
        item.codigoproducto === productoEdit.codigoproducto
          ? { ...item, cantidadVenta: cantidadEdit }
          : item
      ));
    }
    setModalCantidadOpen(false);
    setProductoEdit(null);
  };

  const onChangeCantidad = (e) => {
    const value = e.target.value;
    setCantidadEdit(value);
    if (value > productoEdit.existencia) {
      setModalAlert("La cantidad seleccionada supera a la cantidad disponible");
    } else if (value <= 0) {
      setModalAlert("Selecciona una cantidad válida");
    } else {
      setModalAlert("");
    }
  };

  return (
    <div className="ventas-container">
      <div className="ventas-header">
        <h1 className="ventas-title">Punto de Venta</h1>
      </div>

      <h3 className="ventas-datosfactura-title">Datos de Factura</h3>
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
      </div>

      <h3 className="ventas-productos-title">Productos a vender</h3>
      {ventasList.length > 0 && (
        <div className="ventas-total">
          Total: Q {totalVenta.toFixed(2)}
        </div>
      )}
      <div className="ventas-clear" />

      {/* Scanner y alert */}
      <div className="ventas-scanner-card">
        <label className="ventas-label-bold" style={{ marginBottom: 8, display: "block" }}>
          Escanea el producto o ingrésalo manualmente
        </label>
        <ScannerInput onScan={handleScan} />
        <div className="ventas-manual-row">
          <input
            type="text"
            className="form-control"
            placeholder="Ingresar código manualmente"
            value={manualCodigo}
            onChange={e => setManualCodigo(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleManualVerificar()}
          />
          <button className="btn btn-primary" onClick={handleManualVerificar}>
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
            <th>Precio</th>
            <th>Foto</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ventasList.map((el, idx) => (
            <tr key={`${el.codigoproducto}+${idx}`}>
              <td>{idx + 1}</td>
              <td>{el.codigoproducto}</td>
              <td>{el.upc}</td>
              <td>{el.nombreproducto}</td>
              <td>{el.marca}</td>
              <td>
                <div className="ventas-cantidad-cell">
                  <span className="ventas-cantidad-span">
                    {el.cantidadVenta}
                  </span>
                  <button
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => handleOpenCantidadModal(el)}
                  >
                    <EditIcon fontSize="small" />
                  </button>
                </div>
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
              <td><b>Q{(parseFloat(el.precio) * el.cantidadVenta).toFixed(2)}</b></td>
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
          ))}
        </tbody>
      </table>

      <Modal
        open={modalCantidadOpen}
        onClose={() => setModalCantidadOpen(false)}
        aria-labelledby="modal-cantidad-title"
        aria-describedby="modal-cantidad-desc"
      >
        <Box className="ventas-modal-box">
          <h4 id="modal-cantidad-title">Editar cantidad</h4>
          {productoEdit && (
            <>
              <div className="ventas-modal-info">
                <b>{productoEdit.nombreproducto}</b><br />
                <span className="ventas-info-blue">
                  Disponible: {productoEdit.existencia}
                </span>
              </div>
              <input
                type="number"
                max={productoEdit.existencia}
                value={cantidadEdit}
                onChange={onChangeCantidad}
                onBlur={e => {
                  const val = Number(e.target.value);
                  setCantidadEdit(
                    Math.max(1, Math.min(productoEdit.existencia, isNaN(val) ? 1 : val))
                  );
                }}
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
                  disabled={!!modalAlert}
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

      {ventasList.length > 0 && (
        <div className="ventas-boton-realizar">
          <button
            className="btn btn-success ventas-btn-realizar"
            onClick={handleVenta}
          >
            Realizar Venta
          </button>
        </div>
      )}
    </div>
  );
};

export default Ventas;
