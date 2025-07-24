import { Routes, Route, Navigate } from "react-router-dom"; 
import Inventory from "../pages/Inventory";
import ProductoDetalle from "../pages/ProductoDetalle";
import CrearProducto from "../pages/CrearProducto";
import Reportes from "../pages/Reportes";
import CargarArchivo from "../pages/CargarArchivo";
import Ventas from "../pages/Ventas";
import Clientes from "../pages/Clientes"

const AppRouter = () =>{
    return(
        <Routes>
            <Route path="/" element={<Inventory/>}/>
            <Route path="/ProductoDetalle" element={<ProductoDetalle/>}/>
            <Route path="/CrearProducto" element={<CrearProducto/>}></Route>
            <Route path="/Ventas" element={<Ventas/>}></Route>
            <Route path="/Clientes" element={<Clientes/>}></Route>
            <Route path="/Reportes" element={<Reportes/>}></Route>
            <Route path="/CargarArchivo" element={<CargarArchivo/>}></Route>/
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    )

}

export default AppRouter



