// src/components/Pagination.jsx
import React from 'react';
import TablePagination from '@mui/material/TablePagination';


export default function Pagination({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange }) {
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={onPageChange}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={onRowsPerPageChange}
      rowsPerPageOptions={[10, 25, 50, 100]}
      labelRowsPerPage="Filas por página"
      labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
    />
  );
}