import React, { useState, useEffect } from 'react';
import { getProducts } from '../api/api';
import ScannerInput from '../tools/ScannerInput';
import DeleteIcon from '@mui/icons-material/Delete';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
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

  useEffect(() => {
    getProducts()
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleEliminarProducto = (codigo) => {
    setVentasList(prev => prev.filter(item => item.codigo !== codigo));
  };

  const handleScan = (codigo) => {
    const codigoLimpio = codigo.trim();
    const producto = products.find(p => p.codigo === codigoLimpio);
    if (producto) {
      setVentasList(prev => {
        const idx = prev.findIndex(item => item.codigo === producto.codigo);
        if (idx !== -1) {
          if (prev[idx].cantidadVenta < producto.cantidad) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], cantidadVenta: updated[idx].cantidadVenta + 1 };
            return updated;
          } else {
            setAlertMsg(`No hay suficiente stock para el producto ${producto.nombre}`);
            return prev;
          }
        }
        if (producto.cantidad > 0) {
          return [...prev, { ...producto, cantidadVenta: 1 }];
        } else {
          setAlertMsg(`No hay stock disponible para el producto ${producto.nombre}`);
          return prev;
        }
      });
      setAlertMsg("");
    } else {
      setAlertMsg(`No se encontró el producto con código ${codigoLimpio}`);
    }
  };

  const handleVenta = () => {
    setAlertMsg("Venta realizada con éxito (simulado)");
    setVentasList([]);
  };

  const totalVenta = ventasList.reduce((acc, el) => acc + (el.precio * el.cantidadVenta), 0);

  const handleOpenCantidadModal = (producto) => {
    setProductoEdit(producto);
    setCantidadEdit(producto.cantidadVenta);
    setModalCantidadOpen(true);
  };

  const handleSaveCantidad = () => {
    if (productoEdit) {
      setVentasList(prev => prev.map(item =>
        item.codigo === productoEdit.codigo
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
    if (value > productoEdit.cantidad) {
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
        <ScannerInput onScan={handleScan} />
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
            <th>Nombre</th>
            <th>Marca</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ventasList.map((el, idx) => (
            <tr key={`${el.codigo}+${idx}`}>
              <td>{idx + 1}</td>
              <td>{el.codigo}</td>
              <td>{el.nombre}</td>
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
              <td><b>Q{(el.precio * el.cantidadVenta).toFixed(2)}</b></td>
              <td className="ventas-delete-cell">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleEliminarProducto(el.codigo)}
                >
                  <DeleteIcon />
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
                <b>{productoEdit.nombre}</b><br />
                <span className="ventas-info-blue">
                  Disponible: {productoEdit.cantidad}
                </span>
              </div>
              <input
                type="number"
                max={productoEdit.cantidad}
                value={cantidadEdit}
                onChange={onChangeCantidad}
                onBlur={e => {
                  const val = Number(e.target.value);
                  setCantidadEdit(
                    Math.max(1, Math.min(productoEdit.cantidad, isNaN(val) ? 1 : val))
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
