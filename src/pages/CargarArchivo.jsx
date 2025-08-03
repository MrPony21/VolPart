import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import "../styles/inventory.css";
import {
  importProduct,
  importVentas,
  importClientes
} from '../api/api';

const CargarArchivo = () => {
  const [alertSuccess, setAlertSuccess] = useState("");
  const [alertError, setAlertError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [fileToImport, setFileToImport] = useState(null);
  const [typeToImport, setTypeToImport] = useState("");

  const handleFileUpload = (event, tipo) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== "application/json") {
      setAlertError("Por favor, seleccione un archivo JSON válido");
      return;
    }
    setTypeToImport(tipo);
    setFileToImport(file);
    setShowConfirm(true);
  };

  const handleConfirmImport = async () => {
    if (!fileToImport || !typeToImport) return;
    try {
      const text = await fileToImport.text();
      const array = JSON.parse(text);
      // Si el JSON está vacío, preguntar confirmación
      if (Array.isArray(array) && array.length === 0) {
        const confirmar = window.confirm(
          `El archivo de ${typeToImport} está vacío. Esto borrará los datos actuales. ¿Desea continuar?`
        );
        if (!confirmar) {
          // El usuario canceló
          setAlertError(`Importación de ${typeToImport} cancelada`);
          setShowConfirm(false);
          return;
        }
      }

      let response;
      switch (typeToImport) {
        case 'productos':
          response = await importProduct(array);
          break;
        case 'ventas':
          response = await importVentas(array);
          break;
        case 'clientes':
          response = await importClientes(array);
          break;
        default:
          throw new Error("Tipo de importación no reconocido");
      }

      if (response.success) {
        setAlertSuccess(
          `${typeToImport.charAt(0).toUpperCase() +
            typeToImport.slice(1)} importados correctamente`
        );
        setAlertError("");
      } else {
        setAlertError(
          `Error al importar ${typeToImport}: ${response.mensaje}`
        );
        setAlertSuccess("");
      }
    } catch (error) {
      setAlertError("Error al procesar el archivo: " + error.message);
      setAlertSuccess("");
    }
    setShowConfirm(false);
    setFileToImport(null);
    setTypeToImport("");
  };

  const handleCancelImport = () => {
    setShowConfirm(false);
    setFileToImport(null);
    setTypeToImport("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ margin: "20px" }}>Importar Datos</h1>

      {alertSuccess && (
        <Alert
          variant="filled"
          severity="success"
          style={{ marginBottom: 20 }}
        >
          {alertSuccess}
        </Alert>
      )}
      {alertError && (
        <Alert
          variant="filled"
          severity="error"
          style={{ marginBottom: 20 }}
        >
          {alertError}
        </Alert>
      )}

      <div
        className="upload-container"
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        {/* Productos */}
        <input
          type="file"
          accept=".json"
          id="upload-productos"
          style={{ display: 'none' }}
          onChange={e => handleFileUpload(e, 'productos')}
        />
        <p style={{ marginTop: 10, color: '#666' }}>
          Seleccione un archivo JSON con la lista de productos para importar
        </p>
        <button
          className="btn btn-primary"
          onClick={() => document.getElementById('upload-productos').click()}
        >
          Cargar Productos (JSON)
        </button>

        {/* Ventas */}
        <input
          type="file"
          accept=".json"
          id="upload-ventas"
          style={{ display: 'none' }}
          onChange={e => handleFileUpload(e, 'ventas')}
        />
        <p style={{ marginTop: 10, color: '#666' }}>
          Seleccione un archivo JSON con la lista de ventas para importar
        </p>
        <button
          className="btn btn-primary"
          style={{ marginLeft: 16 }}
          onClick={() => document.getElementById('upload-ventas').click()}
        >
          Cargar Ventas (JSON)
        </button>

        {/* Clientes */}
        <input
          type="file"
          accept=".json"
          id="upload-clientes"
          style={{ display: 'none' }}
          onChange={e => handleFileUpload(e, 'clientes')}
        />
        <p style={{ marginTop: 10, color: '#666' }}>
          Seleccione un archivo JSON con la lista de clientes para importar
        </p>
        <button
          className="btn btn-primary"
          style={{ marginLeft: 16 }}
          onClick={() => document.getElementById('upload-clientes').click()}
        >
          Cargar Clientes (JSON)
        </button>
      </div>

      {showConfirm && fileToImport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 30,
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              minWidth: 320
            }}
          >
            <h3>¿Seguro que quieres importar este archivo?</h3>
            <p>
              Tipo: <b>{typeToImport.toUpperCase()}</b>
            </p>
            <p>
              Archivo seleccionado: <b>{fileToImport.name}</b>
            </p>
            <p>
              Esto sobrescribirá los datos actuales de {typeToImport}.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={handleCancelImport}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleConfirmImport}>
                Sí, importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargarArchivo;
