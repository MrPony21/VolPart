import { Routes, Route } from "react-router-dom";
import Inventory from "../pages/Inventory";
import ProductoDetalle from "../pages/ProductoDetalle";
import CrearProducto from "../pages/CrearProducto";
import Reportes from "../pages/Reportes";

const AppRouter = () =>{
    return(
        <Routes>
            <Route path="/" element={<Inventory/>}/>
            <Route path="/ProductoDetalle" element={<ProductoDetalle/>}/>
            <Route path="/CrearProducto" element={<CrearProducto/>}></Route>
            <Route path="/Reportes" element={<Reportes/>}></Route>
        </Routes>
    )

}

export default AppRouter



