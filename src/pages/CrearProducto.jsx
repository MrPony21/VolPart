import React, { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/CrearProducto.css"
import { agregarInventarioProducto, callSelectImage, createProduct } from '../api/api';
import { BranchContext } from '../context/BranchContext';
import Alert from '@mui/material/Alert';

const CrearProducto = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [error, setError] = useState("")

    const codigo = location.state?.codigo
    const productoExistente = location.state?.productoExistente || false
    const productoDesdeModal = location.state?.producto
    const { selectedBranch } = useContext(BranchContext);

    const [productoNuevo, setProductoNuevo] = useState({
        codigoProducto: productoDesdeModal?.codigoProducto || "",
        upc: productoDesdeModal?.upc || codigo || "",
        nombreProducto: productoDesdeModal?.nombreProducto || "",
        marca: productoDesdeModal?.marca || "",
        existencia: "",
        precio: productoDesdeModal?.precio || "",
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

    const seleccionarImagen = async () => {
        const ruta = await callSelectImage()
        if (ruta) {
            setProductoNuevo(prev => ({ ...prev, imagen: ruta }))
        }
    }

    const validarCampos = (producto) => {
        if (!producto.upc || !producto.nombreProducto || !producto.marca || !producto.existencia || !producto.precio) {
            return "Todos los campos deben estar completos.";
        }

        if (isNaN(producto.existencia) || parseInt(producto.existencia) <= 0) {
            return "La cantidad debe ser un número entero mayor a cero.";
        }

        if (isNaN(producto.precio) || parseFloat(producto.precio) <= 0) {
            return "El precio debe ser un número mayor a cero.";
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
        let productoCasteado;
        
        if(productoExistente) {
            // Payload para registrar existencias en producto existente
            productoCasteado = {
                codigoProducto: parseInt(productoNuevo.codigoProducto),
                codigoInventario: branchId ? parseInt(branchId) : null,
                existencia: parseInt(productoNuevo.existencia),
                precio: parseFloat(productoNuevo.precio)
            };
        } else {
            // Payload para crear producto nuevo
            productoCasteado = {
                ...productoNuevo,
                existencia: parseInt(productoNuevo.existencia),
                precio: parseFloat(productoNuevo.precio),
                urlFoto: "",
                codigoInventario: branchId ? parseInt(branchId) : null,
                codigoProducto: productoNuevo.codigoProducto ? parseInt(productoNuevo.codigoProducto) : null
            };
        }

        console.log(productoCasteado)
        try{
            let productoCreado;
            if(productoExistente) {
                productoCreado = await agregarInventarioProducto(productoCasteado)
            } else {
                productoCreado = await createProduct(productoCasteado)
            }
            console.log("ProductoCreadoCorrectamente ", productoCreado)
            navigate('/ProductoDetalle', {state: { producto: productoCreado, productoCreado: true} })
        }catch(err){
            const mensajeLimpio = err.message?.split('Error: ').pop() || 'Error inesperado';
            setError(mensajeLimpio)
            console.error("Ocurrio un error al crear su producto", err) 
        }
 
    }



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
                <div>
                    <label>Cantidad:</label>
                    <input className='form-control mb-2' value={productoNuevo.existencia} name="existencia" onChange={onChangeInput}></input>
                </div>
                <div>
                    <label>Precio:</label>
                    <input className='form-control mb-2' value={productoNuevo.precio} name="precio" onChange={onChangeInput}></input>
                </div>
                {productoExistente && (
                    <div style={{ padding: "10px", backgroundColor: "#e3f2fd", borderRadius: "5px", marginTop: "10px" }}>
                        <p style={{ margin: 0, fontSize: "14px", color: "#1976d2" }}>
                            <strong>Nota:</strong> Registrando existencias para producto existente. Los campos de UPC, Nombre y Marca están bloqueados.
                        </p>
                    </div>
                )}
            </div>

            
            <div className="footer-div">
                {/* <div>
                    <p>Imagen</p>
                    <div onClick={seleccionarImagen} style={{ width: 200, height: 150, border: "1px solid #ccc", borderRadius: 10 }}></div>
                </div>
                {productoNuevo.imagen ? (
                    <img
                        src={`file://${__dirname}/${productoNuevo.imagen}`}
                        alt="Imagen del producto"
                        style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />

                ) : (
                    <></>
                )} */}
                <div></div>

                <div className='button-success'>
                    <button className="btn btn-success " onClick={crear} >Crear</button>
                </div>
            </div>
            
        </div>


    )



}


export default CrearProducto