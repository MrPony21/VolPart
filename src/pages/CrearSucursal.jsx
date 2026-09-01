import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import { crearSucursal } from '../api/api';
import { BranchContext } from '../context/BranchContext';
import "../styles/CrearProducto.css";

const CrearSucursal = () => {
  const navigate = useNavigate();
  const { branches, refreshBranches } = useContext(BranchContext);

  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [creando, setCreando] = useState(false);

  const validar = () => {
    const limpio = nombre.trim();

    if (!limpio) return "El nombre de la sucursal es obligatorio.";
    if (limpio.length > 255) return "El nombre no puede pasar de 255 caracteres.";

    const repetida = (branches ?? []).some(
      (b) => b.nombreInventario?.toLowerCase() === limpio.toLowerCase()
    );
    if (repetida) return "Ya existe una sucursal con ese nombre.";

    return null;
  };

  const pedirConfirmacion = () => {
    setError("");
    setSuccess("");

    const mensajeValidacion = validar();
    if (mensajeValidacion) {
      setError(mensajeValidacion);
      return;
    }

    setMostrarConfirmacion(true);
  };

  const confirmarCreacion = async () => {
    setMostrarConfirmacion(false);

    try {
      setCreando(true);
      await crearSucursal(nombre.trim());

      // Para que la sucursal nueva aparezca en el selector sin recargar
      refreshBranches();

      setSuccess(`Sucursal "${nombre.trim()}" creada correctamente.`);
      setNombre("");

      setTimeout(() => navigate("/Inventory"), 2000);
    } catch (err) {
      console.error("Error al crear la sucursal:", err);
      setError(err.message || "No se pudo crear la sucursal.");
    } finally {
      setCreando(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div className="header-tab">
        <h2>Crear Sucursal</h2>
        <div className='button-regresar'>
          <button className="btn btn-primary regresar-buttom" onClick={() => navigate(-1)}>
            Regresar
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="filled" severity="error" style={{ marginBottom: 15 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="filled" severity="success" style={{ marginBottom: 15 }}>
          {success}
        </Alert>
      )}

      <div style={{ maxWidth: 600 }}>
        <h4 style={{ marginTop: 20, marginBottom: 15, borderBottom: "2px solid #f97316", paddingBottom: 10, color: "#333" }}>
          Datos de la Sucursal
        </h4>

        <div>
          <label>Nombre de la sucursal:</label>
          <input
            className='form-control mb-2'
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: APVOLKS ZONA 4"
            onKeyDown={(e) => e.key === "Enter" && pedirConfirmacion()}
          />
          <small className="text-muted">
            Este nombre es permanente: no se puede cambiar ni eliminar después.
          </small>
        </div>

        <div style={{ marginTop: 30, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button
            className="btn btn-warning"
            style={{ background: "#f97316", borderColor: "#f97316", color: "white" }}
            onClick={pedirConfirmacion}
            disabled={creando}
          >
            {creando ? "Creando..." : "Crear Sucursal"}
          </button>
        </div>
      </div>

      {mostrarConfirmacion && (
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
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)', maxWidth: 460
            }}
          >
            <h3>Confirmar creación</h3>

            <p style={{ marginTop: 15 }}>
              ¿Estás seguro de que quieres crear una nueva sucursal llamada{" "}
              <strong>"{nombre.trim()}"</strong>?
            </p>

            <div className="alert alert-warning" style={{ marginTop: 15, marginBottom: 0 }}>
              El nombre de la sucursal no podrá ser modificado, y la sucursal
              tampoco podrá ser eliminada.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setMostrarConfirmacion(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-warning"
                style={{ background: "#f97316", borderColor: "#f97316", color: "white" }}
                onClick={confirmarCreacion}
              >
                Sí, crear sucursal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrearSucursal;
