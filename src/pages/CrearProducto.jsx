import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/CrearProducto.css"
import { callSelectImage, createProduct } from '../api/api';


const CrearProducto = () => {
    const location = useLocation()
    const navigate = useNavigate()

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

    const crear = async () => {


        const productoCasteado = {
            ...productoNuevo,
            cantidad: parseInt(productoNuevo.cantidad),
            precio: parseFloat(productoNuevo.precio)
        };

        console.log(productoCasteado)
        try{
            const productoCreado = await createProduct(productoCasteado)
            console.log("ProductoCreadoCorrectamente ", productoCreado)
        }catch(err){
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
                <div>
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
                )}

                <div className='button-success'>
                    <button className="btn btn-success " onClick={crear} >Crear</button>
                </div>
            </div>
        </div>


    )



}


export default CrearProducto