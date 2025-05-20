import React, { useState, useEffect, useMemo } from 'react';
import { getProducts } from '../api/api';
import Pagination from '../components/Pagination';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const productsPerPage = 25;

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

  return (
    <>
      <h2>Buscar</h2>
      <input
        className="form-control mb-3"
        placeholder="Filtrar..."
        // Puedes enlazar otro estado aquí para filtrar y recomputar displayedProducts
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
          {displayed.map((el, idx) => (
            <tr key={`${el.Codigo}+${idx}`}>
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
