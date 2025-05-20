import { Routes, Route } from "react-router-dom";
import Inventory from "../pages/Inventory";


const AppRouter = () =>{
    return(
        <Routes>
            <Route path="/" element={<Inventory/>}/>

        </Routes>
    )

}

export default AppRouter



