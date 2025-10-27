import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateProduct } from '../api/api';
import Alert from '@mui/material/Alert';
import { generatePdfWithBarcode } from '../tools/barcode';
import logo from "../assets/logo.jpg";
import "../styles/ProductoDetalle.css"

const ProductoDetalle = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const producto = location.state?.producto;

    if (!producto) {
        return <div>No se encontró el producto.</div>;
    }

    const [modoEdicion, setModoEdicion] = useState(false)
    const [datos, setDatos] = useState({ ...producto })
    const [oldDatos, setOldDatos] = useState({ ...producto })
    const [actualizadoAlert, setActualizadoAlert] = useState(false)
    //const [creadoAlert, setCreadoAlert] = useState(false)
    const [error, setError] = useState("");
    const [cantidadStickers, setCantidadStickers] = useState(1);


    const creadoAlert = location.state?.productoCreado || false;

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "cantidad") {
            if (/^\d*$/.test(value)) setDatos(prev => ({ ...prev, [name]: value }))
        } else if (name === "precio") {
            if (/^\d*\.?\d*$/.test(value)) setDatos(prev => ({ ...prev, [name]: value }))
        } else {
            setDatos(prev => ({ ...prev, [name]: value }))
        }
    }

    const validarCampos = (producto) => {
        if (!producto.nombre || !producto.marca || !producto.cantidad || !producto.precio) {
            return "Todos los campos deben estar completos.";
        }

        if (isNaN(producto.cantidad) || parseInt(producto.cantidad) <= 0) {
            return "La cantidad debe ser un número entero mayor a cero.";
        }

        if (isNaN(producto.precio) || parseFloat(producto.precio) <= 0) {
            return "El precio debe ser un número mayor a cero.";
        }

        return null;
    };


    const guardarCambios = async () => {
        console.log("Datos Actualizados", datos)

        const mensajeValidacion = validarCampos(datos);
        if (mensajeValidacion) {
            setError(mensajeValidacion);
            return;
        }

        const productoCasteado = {
            ...datos,
            cantidad: parseInt(datos.cantidad),
            precio: parseFloat(datos.precio)
        };


        try {
            const actualizado = await updateProduct(productoCasteado)
            console.log("Datos Actualizados", actualizado)
            setModoEdicion(false)
            setOldDatos(actualizado)
            setDatos(actualizado)
            setActualizadoAlert(true)
        } catch (err) {
            console.error("Error al actualizar", err)
            setError(err)
        }
    }

const generarCodigoBaras = () => {
  const qty = parseInt(cantidadStickers || "0", 10);
  if (!Number.isInteger(qty) || qty < 1) {
    setError("Ingresa una cantidad válida de stickers (entero ≥ 1).");
    return;
  }
  setError("");
  generatePdfWithBarcode(datos.codigo,datos.precio, logo, qty);
};

const handleCantidadStickersChange = (e) => {
  const v = e.target.value;
  if (/^\d*$/.test(v)) setCantidadStickers(v);
};

    return (
        <div style={{ padding: 20 }}>
            <h2 >Detalle del Producto</h2>
            {actualizadoAlert && (
                <Alert variant="filled" severity="success">
                    Se ha actualizado correctamente el producto.
                </Alert>
            )}
            {creadoAlert && (
                <Alert variant="filled" severity="success">
                    Se ha creado correctamente el producto.
                </Alert>
            )}
            {error && (
                <Alert variant="filled" severity="error">
                    {error}
                </Alert>
            )}


            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: "100%" }}>
                    <div>
                        <label>Código:</label>
                        <div className='code-campo'>
                            <input className="form-control mb-2 modoEdicionInput" value={datos.codigo} readOnly />

                            <div className="d-flex align-items-center gap-2 ml-2 mb-2">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d*"
                                    className="form-control"
                                    style={{ width: 100 }}
                                    placeholder="Cantidad"
                                    value={cantidadStickers}
                                    onChange={handleCantidadStickersChange}
                                    aria-label="Cantidad de stickers"
                                />
                                <button className='btn btn-primary' onClick={generarCodigoBaras}>
                                    Generar códigos
                                </button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label>Nombre:</label>
                        <input
                            className={`form-control mb-2" ${!modoEdicion ? "modoEdicionInput" : ""} `}
                            value={datos.nombre}
                            readOnly={!modoEdicion}
                            name="nombre"
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>Marca:</label>
                        <input
                            className={`form-control mb-2" ${!modoEdicion ? "modoEdicionInput" : ""} `}
                            value={datos.marca}
                            readOnly={!modoEdicion}
                            name="marca"
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>Cantidad:</label>
                        <input
                            className={`form-control mb-2" ${!modoEdicion ? "modoEdicionInput" : ""} `}
                            value={datos.cantidad}
                            readOnly={!modoEdicion}
                            name="cantidad"
                            onChange={handleChange}
                            pattern="^\d+$"
                        />
                    </div>
                    <div>
                        <label>Precio:</label>
                        <input
                            className={`form-control mb-2" ${!modoEdicion ? "modoEdicionInput" : ""} `}
                            value={datos.precio}
                            readOnly={!modoEdicion}
                            name="precio"
                            onChange={handleChange}
                            pattern="^\d+(\.\d+)?$"
                        />
                    </div>
                </div>
                {/* <div>
                    <p>Imagen</p>
                    <div style={{ width: 400, height: 250, border: "1px solid #ccc", borderRadius: 10 }}></div>
                </div> */}
            </div>
            <div style={{ marginTop: 20 }}>
                {modoEdicion ? (
                    <div className='tab-edicion'>
                        <button className="btn btn-success" onClick={guardarCambios} >Guardar Cambios</button>
                        <button className="btn btn-secondary" onClick={() => {
                            setModoEdicion(false)
                            setActualizadoAlert(false)
                            setDatos(oldDatos)
                        }}
                        >No guardar</button>
                    </div>
                ) : (
                    <div className='tab-button'>
                        <div className="button-edit-delete">
                            <button className="btn btn-warning me-2" onClick={() => setModoEdicion(true)}
                            >Editar</button>

                        </div>
                        <button className="btn btn-primary regresar-buttom" onClick={() => { creadoAlert ? navigate("/") : navigate(-1) }} >Regresar</button>
                    </div>
                )}

            </div>

        </div>
    );
};

export default ProductoDetalle;
