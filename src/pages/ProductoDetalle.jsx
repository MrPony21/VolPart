import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateProduct, getProductIndividual, getProductoByCodigoProductoInventario } from '../api/api';
import Alert from '@mui/material/Alert';
import { generatePdfWithBarcode } from '../tools/barcode';
import logo from "../assets/logonuevo.jpg";
import { BranchContext } from '../context/BranchContext';
import "../styles/ProductoDetalle.css"

const ProductoDetalle = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedBranch } = useContext(BranchContext);

    const searchParams = new URLSearchParams(location.search);
    const codigoProductoFromUrl = searchParams.get('codigoProducto');
    const creadoAlert = searchParams.get('productoCreado') === 'true' || false;

    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modoEdicion, setModoEdicion] = useState(false)
    const [datos, setDatos] = useState(null)
    const [oldDatos, setOldDatos] = useState(null)
    const [actualizadoAlert, setActualizadoAlert] = useState(false)
    const [error, setError] = useState("");
    const [cantidadStickers, setCantidadStickers] = useState(1);
    const [imagenFile, setImagenFile] = useState(null);
    const [imagenPreview, setImagenPreview] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const CAMPOS_PRODUCTO = ["nombreproducto", "marca", "upc", "urlfoto"];
    // Campos que pertenecen al inventario  
    const CAMPOS_INVENTARIO = ["existencia", "precio", "preciocompra"];

    // Obtener datos del producto desde el endpoint
    useEffect(() => {
        if (!selectedBranch || !codigoProductoFromUrl) return

        const obtenerProducto = async () => {
            try {
                setLoading(true);
                console.log("Código desde URL:", codigoProductoFromUrl)

                const codigoInventario = selectedBranch?.codigoInventario;
                console.log("Codigo Producto:", codigoProductoFromUrl, "Codigo Inventario:", codigoInventario)

                const productoData = await getProductoByCodigoProductoInventario(codigoProductoFromUrl, codigoInventario );
                console.log("hola",productoData)
                
                if (productoData) {
                    setProducto(productoData);
                    setDatos(productoData);
                    setOldDatos(productoData);
                    setError("")
                } else {
                    setError("No se pudo obtener los datos del producto.");
                }
            } catch (err) {
                console.error("Error al obtener producto:", err);
                setError("Error al cargar los datos del producto.");
            } finally {
                setLoading(false);
            }
        };

        obtenerProducto();
    }, [codigoProductoFromUrl, selectedBranch]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "existencia") {
            if (/^\d*$/.test(value)) setDatos(prev => ({ ...prev, [name]: value }))
        } else if (name === "precio" || name === "preciocompra") {
            if (/^\d*\.?\d*$/.test(value)) setDatos(prev => ({ ...prev, [name]: value }))
        } else {
            setDatos(prev => ({ ...prev, [name]: value }))
        }
    }

    const validarCampos = (producto) => {
        console.log("Validando campos:", producto)
        if (!producto.nombreproducto || !producto.marca || producto.existencia === "" || producto.existencia === null || producto.existencia === undefined || !producto.precio) {
            return "Todos los campos deben estar completos.";
        }

        if (isNaN(producto.existencia) || parseInt(producto.existencia) < 0) {
            return "La cantidad debe ser un número entero mayor o igual a cero.";
        }

        if (isNaN(producto.precio) || parseFloat(producto.precio) <= 0) {
            return "El precio debe ser un número mayor a cero.";
        }

        if (producto.preciocompra === "" || producto.preciocompra === null || producto.preciocompra === undefined) {
            return "Todos los campos deben estar completos.";
        }

        if (isNaN(producto.preciocompra) || parseFloat(producto.preciocompra) < 0) {
            return "El precio de compra debe ser un número mayor o igual a cero.";
        }

        return null;
    };



    // Margen de ganancia por unidad: precio de venta menos precio de compra
    const calcularMargen = (precio, precioCompra) => {
        const venta = parseFloat(precio);
        const compra = parseFloat(precioCompra);
        if (isNaN(venta) || isNaN(compra)) return "";
        return (venta - compra).toFixed(2);
    };

    const guardarCambios = async () => {
        const mensajeValidacion = validarCampos(datos);
        if (mensajeValidacion) {
            setError(mensajeValidacion);
            return;
        }

        if (!selectedBranch?.codigoInventario) {
            setError("No hay una sucursal seleccionada.");
            return;
        }

        // Detectar qué cambió
        const cambioProducto = CAMPOS_PRODUCTO.some(campo => datos[campo] !== oldDatos[campo]);
        const cambioInventario = CAMPOS_INVENTARIO.some(campo => datos[campo] !== oldDatos[campo]);

        if (!cambioProducto && !cambioInventario && !imagenFile) {
            setModoEdicion(false);
            return;
        }

        setGuardando(true);

        // Construir payload según lo que cambió
        const payload = {};

        if (cambioProducto) {
            payload.nombreProducto = datos.nombreproducto;
            payload.marca = datos.marca;
            payload.upc = datos.upc;
            // payload.urlFoto = datos.urlfoto;
        }

        if (cambioInventario) {
            payload.codigoInventario = selectedBranch?.codigoInventario;
            payload.existencia = parseInt(datos.existencia);
            payload.precio = parseFloat(datos.precio);
            payload.precioCompra = parseFloat(datos.preciocompra);
        }

        try {
            let actualizado;

            if (cambioProducto || cambioInventario) {
                actualizado = await updateProduct(datos.codigoproducto, payload);
            }

            if (imagenFile) {
                const formData = new FormData();
                formData.append('file', imagenFile);
                actualizado = await updateProduct(datos.codigoproducto, formData);
            }

            const urlfoto = actualizado?.urlfoto || (imagenFile ? imagenPreview : datos.urlfoto);
            const datosFinales = { ...datos, ...actualizado, urlfoto };

            setModoEdicion(false);
            setOldDatos(datosFinales);
            setDatos(datosFinales);
            setImagenFile(null);
            setImagenPreview(null);
            setActualizadoAlert(true);
            setError("");
        } catch (err) {
            console.error("Error al actualizar", err);
            setError("Error al actualizar el producto.");
        } finally {
            setGuardando(false);
        }
    };

    const generarCodigoBaras = () => {
    const qty = parseInt(cantidadStickers || "0", 10);
    if (!Number.isInteger(qty) || qty < 1) {
        setError("Ingresa una cantidad válida de stickers (entero ≥ 1).");
        return;
    }
    setError("");
    generatePdfWithBarcode(datos.upc,datos.precio, logo, qty);
    };

    const handleCantidadStickersChange = (e) => {
        const v = e.target.value;
        if (/^\d*$/.test(v)) setCantidadStickers(v);
    };

    const onChangeImagen = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImagenFile(file);
        setImagenPreview(URL.createObjectURL(file));
    };

    return (
        <div style={{ padding: 20 }}>
            
            {loading && (
                <Alert variant="filled" severity="info">
                    Cargando datos del producto...
                </Alert>
            )}
            
            {!loading && !producto && (
                <Alert variant="filled" severity="error">
                    No se encontró el producto.
                </Alert>
            )}
            
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
            {!loading && error && (
                <Alert variant="filled" severity="error">
                    {error}
                </Alert>
            )}

            {!loading && producto && datos && (
                <>
                    <div>
                <div style={{ width: "100%" }}>
                    
                    {/* Información del Producto */}
                    <h4 style={{ marginTop: 20, marginBottom: 15, borderBottom: "2px solid #007bff", paddingBottom: 10, color: "#333" }}>
                        Información del Producto
                    </h4>
                    
                    <div>
                        <label>Código:</label>
                        <div className='code-campo'>
                            <input className="form-control mb-2 modoEdicionInput" value={datos.codigoproducto} readOnly />

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
                        <label>UPC:</label>
                        <input 
                            className={`form-control mb-2 ${!modoEdicion ? "modoEdicionInput" : ""}`} 
                            value={datos.upc} 
                            readOnly={!modoEdicion}
                            name="upc"
                            onChange={handleChange} 
                        />
            
                    </div>
                    <div>
                        <label>Nombre:</label>
                        <input
                            className={`form-control mb-2 ${!modoEdicion ? "modoEdicionInput" : ""}`}
                            value={datos.nombreproducto}
                            readOnly={!modoEdicion}
                            name="nombreproducto"
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label>Marca:</label>
                        <input
                            className={`form-control mb-2 ${!modoEdicion ? "modoEdicionInput" : ""}`}
                            value={datos.marca}
                            readOnly={!modoEdicion}
                            name="marca"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Información del Inventario */}
                    <h4 style={{ marginTop: 25, marginBottom: 15, borderBottom: "2px solid #28a745", paddingBottom: 10, color: "#333" }}>
                        Información del Inventario
                    </h4>

                    <div>
                        <label>Existencia:</label>
                        <input
                            className={`form-control mb-2 ${!modoEdicion ? "modoEdicionInput" : ""}`}
                            value={datos.existencia}
                            readOnly={!modoEdicion}
                            name="existencia"
                            onChange={handleChange}
                            pattern="^\d+$"
                        />
                    </div>
                    <div>
                        <label>Precio:</label>
                        <input
                            className={`form-control mb-2 ${!modoEdicion ? "modoEdicionInput" : ""}`}
                            value={datos.precio}
                            readOnly={!modoEdicion}
                            name="precio"
                            onChange={handleChange}
                            pattern="^\d+(\.\d+)?$"
                        />
                    </div>
                    <div>
                        <label>Precio de compra:</label>
                        <input
                            className={`form-control mb-2 ${!modoEdicion ? "modoEdicionInput" : ""}`}
                            value={datos.preciocompra ?? ""}
                            readOnly={!modoEdicion}
                            name="preciocompra"
                            onChange={handleChange}
                            pattern="^\d+(\.\d+)?$"
                        />
                    </div>
                    <div>
                        <label>Margen:</label>
                        <input
                            className="form-control mb-2 modoEdicionInput"
                            value={calcularMargen(datos.precio, datos.preciocompra)}
                            readOnly
                        />
                    </div>
                </div>
            </div>
            {(datos.urlfoto || modoEdicion) && (
                <div className="producto-imagen-container">
                    <h4 className="producto-imagen-titulo">Imagen del Producto</h4>
                    {modoEdicion && (
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onChangeImagen}
                            className="form-control mb-3"
                        />
                    )}
                    {(imagenPreview || datos.urlfoto) ? (
                        <img
                            src={imagenPreview || datos.urlfoto}
                            alt={datos.nombreproducto}
                            className="producto-imagen"
                        />
                    ) : (
                        modoEdicion && <p style={{ color: "#999", margin: 0 }}>Sin imagen — selecciona un archivo para agregar una.</p>
                    )}
                </div>
            )}

            <div style={{ marginTop: 20 }}>
                {modoEdicion ? (
                    <div className='tab-edicion'>
                        <button className="btn btn-success" onClick={guardarCambios} disabled={guardando}>
                            {guardando ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Guardando...
                                </>
                            ) : "Guardar Cambios"}
                        </button>
                        <button className="btn btn-secondary" onClick={() => {
                            setModoEdicion(false)
                            setActualizadoAlert(false)
                            setDatos(oldDatos)
                            setImagenFile(null)
                            setImagenPreview(null)
                        }}
                        >No guardar</button>
                    </div>
                ) : (
                    <div className='tab-button'>
                        <div className="button-edit-delete">
                            <button className="btn btn-warning me-2" onClick={() => setModoEdicion(true)}
                            >Editar</button>

                        </div>
                        <button className="btn btn-primary regresar-buttom" onClick={() => { creadoAlert ? navigate("/inventory") : navigate(-1) }} >Regresar</button>
                    </div>
                )}

            </div>
                </>
            )}
        </div>
    );
};

export default ProductoDetalle;
