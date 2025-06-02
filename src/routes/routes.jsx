import { Routes, Route } from "react-router-dom";
import Inventory from "../pages/Inventory";
import ProductoDetalle from "../pages/ProductoDetalle";


const AppRouter = () =>{
    return(
        <Routes>
            <Route path="/" element={<Inventory/>}/>
            <Route path="/ProductoDetalle" element={<ProductoDetalle/>}/>
        </Routes>
    )

}

export default AppRouter



