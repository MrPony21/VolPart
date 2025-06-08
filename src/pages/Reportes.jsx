import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/Reportes.css"
import { exportarInventarioJSON } from '../api/api';
import Alert from '@mui/material/Alert';


const Reportes = () => {
    const[alertInventario, setAlertInventario] = useState("")


    const exportarInventarioFormatoCSV = async () => {

    }

    const exportarInventarioFormatoJSON = async () => {
        const response = await exportarInventarioJSON()
        if(response.success){
            setAlertInventario("Productos exportados correctamente")
        }else{
            alert("No se ha podido exportar los productos")
        }
    }


    return (
        <div style={{ padding: 20 }}>
             <h1 style={{ margin: "20px" }}>Reportes</h1>
            <div className='panel-buttoms'>
                {alertInventario && (
                    <Alert variant="filled" severity="success">
                        {alertInventario}
                    </Alert>
                )}
                <button type="button" class="btn btn-primary buttom-reporte" style={{ height: "100%" }} onClick={exportarInventarioFormatoCSV} >Exportar Inventario Excel</button>
                <button type="button" class="btn btn-primary buttom-reporte" style={{ height: "100%" }} onClick={exportarInventarioFormatoJSON} >Exportar Inventario JSON</button>
                <button type="button" class="btn btn-primary buttom-reporte" style={{ height: "100%" }} onClick="" >Exportar Ventas</button>
                <button type="button" class="btn btn-primary buttom-reporte" style={{ height: "100%" }} onClick="" >Exportar Clientes</button>
            </div>

        </div>
    )

     
}


export default Reportes;