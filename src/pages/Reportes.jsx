import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/Reportes.css"
import { exportarInventarioJSON, exportarExcel, exportarVentasJSON, exportarClientesJSON } from '../api/api';
import Alert from '@mui/material/Alert';


const Reportes = () => {
    const [alertExcel, setAlertExcel] = useState("")
    const [alertErrorExcel, setAlertErrorExcel] = useState("")
    const [alertJson, setAlertJson] = useState("")
    const [alertErrorJson, setErrorJson] = useState("")

    const [alertVentas, setAlertVentas] = useState("");
    const [alertErrorVentas, setErrorVentas] = useState("");
    const [alertClientes, setAlertClientes] = useState("");
    const [alertErrorClientes, setErrorClientes] = useState("");



    const exportarInventarioFormatoCSV = async () => {
        const response = await exportarExcel()
        if (response.success) {
            setAlertExcel(`Excel exportado correctamente a:\n${response.ruta}`);
        } else {
            setAlertErrorExcel(response.mensaje);
        }
    }

    const exportarInventarioFormatoJSON = async () => {
        const response = await exportarInventarioJSON()
        if (response.success) {
            setAlertJson("Productos exportados correctamente")
        } else {
            setErrorJson("No se ha podido exportar los productos")
        }
    }

    const exportarVentasFormatoJSON = async () => {
        const res = await exportarVentasJSON();
        if (res.success) setAlertVentas(`Ventas exportadas en: ${res.ruta}`);
        else setErrorVentas(res.mensaje);
    };

    const exportarClientesFormatoJSON = async () => {
        const res = await exportarClientesJSON();
        if (res.success) setAlertClientes(`Clientes exportados en: ${res.ruta}`);
        else setErrorClientes(res.mensaje);
    };



    return (
        <div style={{ padding: 20 }}>
            <h1 style={{ margin: "20px" }}>Reportes</h1>

            <div className='panel-buttoms'>
                <h3>EXCEL</h3>
                {alertExcel && (
                    <Alert variant="filled" severity="success">
                        {alertExcel}
                    </Alert>
                )}
                {alertErrorExcel && (
                    <Alert variant="filled" severity="error">
                        {alertErrorExcel}
                    </Alert>
                )}


                <button type="button" class="btn btn-primary buttom-reporte" style={{ height: "100%" }} onClick={exportarInventarioFormatoCSV} >Exportar Inventario Excel</button>
                <button type="button" class="btn btn-primary buttom-reporte" style={{ height: "100%" }} onClick="" >Exportar Ventas</button>
                <button type="button" class="btn btn-primary buttom-reporte" style={{ height: "100%" }} onClick="" >Exportar Clientes</button>
            </div>


            <div className='panel-buttoms' style={{ marginTop: "40px" }}>
                <h3>JSON</h3>
                {alertJson && (
                    <Alert variant="filled" severity="success">
                        {alertJson}
                    </Alert>
                )}
                {alertErrorJson && (
                    <Alert variant="filled" severity="error">
                        {alertErrorJson}
                    </Alert>
                )}

                {alertVentas && <Alert severity="success">{alertVentas}</Alert>}
                {alertErrorVentas && <Alert severity="error">{alertErrorVentas}</Alert>}

                {alertClientes && <Alert severity="success">{alertClientes}</Alert>}
                {alertErrorClientes && <Alert severity="error">{alertErrorClientes}</Alert>}

                <button type="button" class="btn btn-primary buttom-reporte" style={{ height: "100%" }} onClick={exportarInventarioFormatoJSON} >Exportar Inventario JSON</button>
                <button type="button" class="btn btn-primary buttom-reporte" style={{ height: "100%" }} onClick={exportarVentasFormatoJSON} >Exportar Ventas</button>
                <button type="button" class="btn btn-primary buttom-reporte" style={{ height: "100%" }}  onClick={exportarClientesFormatoJSON} >Exportar Clientes</button>
            </div>

        </div>
    )


}


export default Reportes;