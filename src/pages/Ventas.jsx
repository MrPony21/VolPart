import React, { useState, useEffect } from 'react';
import { getProducts } from '../api/api';
import ScannerInput from '../tools/ScannerInput';

const Ventas = () => {
  const [products, setProducts] = useState([]);
  const [ventasList, setVentasList] = useState([]);
  const [alertMsg, setAlertMsg] = useState("");
  const [cliente, setCliente] = useState({ nit: '', nombre: '', telefono: '', direccion: '' });

  useEffect(() => {
    getProducts()
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setCliente(prev => ({ ...prev, [name]: value }));
  };


  const handleScan = (codigo) => {
    const codigoLimpio = codigo.trim();
    const producto = products.find(p => p.codigo === codigoLimpio);
    if (producto) {
      setVentasList(prev => {
        const idx = prev.findIndex(item => item.codigo === producto.codigo);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], cantidadVenta: updated[idx].cantidadVenta + 1 };
          return updated;
        }
        return [...prev, { ...producto, cantidadVenta: 1 }];
      });
      setAlertMsg("");
    } else {
      setAlertMsg(`No se encontró el producto con código ${codigoLimpio}`);
    }
  };

  //Falta agregar la logica para afectar a los datos reales
  const handleVenta = () => {
    setAlertMsg("Venta realizada con éxito (simulado)");
    setVentasList([]);
  };

  // Calcular el total de la venta
  const totalVenta = ventasList.reduce((acc, el) => acc + (el.precio * el.cantidadVenta), 0);

  return (
    <div style={{ padding: 30, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
        <h1 style={{ margin: 0, color: '#1976d2', letterSpacing: 2 }}>Punto de Venta</h1>
      </div>
      <h3 style={{ fontWeight: 700, color: '#1976d2', marginBottom: 18, marginLeft: 2 }}>Datos de Factura</h3>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #bdbdbd22', padding: 24, marginBottom: 30 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontWeight: 600 }}>Nit</label>
            <input type="text" name="nit" value={cliente.nit} onChange={handleClienteChange} className="form-control" placeholder="NIT" />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontWeight: 600 }}>Nombre</label>
            <input type="text" name="nombre" value={cliente.nombre} onChange={handleClienteChange} className="form-control" placeholder="Nombre" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontWeight: 600 }}>Teléfono</label>
            <input type="text" name="telefono" value={cliente.telefono} onChange={handleClienteChange} className="form-control" placeholder="Teléfono" />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontWeight: 600 }}>Dirección</label>
            <input type="text" name="direccion" value={cliente.direccion} onChange={handleClienteChange} className="form-control" placeholder="Dirección" />
          </div>
        </div>
      </div>
      <h3 style={{ fontWeight: 700, color: '#1976d2', marginBottom: 18, display: 'inline-block' }}>Productos a vender</h3>
      {ventasList.length > 0 && (
        <div style={{ float: 'right', fontSize: 22, fontWeight: 700, color: '#388e3c', background: '#e8f5e9', borderRadius: 8, padding: '10px 24px', boxShadow: '0 2px 8px #b2dfdb55', marginBottom: 18 }}>
          Total: Q {totalVenta.toFixed(2)}
        </div>
      )}
      <div style={{ clear: 'both' }}></div>
      <div style={{ marginBottom: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #bdbdbd22', padding: 20 }}>
        <ScannerInput onScan={handleScan} />
        {alertMsg && (
          <div className="alert alert-info" style={{ margin: 10 }}>{alertMsg}</div>
        )}
      </div>
      <table className="table table-striped table-bordered" style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #bdbdbd22' }}>
        <thead style={{ background: '#1976d2', color: '#fff' }}>
          <tr>
            <th>#</th>
            <th>Código</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {ventasList.map((el, idx) => (
            <tr key={`${el.codigo}+${idx}`}>
              <td>{idx + 1}</td>
              <td>{el.codigo}</td>
              <td>{el.nombre}</td>
              <td>{el.marca}</td>
              <td>{el.cantidadVenta}</td>
              <td>Q{el.precio}</td>
              <td><b>Q{(el.precio * el.cantidadVenta).toFixed(2)}</b></td>
            </tr>
          ))}
        </tbody>
      </table>
      {ventasList.length > 0 && (
        <div style={{ textAlign: 'right', marginTop: 30 }}>
          <button className="btn btn-success" style={{ fontSize: 18, padding: '10px 32px', borderRadius: 8 }} onClick={handleVenta}>Realizar Venta</button>
        </div>
      )}
    </div>
  );
};

export default Ventas;
