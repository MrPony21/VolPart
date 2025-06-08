import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/CrearProducto.css"
import { callSelectImage, createProduct } from '../api/api';
import Alert from '@mui/material/Alert';

const CrearProducto = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [error, setError] = useState("")

    const codigo = location.state?.codigo

    const [productoNuevo, setProductoNuevo] = useState({
        codigo: codigo,
        nombre: "",
        marca: "",
        cantidad: "",
        precio: "",
        imagen: ""
    })

    const onChangeInput = (e) => {
        const { name, value } = e.target
        setProductoNuevo(prev => ({ ...prev, [name]: value }))

    }

    const seleccionarImagen = async () => {
        const ruta = await callSelectImage()
        if (ruta) {
            setProductoNuevo(prev => ({ ...prev, imagen: ruta }))
        }
    }

    const validarCampos = (producto) => {
        if (!producto.codigo || !producto.nombre || !producto.marca || !producto.cantidad || !producto.precio) {
            return "Todos los campos deben estar completos.";
        }

        if (isNaN(producto.cantidad) || parseInt(producto.cantidad) <= 0) {
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

        const productoCasteado = {
            ...productoNuevo,
            cantidad: parseInt(productoNuevo.cantidad),
            precio: parseFloat(productoNuevo.precio)
        };

        console.log(productoCasteado)
        try{
            const productoCreado = await createProduct(productoCasteado)
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
                    <button className="btn btn-primary regresar-buttom" onClick={() => navigate("/")} >Regresar</button>
                </div>
            </div>
            {error && (
                <Alert variant="filled" severity="error">
                    {error}
                </Alert>
            )}
            <div>
                <div>
                    <label>Codigó:</label>
                    <input className='form-control mb-2' value={productoNuevo.codigo} name="codigo" onChange={onChangeInput}></input>
                </div>
                <div>
                    <label>Nombre:</label>
                    <input className='form-control mb-2' value={productoNuevo.nombre} name="nombre" onChange={onChangeInput}></input>
                </div>
                <div>
                    <label>Marca:</label>
                    <input className='form-control mb-2' value={productoNuevo.marca} name="marca" onChange={onChangeInput}></input>
                </div>
                <div>
                    <label>Cantidad:</label>
                    <input className='form-control mb-2' value={productoNuevo.cantidad} name="cantidad" onChange={onChangeInput}></input>
                </div>
                <div>
                    <label>Precio:</label>
                    <input className='form-control mb-2' value={productoNuevo.precio} name="precio" onChange={onChangeInput}></input>
                </div>
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