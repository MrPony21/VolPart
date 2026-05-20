import React, { useState, useContext } from 'react';
import "../styles/Reportes.css";
import { getProductsByInventory, getClientes, getSales } from '../api/api';
import { exportarInventarioExcel, exportarClientesExcel, exportarVentasExcel } from '../tools/exportExcel';
import { BranchContext } from '../context/BranchContext';
import Alert from '@mui/material/Alert';

function downloadJson(data, fileName) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

const Reportes = () => {
  const { selectedBranch } = useContext(BranchContext);
  const [loading, setLoading] = useState("");
  const [alertMsg, setAlertMsg] = useState({ type: "", text: "" });

  const notify = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg({ type: "", text: "" }), 4000);
  };

  const withLoading = async (key, fn) => {
    setLoading(key);
    try {
      await fn();
      notify("success", "Exportación completada correctamente.");
    } catch (err) {
      console.error(err);
      notify("error", "Error al exportar: " + (err.message || "Error desconocido"));
    } finally {
      setLoading("");
    }
  };

  const handleExcelInventario = () =>
    withLoading("excel-inv", async () => {
      const data = await getProductsByInventory(selectedBranch?.codigoInventario);
      await exportarInventarioExcel(data);
    });

  const handleExcelClientes = () =>
    withLoading("excel-cli", async () => {
      const data = await getClientes();
      await exportarClientesExcel(data);
    });

  const handleExcelVentas = () =>
    withLoading("excel-ven", async () => {
      const data = await getSales(selectedBranch?.codigoInventario);
      await exportarVentasExcel(data);
    });

  const handleJsonInventario = () =>
    withLoading("json-inv", async () => {
      const data = await getProductsByInventory(selectedBranch?.codigoInventario);
      downloadJson(data, 'inventario.json');
    });

  const handleJsonClientes = () =>
    withLoading("json-cli", async () => {
      const data = await getClientes();
      downloadJson(data, 'clientes.json');
    });

  const handleJsonVentas = () =>
    withLoading("json-ven", async () => {
      const data = await getSales(selectedBranch?.codigoInventario);
      downloadJson(data, 'ventas.json');
    });

  const btn = (key, label, onClick, color = "btn-primary") => (
    <button
      type="button"
      className={`btn ${color} buttom-reporte`}
      style={{ height: "100%" }}
      onClick={onClick}
      disabled={!!loading}
    >
      {loading === key ? "Exportando..." : label}
    </button>
  );

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ margin: "20px" }}>Reportes</h1>

      {alertMsg.text && (
        <Alert variant="filled" severity={alertMsg.type} style={{ marginBottom: 16 }}>
          {alertMsg.text}
        </Alert>
      )}

      <div className='panel-buttoms'>
        <h3>Excel</h3>
        {btn("excel-inv", "Exportar Inventario Excel", handleExcelInventario, "btn-success")}
        {btn("excel-ven", "Exportar Ventas Excel",     handleExcelVentas,     "btn-success")}
        {btn("excel-cli", "Exportar Clientes Excel",   handleExcelClientes,   "btn-success")}
      </div>

      <div className='panel-buttoms' style={{ marginTop: "40px" }}>
        <h3>JSON</h3>
        {btn("json-inv", "Exportar Inventario JSON", handleJsonInventario)}
        {btn("json-ven", "Exportar Ventas JSON",     handleJsonVentas)}
        {btn("json-cli", "Exportar Clientes JSON",   handleJsonClientes)}
      </div>
    </div>
  );
};

export default Reportes;
