import React, { useState, useContext } from 'react';
import Alert from '@mui/material/Alert';
import "../styles/inventory.css";
import {
  importProduct,
  importVentas,
  importClientes
} from '../api/api';
import { BranchContext } from '../context/BranchContext';

const CargarArchivo = () => {
  const { branches } = useContext(BranchContext);
  const [alertSuccess, setAlertSuccess] = useState("");
  const [alertError, setAlertError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [fileToImport, setFileToImport] = useState(null);
  const [typeToImport, setTypeToImport] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [showBranchSelection, setShowBranchSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event, tipo) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== "application/json") {
      setAlertError("Por favor, seleccione un archivo JSON válido");
      return;
    }
    setTypeToImport(tipo);
    setFileToImport(file);
    
    // Para productos, mostrar selector de sucursal primero
    if (tipo === 'productos') {
      setShowBranchSelection(true);
    } else {
      setShowConfirm(true);
    }
  };

  const transformProductData = (productos, branchId) => {
    return productos.map(product => ({
      nombreProducto: product.nombre || '',
      upc: product.codigo || '',
      marca: product.marca || '',
      urlFoto: product.imagen || '',
      codigoInventario: parseInt(branchId),
      existencia: parseInt(product.cantidad) || 0,
      precio: parseFloat(product.precio) || 0
    }));
  };

  const handleBranchSelection = (branchId) => {
    setSelectedBranch(branchId);
    setShowBranchSelection(false);
    setShowConfirm(true);
  };

  const handleConfirmImport = async () => {
    if (!fileToImport || !typeToImport) return;
    setIsLoading(true);
    try {
      const text = await fileToImport.text();
      let array = JSON.parse(text);
      
      // Si es importación de productos, transformar los datos
      if (typeToImport === 'productos') {
        if (!selectedBranch) {
          setAlertError("Debe seleccionar una sucursal para importar productos");
          setIsLoading(false);
          return;
        }
        array = transformProductData(array, selectedBranch);
      }
      
      // Si el JSON está vacío, preguntar confirmación
      if (Array.isArray(array) && array.length === 0) {
        const confirmar = window.confirm(
          `El archivo de ${typeToImport} está vacío. Esto borrará los datos actuales. ¿Desea continuar?`
        );
        if (!confirmar) {
          // El usuario canceló
          setAlertError(`Importación de ${typeToImport} cancelada`);
          setShowConfirm(false);
          setIsLoading(false);
          return;
        }
      }

      let response;
      switch (typeToImport) {
        case 'productos':
          response = await importProduct(array, selectedBranch);
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

      console.log("Respuesta de importación:", response);
      // Validar la respuesta correctamente
      if (response) {
        setAlertSuccess(
          `${typeToImport.charAt(0).toUpperCase() +
            typeToImport.slice(1)} importados correctamente (${array.length} registros)`
        );
        setAlertError("");
      } else {
        setAlertError(
          `Error al importar ${typeToImport}: ${response?.mensaje || 'Error desconocido'}`
        );
        setAlertSuccess("");
      }
    } catch (error) {
      setAlertError("Error al procesar el archivo: " + error.message);
      setAlertSuccess("");
    } finally {
      setIsLoading(false);
    }
    setShowConfirm(false);
    setFileToImport(null);
    setTypeToImport("");
    setSelectedBranch("");
  };

  const handleCancelImport = () => {
    setShowConfirm(false);
    setShowBranchSelection(false);
    setFileToImport(null);
    setTypeToImport("");
    setSelectedBranch("");
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

      {showBranchSelection && fileToImport && (
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
            <h3>Seleccionar Sucursal</h3>
            <p>
              Archivo seleccionado: <b>{fileToImport.name}</b>
            </p>
            <p style={{ marginBottom: 15, marginTop: 15 }}>
              ¿En cuál sucursal será ingresado el inventario?
            </p>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                marginBottom: 20,
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 14
              }}
            >
              <option value="">-- Seleccionar sucursal --</option>
              {branches.map((branch) => (
                <option key={branch.codigoInventario} value={branch.codigoInventario}>
                  {branch.nombreInventario}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={handleCancelImport}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleBranchSelection(selectedBranch)}
                disabled={!selectedBranch}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

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
            {typeToImport === 'productos' && (
              <p>
                Sucursal: <b>{branches.find(b => b.codigoInventario === parseInt(selectedBranch))?.nombreInventario}</b>
              </p>
            )}
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

      {isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 40,
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}
            />
            <p style={{ fontSize: 16, color: '#333', margin: 0 }}>
              Importando {typeToImport}...
            </p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargarArchivo;
