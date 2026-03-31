import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getProductsByInventory } from '../api/api';
import { BranchContext } from '../context/BranchContext';
import Pagination from '../components/Pagination';
import ScannerInput from '../tools/ScannerInput';
import CrearProductoModal from '../components/CrearProductoModal';
import ProductoNoEncontrado from '../components/ProductoNoEncontrado';
import "../styles/inventory.css"


const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [inputValue, setInputValue] = useState("")
  const [productoFiltrado, setProductoFiltrado] = useState(null)

  const [modalShow, setModalShow] = useState(false);
  const [modalProductoNoEncontrado, setModalProductoNoEncontrado] = useState(false)
  const [filterField, setFilterField] = useState("codigo")
  const [codigoToModal, setCodigoToModal] = useState("")

  const navigate = useNavigate()
  const { selectedBranch } = useContext(BranchContext);
  
  // Carga inicial
  useEffect(() => {
    getProductsByInventory(selectedBranch?.codigoInventario)
      .then(data => {
        setProducts(data)
      })
      .catch(err => console.error(err));
  }, [selectedBranch]);

  //Filtrar productos segun el select y input
  const filteredProducts = useMemo(() => {
    // Si no hay término, devolvemos todos
    if (inputValue.trim() === "") {
      return products;
    }
    const criterio = inputValue.trim().toLowerCase();
    setPage(0)
    return products.filter(p => {
      const valorCampo = String(p[filterField] ?? "").toLowerCase();
      return valorCampo.includes(criterio);
    });
  }, [products, filterField, inputValue]);

  // Solo los productos de la página actual
  const displayed = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredProducts.slice(start, start + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  // Handlers de navegación
  const handleChangePage = (e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const buscarProductoPorUPC = (codigo) => {
    const codigoLimpio = codigo.trim()
    const producto = products.find(p => p.upc === codigoLimpio)
    console.log("entre",codigoLimpio)

    if (producto) {
      console.log("Se encontro", producto)
      setInputValue(codigoLimpio)
      setProductoFiltrado(producto)
    } else {
      console.log(`No se encontro producto ${codigo}`)
      setModalProductoNoEncontrado(true)
      setProductoFiltrado(null)
      setCodigoToModal(codigo)
    }
    //ENCONTRAR SI EXISTE UNA MANERA DE CONFIGURAR EL SCANNER CON SUFIJO ENTER 
  }

  const buscaManual = () => {
    setProductoFiltrado(null)
    setPage(0)
  }


  const crearProducto = () => {


  }

  const handleOnChange = (event) => {
    setInputValue(event.target.value)
  }

  const onChangeSelect = (e) => {
    setFilterField(e.target.value);
    setInputValue("")
  }

  return (
    <>
      <h1 style={{ margin: "20px" }}>Inventario</h1>
      <div className='div-hbusqueda'>
        <div className='busqueda'>
          <input
            className="form-control mb-3"
            placeholder="Buscar"
            style={{ width: "40%", height: "100%" }}
            value={inputValue}
            onChange={handleOnChange}
          />
           <select class="form-select selectInventory"  id="selectInventory" value={filterField} onChange={onChangeSelect} >
              <option value="codigoproducto">Código</option>
              <option value="upc">UPC</option>
              <option value="nombreproducto">Nombre</option>
              <option value="marca">Marca</option>
              <option value="existencia">Cantidad</option>
              <option value="precio">Precio</option>
            </select>
          
          <button type="button" class="btn btn-secondary button-head" 
          onClick={() => {
            setInputValue("") 
            setFilterField("codigo")
            setProductoFiltrado(null)
            }} >Limpiar</button>

        </div>
        <button type="button" class="btn btn-primary" style={{ height: "100%" }} onClick={() => navigate("/CrearProducto")} >Crear Producto</button>


      </div>

      <ScannerInput onScan={(code) => {
        console.log("Producto escaneado:", code);
        buscarProductoPorUPC(code); // Aquí haces tu búsqueda
      }} />


      <CrearProductoModal
        show={modalShow}
        onHide={() => setModalShow(false)}
      />

      <ProductoNoEncontrado 
        show={modalProductoNoEncontrado}
        codigo={codigoToModal}
        onHide={() => setModalProductoNoEncontrado(false)}
      />


      <table className="table table-hover">
        <thead>
          <tr>
            <th>Código</th>
            <th>UPC</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Existencia</th>
            <th>Precio</th>
            <th>Ver</th>
          </tr>
        </thead>
        <tbody>
          {(productoFiltrado ? [productoFiltrado] : displayed).map((el, idx) => (
            <tr key={`${el.codigoProducto}+${idx}`}>
              <td>{el.codigoproducto}</td>
              <td>{el.upc}</td>
              <td>{el.nombreproducto}</td>
              <td>{el.marca}</td>
              <td>{el.existencia}</td>
              <td>{el.precio}</td>
              <td>
                <button className="btn btn-outline-secondary" onClick={() => navigate('/ProductoDetalle', {state: { producto: el}})}>Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      <Pagination
        count={filteredProducts.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default Inventory;
