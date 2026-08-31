import React, { useState, useContext } from 'react';
import "../styles/Reportes.css";
import { getProductsByInventory, getClientes, getSales } from '../api/api';
import { exportarInventarioExcel, exportarClientesExcel, exportarVentasExcel, downloadJson } from '../tools/exportExcel';
import { BranchContext } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import Alert from '@mui/material/Alert';

const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const Reportes = () => {
  const { selectedBranch } = useContext(BranchContext);
  const { user } = useAuth();
  // Los costos y la ganancia son solo para el administrador
  const esAdmin = user?.rol === "ADMIN";
  const [loading, setLoading] = useState("");
  const [alertMsg, setAlertMsg] = useState({ type: "", text: "" });
  const [modalVentas, setModalVentas] = useState(false);
  const [periodoVentas, setPeriodoVentas] = useState("todo");
  const [ventasCache, setVentasCache] = useState([]);
  const [periodosVentas, setPeriodosVentas] = useState([]); // ["2026-08", ...]
  const [anioVentas, setAnioVentas] = useState("");
  const [mesNumeroVentas, setMesNumeroVentas] = useState("");

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

  const sucursal = selectedBranch?.nombreInventario;

  const handleExcelInventario = () =>
    withLoading("excel-inv", async () => {
      const data = await getProductsByInventory(selectedBranch?.codigoInventario);
      await exportarInventarioExcel(data, sucursal);
    });

  const handleExcelClientes = () =>
    withLoading("excel-cli", async () => {
      const data = await getClientes();
      await exportarClientesExcel(data);
    });

  // Clave "YYYY-MM" en hora local de una venta
  const claveMes = (fechaIngreso) => {
    const fecha = new Date(fechaIngreso);
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
  };

  const filtrarVentasPorMes = (ventas, mes) =>
    ventas.filter((v) => v.fechaIngreso && claveMes(v.fechaIngreso) === mes);

  // Años con ventas, del mas reciente al mas viejo
  const aniosDisponibles = [...new Set(periodosVentas.map((p) => p.split("-")[0]))]
    .sort()
    .reverse();

  // Meses con ventas dentro del año elegido
  const mesesDelAnio = periodosVentas
    .filter((p) => p.startsWith(`${anioVentas}-`))
    .map((p) => p.split("-")[1])
    .sort()
    .reverse();

  // Las ventas se cargan antes de abrir el modal para ofrecer solo los meses
  // y años que de verdad tienen ventas registradas.
  const abrirModalVentas = async () => {
    setLoading("excel-ven");
    try {
      const data = await getSales(selectedBranch?.codigoInventario);
      const periodos = [
        ...new Set(data.filter((v) => v.fechaIngreso).map((v) => claveMes(v.fechaIngreso))),
      ].sort().reverse();

      if (periodos.length === 0) {
        notify("error", "No hay ventas registradas en esta sucursal.");
        return;
      }

      setVentasCache(data);
      setPeriodosVentas(periodos);
      setPeriodoVentas("todo");
      setAnioVentas("");
      setMesNumeroVentas("");
      setModalVentas(true);
    } catch (err) {
      console.error(err);
      notify("error", "No se pudieron cargar las ventas: " + (err.message || "Error desconocido"));
    } finally {
      setLoading("");
    }
  };

  const confirmarExcelVentas = () => {
    const porMes = periodoVentas === "mes";
    const mes = `${anioVentas}-${mesNumeroVentas}`;
    setModalVentas(false);

    withLoading("excel-ven", async () => {
      const ventasFiltradas = porMes ? filtrarVentasPorMes(ventasCache, mes) : ventasCache;

      if (ventasFiltradas.length === 0) {
        throw new Error("No hay ventas en el período seleccionado.");
      }

      await exportarVentasExcel(ventasFiltradas, sucursal, {
        incluirGanancia: esAdmin,
        etiquetaPeriodo: porMes
          ? `${NOMBRES_MES[Number(mesNumeroVentas) - 1]} ${anioVentas}`
          : "Todas las ventas",
      });
    });
  };

  const handleJsonInventario = () =>
    withLoading("json-inv", async () => {
      const data = await getProductsByInventory(selectedBranch?.codigoInventario);
      downloadJson(data, 'Inventario', sucursal);
    });

  const handleJsonClientes = () =>
    withLoading("json-cli", async () => {
      const data = await getClientes();
      downloadJson(data, 'clientes');
    });

  const handleJsonVentas = () =>
    withLoading("json-ven", async () => {
      const data = await getSales(selectedBranch?.codigoInventario);
      downloadJson(data, 'ventas', sucursal);
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
        {btn("excel-ven", "Exportar Ventas Excel",     abrirModalVentas,      "btn-success")}
        {btn("excel-cli", "Exportar Clientes Excel",   handleExcelClientes,   "btn-success")}
      </div>

      <div className='panel-buttoms' style={{ marginTop: "40px" }}>
        <h3>JSON</h3>
        {btn("json-inv", "Exportar Inventario JSON", handleJsonInventario)}
        {btn("json-ven", "Exportar Ventas JSON",     handleJsonVentas)}
        {btn("json-cli", "Exportar Clientes JSON",   handleJsonClientes)}
      </div>

      {modalVentas && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#fff', padding: 30, borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)', minWidth: 360
            }}
          >
            <h3>Exportar Ventas</h3>
            <p style={{ marginTop: 15, marginBottom: 15 }}>
              ¿Qué período quieres incluir en el reporte?
            </p>

            <label style={{ display: 'block', marginBottom: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="periodoVentas"
                checked={periodoVentas === "todo"}
                onChange={() => setPeriodoVentas("todo")}
                style={{ marginRight: 8 }}
              />
              Desde siempre
            </label>

            <label style={{ display: 'block', marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name="periodoVentas"
                checked={periodoVentas === "mes"}
                onChange={() => setPeriodoVentas("mes")}
                style={{ marginRight: 8 }}
              />
              Por mes
            </label>

            {periodoVentas === "mes" && (
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  className="form-select"
                  value={anioVentas}
                  onChange={(e) => { setAnioVentas(e.target.value); setMesNumeroVentas(""); }}
                >
                  <option value="">Año</option>
                  {aniosDisponibles.map((anio) => (
                    <option key={anio} value={anio}>{anio}</option>
                  ))}
                </select>

                <select
                  className="form-select"
                  value={mesNumeroVentas}
                  onChange={(e) => setMesNumeroVentas(e.target.value)}
                  disabled={!anioVentas}
                >
                  <option value="">Mes</option>
                  {mesesDelAnio.map((mes) => (
                    <option key={mes} value={mes}>{NOMBRES_MES[Number(mes) - 1]}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setModalVentas(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-success"
                onClick={confirmarExcelVentas}
                disabled={periodoVentas === "mes" && (!anioVentas || !mesNumeroVentas)}
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
