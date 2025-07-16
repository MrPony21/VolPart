import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import "../styles/inventory.css";
import { importProduct } from '../api/api';

const CargarArchivo = () => {
    const [alertSuccess, setAlertSuccess] = useState("");
    const [alertError, setAlertError] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [fileToImport, setFileToImport] = useState(null);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== "application/json") {
            setAlertError("Por favor, seleccione un archivo JSON válido");
            return;
        }
        setFileToImport(file);
        setShowConfirm(true);
    };

    const handleConfirmImport = async () => {
        if (!fileToImport) return;
        try {
            const fileContent = await fileToImport.text();
            const productos = JSON.parse(fileContent);
            const response = await importProduct(productos)
            if (response.success) {
                setAlertSuccess("Productos importados correctamente");
                setAlertError("");
            } else {
                setAlertError("Error al importar los productos: " + response.mensaje);
                setAlertSuccess("");
            }
        } catch (error) {
            setAlertError("Error al procesar el archivo: " + error.message);
            setAlertSuccess("");
        }
        setShowConfirm(false);
        setFileToImport(null);
    };

    const handleCancelImport = () => {
        setShowConfirm(false);
        setFileToImport(null);
    };

    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ margin: "20px" }}>Importar Productos</h1>
            {alertSuccess && (
                <Alert variant="filled" severity="success" style={{ marginBottom: 20 }}>
                    {alertSuccess}
                </Alert>
            )}
            {alertError && (
                <Alert variant="filled" severity="error" style={{ marginBottom: 20 }}>
                    {alertError}
                </Alert>
            )}
            <div className="upload-container" style={{ textAlign: 'center' }}>
                <input
                    type="file"
                    accept=".json"
                    id="file-upload"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                />
                <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => document.getElementById('file-upload').click()}
                >
                    Seleccionar archivo JSON
                </button>
                <p style={{ marginTop: 10, color: '#666' }}>
                    Seleccione un archivo JSON con la lista de productos para importar
                </p>
            </div>
            {showConfirm && fileToImport && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: '#fff', padding: 30, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', minWidth: 320 }}>
                        <h3>¿Seguro que quieres importar este archivo?</h3>
                        <p>
                            Archivo seleccionado: <b>{fileToImport.name}</b>
                        </p>
                        <p>Esto sobrescribirá los datos actuales de productos.</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={handleCancelImport}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleConfirmImport}>Sí, importar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CargarArchivo;