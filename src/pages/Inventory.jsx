import React, { useState, useEffect, useMemo } from 'react';
import { getProducts } from '../api/api';
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

  // Carga inicial
  useEffect(() => {
    getProducts()
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  // Solo los productos de la página actual
  const displayed = useMemo(() => {
    const start = page * rowsPerPage;
    return products.slice(start, start + rowsPerPage);
  }, [products, page, rowsPerPage]);

  // Handlers de navegación
  const handleChangePage = (e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = e => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const buscarProductoPorCodigo = (codigo) => {
    const codigoLimpio = codigo.trim()
    const producto = products.find(p => p.codigo === codigoLimpio)


    if (producto) {
      console.log("Se encontro", producto)
      setInputValue(codigoLimpio)
      setProductoFiltrado(producto)
    } else {
      console.log(`No se encontro producto ${codigo}`)
      setModalProductoNoEncontrado(true)
      setProductoFiltrado(null)
    }
  }


  const crearProducto = () => {


  }

  const handleOnChange = (event) => {
    setInputValue(event.target.value)
  }


  return (
    <>
      <h1 style={{ margin: "20px" }}>Inventario</h1>
      <div className='div-hbusqueda'>
        <div className='busqueda'>
          <input
            className="form-control mb-3"
            placeholder="Buscar"
            style={{ width: "50%", height: "100%" }}
            value={inputValue}
            onChange={handleOnChange}
          // Puedes enlazar otro estado aquí para filtrar y recomputar displayedProducts
          />
          <button type="button" class="btn btn-primary button-head" >Buscar</button>
          <button type="button" class="btn btn-secondary button-head" 
          onClick={() => {
            setInputValue("") 
            setProductoFiltrado(null)
            }} >Limpiar</button>

        </div>
        <button type="button" class="btn btn-primary" style={{ height: "100%" }} onClick={() => setModalShow(true)} >Crear Producto</button>


      </div>

      <ScannerInput onScan={(code) => {
        console.log("Producto escaneado:", code);
        buscarProductoPorCodigo(code); // Aquí haces tu búsqueda
      }} />


      <CrearProductoModal
        show={modalShow}
        onHide={() => setModalShow(false)}
      />

      <ProductoNoEncontrado 
        show={modalProductoNoEncontrado}
        onHide={() => setModalProductoNoEncontrado(false)}
      />


      <table className="table table-hover">
        <thead>
          <tr>
            <th>#</th>
            <th>Codigo</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Ver</th>
          </tr>
        </thead>
        <tbody>
          {(productoFiltrado ? [productoFiltrado] : displayed).map((el, idx) => (
            <tr key={`${el.codigo}+${idx}`}>
              <td>{page * rowsPerPage + idx + 1}</td>
              <td>{el.codigo}</td>
              <td>{el.nombre}</td>
              <td>{el.marca}</td>
              <td>{el.cantidad}</td>
              <td>{el.precio}</td>
              <td>
                <button className="btn btn-outline-secondary">Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      <Pagination
        count={products.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default Inventory;
