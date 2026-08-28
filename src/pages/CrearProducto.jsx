import React, { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/CrearProducto.css"
import "../styles/ProductoDetalle.css"
import { agregarInventarioProducto, callSelectImage, createProduct } from '../api/api';
import { BranchContext } from '../context/BranchContext';
import Alert from '@mui/material/Alert';

const CrearProducto = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [error, setError] = useState("")
    const [creando, setCreando] = useState(false)

    const codigo = location.state?.codigo
    const productoExistente = location.state?.productoExistente || false
    const productoDesdeModal = location.state?.producto
    const { selectedBranch } = useContext(BranchContext);
    const [imagenFile, setImagenFile] = useState(null);
    const [imagenPreview, setImagenPreview] = useState(null);

    const [productoNuevo, setProductoNuevo] = useState({
        codigoProducto: productoDesdeModal?.codigoProducto || "",
        upc: productoDesdeModal?.upc || codigo || "",
        nombreProducto: productoDesdeModal?.nombreProducto || "",
        marca: productoDesdeModal?.marca || "",
        existencia: "",
        precio: productoDesdeModal?.precio || "",
        precioCompra: "",
        imagen: ""
    })

    const onChangeInput = (e) => {
        const { name, value } = e.target
        // Si es producto existente, solo permite cambiar existencia y precio
        if(productoExistente && ['upc', 'nombreProducto', 'marca'].includes(name)) {
            return
        }
        setProductoNuevo(prev => ({ ...prev, [name]: value }))

    }

    const onChangeImagen = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImagenFile(file); // el File real para enviar a la API
        setImagenPreview(URL.createObjectURL(file)); // preview local sin subir nada
    };

    const seleccionarImagen = async () => {
        const ruta = await callSelectImage()
        if (ruta) {
            setProductoNuevo(prev => ({ ...prev, imagen: ruta }))
        }
    }

    const validarCampos = (producto) => {
        if (!producto.upc || !producto.nombreProducto || !producto.marca || !producto.existencia || !producto.precio || producto.precioCompra === "") {
            return "Todos los campos deben estar completos.";
        }

        if (isNaN(producto.existencia) || parseInt(producto.existencia) <= 0) {
            return "La cantidad debe ser un número entero mayor a cero.";
        }

        if (isNaN(producto.precio) || parseFloat(producto.precio) <= 0) {
            return "El precio debe ser un número mayor a cero.";
        }

        if (isNaN(producto.precioCompra) || parseFloat(producto.precioCompra) < 0) {
            return "El precio de compra debe ser un número mayor o igual a cero.";
        }

        return null; // todo está bien
    };



    const crear = async () => {
        const mensajeValidacion = validarCampos(productoNuevo);
        if (mensajeValidacion) {
            setError(mensajeValidacion);
            return;
        }

        const branchId = selectedBranch?.codigoInventario;
        setCreando(true);

        try {
            let productoCreado;

            if (productoExistente) {
                const payload = {
                    codigoProducto: parseInt(productoNuevo.codigoProducto),
                    codigoInventario: branchId ? parseInt(branchId) : null,
                    existencia: parseInt(productoNuevo.existencia),
                    precio: parseFloat(productoNuevo.precio),
                    precioCompra: parseFloat(productoNuevo.precioCompra)
                };
                productoCreado = await agregarInventarioProducto(payload);
            } else {
                // Usar FormData para enviar datos + imagen juntos
                const formData = new FormData();
                formData.append('upc', productoNuevo.upc);
                formData.append('nombreProducto', productoNuevo.nombreProducto);
                formData.append('marca', productoNuevo.marca);
                formData.append('existencia', parseInt(productoNuevo.existencia));
                formData.append('precio', parseFloat(productoNuevo.precio));
                formData.append('precioCompra', parseFloat(productoNuevo.precioCompra));
                formData.append('codigoInventario', branchId ? parseInt(branchId) : '');

                if (imagenFile) {
                    formData.append('file', imagenFile); // 'file' debe coincidir con FileInterceptor en NestJS
                }

                productoCreado = await createProduct(formData); // envías FormData en vez de objeto
            }

            navigate(`/ProductoDetalle?codigoProducto=${productoCreado.codigoProducto}&productoCreado=true`);
        } catch (err) {
            const mensajeLimpio = err.message?.split('Error: ').pop() || 'Error inesperado';
            setError(mensajeLimpio);
            console.error("Ocurrio un error al crear su producto", err);
            setCreando(false);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <div className="header-tab">
                <h2>Crear Producto</h2>
                <div className='button-regresar'>
                    <button className="btn btn-primary regresar-buttom" onClick={() => navigate(-1)} >Regresar</button>
                </div>
            </div>
            {error && (
                <Alert variant="filled" severity="error">
                    {error}
                </Alert>
            )}
            <div>

                {productoExistente && (
                    <div style={{ padding: "10px", backgroundColor: "#e3f2fd", borderRadius: "5px", marginTop: "10px" }}>
                        <p style={{ margin: 0, fontSize: "14px", color: "#1976d2" }}>
                            <strong>Nota:</strong> Registrando existencias para producto existente. Los campos de UPC, Nombre y Marca están bloqueados.
                        </p>
                    </div>
                )}

                {/* Información del Producto */}
                <h4 style={{ marginTop: 20, marginBottom: 15, borderBottom: "2px solid #007bff", paddingBottom: 10, color: "#333" }}>
                    Información del Producto
                </h4>

                {productoExistente && (
                    <div>
                        <label>Código Producto:</label>
                        <input className='form-control mb-2' value={productoNuevo.codigoProducto} disabled></input>
                    </div>
                )}

                <div>
                    <label>UPC:</label>
                    <input className='form-control mb-2' value={productoNuevo.upc} name="upc" onChange={onChangeInput} disabled={productoExistente}></input>
                </div>
                <div>
                    <label>Nombre:</label>
                    <input className='form-control mb-2' value={productoNuevo.nombreProducto} name="nombreProducto" onChange={onChangeInput} disabled={productoExistente}></input>
                </div>
                <div>
                    <label>Marca:</label>
                    <input className='form-control mb-2' value={productoNuevo.marca} name="marca" onChange={onChangeInput} disabled={productoExistente}></input>
                </div>

                {/* Información del Inventario */}
                <h4 style={{ marginTop: 25, marginBottom: 15, borderBottom: "2px solid #28a745", paddingBottom: 10, color: "#333" }}>
                    Información del Inventario
                </h4>

                <div>
                    <label>Cantidad:</label>
                    <input className='form-control mb-2' value={productoNuevo.existencia} name="existencia" onChange={onChangeInput}></input>
                </div>
                <div>
                    <label>Precio:</label>
                    <input className='form-control mb-2' value={productoNuevo.precio} name="precio" onChange={onChangeInput}></input>
                </div>
                <div>
                    <label>Precio de compra:</label>
                    <input className='form-control mb-2' value={productoNuevo.precioCompra} name="precioCompra" onChange={onChangeInput}></input>
                </div>
            </div>

            
            <div className="producto-imagen-container">
                <h4 className="producto-imagen-titulo">Imagen del Producto (opcional)</h4>
                <input
                    type="file"
                    accept="image/*"
                    onChange={onChangeImagen}
                    className="form-control mb-3"
                />
                {imagenPreview ? (
                    <img
                        src={imagenPreview}
                        alt="Preview"
                        className="producto-imagen"
                    />
                ) : (
                    <p style={{ color: "#999", margin: 0 }}>Sin imagen — selecciona un archivo para agregar una.</p>
                )}
            </div>

            <div className="footer-div">
                <div className='button-success'>
                    <button className="btn btn-success" onClick={crear} disabled={creando}>
                        {creando ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Creando...
                            </>
                        ) : "Crear"}
                    </button>
                </div>
            </div>
            
        </div>


    )



}


export default CrearProducto