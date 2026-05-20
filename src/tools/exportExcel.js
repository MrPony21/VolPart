import ExcelJS from 'exceljs';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDateTime() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function sanitize(str) {
  return (str ?? 'SinNombre').replace(/[/\\?%*:|"<> ]/g, '_');
}

function downloadBuffer(buffer, fileName) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(data, nombreBase, nombreSucursal) {
  const dt   = getDateTime();
  const name = nombreSucursal
    ? `${nombreBase}-${sanitize(nombreSucursal)}-${dt}.json`
    : `${nombreBase}-${dt}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Estilos reutilizables ───────────────────────────────────────────────────

const COLOR_HEADER_BG   = 'FF1A3A5C'; // azul marino oscuro
const COLOR_HEADER_FG   = 'FFFFFFFF'; // blanco
const COLOR_TITLE_BG    = 'FF007ACC'; // azul medio para el bloque de título
const COLOR_TITLE_FG    = 'FFFFFFFF';
const COLOR_ROW_ALT     = 'FFE8F4FD'; // azul muy claro
const COLOR_TOTAL_BG    = 'FFDFF2E8'; // verde claro para totales
const COLOR_TOTAL_FG    = 'FF1A3A5C';
const COLOR_SUCURSAL_BG = 'FF2E86C1'; // azul para fila de sucursal

const borderThin = {
  top: { style: 'thin', color: { argb: 'FFB0C4D8' } },
  left: { style: 'thin', color: { argb: 'FFB0C4D8' } },
  bottom: { style: 'thin', color: { argb: 'FFB0C4D8' } },
  right: { style: 'thin', color: { argb: 'FFB0C4D8' } },
};

function styleHeaderCell(cell) {
  cell.font      = { bold: true, color: { argb: COLOR_HEADER_FG }, size: 11 };
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border    = borderThin;
}

function styleDataCell(cell, altRow) {
  if (altRow) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ROW_ALT } };
  }
  cell.border    = borderThin;
  cell.alignment = { vertical: 'middle' };
}

function styleTotalCell(cell) {
  cell.font   = { bold: true, color: { argb: COLOR_TOTAL_FG }, size: 11 };
  cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL_BG } };
  cell.border = borderThin;
  cell.alignment = { vertical: 'middle', horizontal: 'right' };
}

/**
 * Inserta un bloque de cabecera vistoso con título, sucursal y fecha de generación.
 * Devuelve el número de la siguiente fila disponible para datos.
 */
function insertHeader(ws, titulo, nombreSucursal, colCount) {
  const lastCol = String.fromCharCode(64 + colCount); // A=1, B=2…

  // Fila 1 – Título principal
  ws.mergeCells(`A1:${lastCol}1`);
  const titleCell = ws.getCell('A1');
  titleCell.value     = titulo.toUpperCase();
  titleCell.font      = { bold: true, color: { argb: COLOR_TITLE_FG }, size: 16 };
  titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TITLE_BG } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 36;

  // Fila 2 – Sucursal (solo si aplica)
  let nextRow = 2;
  if (nombreSucursal) {
    ws.mergeCells(`A2:${lastCol}2`);
    const sucCell = ws.getCell('A2');
    sucCell.value     = `Sucursal: ${nombreSucursal}`;
    sucCell.font      = { bold: true, color: { argb: COLOR_TITLE_FG }, size: 12 };
    sucCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUCURSAL_BG } };
    sucCell.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(2).height = 22;
    nextRow = 3;
  }

  // Fila siguiente – Fecha de generación
  ws.mergeCells(`A${nextRow}:${lastCol}${nextRow}`);
  const dateCell = ws.getCell(`A${nextRow}`);
  dateCell.value     = `Generado el: ${new Date().toLocaleString('es-GT')}`;
  dateCell.font      = { italic: true, color: { argb: 'FF555555' }, size: 10 };
  dateCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } };
  dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(nextRow).height = 18;

  // Fila separadora vacía
  nextRow++;
  ws.getRow(nextRow).height = 6;

  return nextRow + 1; // fila donde van los headers de columna
}

// ─── Exportar Inventario ─────────────────────────────────────────────────────

export async function exportarInventarioExcel(productos, nombreSucursal) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VolPart';
  const ws = workbook.addWorksheet('Inventario');

  const cols = [
    { header: 'Código',     key: 'codigoproducto', width: 18 },
    { header: 'UPC',        key: 'upc',            width: 22 },
    { header: 'Nombre',     key: 'nombreproducto', width: 45 },
    { header: 'Marca',      key: 'marca',          width: 22 },
    { header: 'Existencia', key: 'existencia',     width: 13 },
    { header: 'Precio (Q)', key: 'precio',         width: 14 },
  ];
  ws.columns = cols;

  const dataStartRow = insertHeader(ws, 'Reporte de Inventario', nombreSucursal, cols.length);

  // Fila de encabezados de columna
  const headerRow = ws.getRow(dataStartRow);
  cols.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    styleHeaderCell(cell);
  });
  headerRow.height = 26;

  // Filas de datos
  productos.forEach((p, idx) => {
    const row = ws.getRow(dataStartRow + 1 + idx);
    row.height = 20;
    const values = [p.codigoproducto, p.upc, p.nombreproducto, p.marca, p.existencia, p.precio];
    values.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      styleDataCell(cell, idx % 2 !== 0);
    });
    // Alinear números a la derecha
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(6).numFmt = '#,##0.00';
  });

  // Fila total de existencias
  const totalRow = ws.getRow(dataStartRow + 1 + productos.length);
  totalRow.height = 22;
  const totalExistencia = productos.reduce((s, p) => s + (Number(p.existencia) || 0), 0);
  cols.forEach((_, i) => {
    const cell = totalRow.getCell(i + 1);
    if (i === 3) { cell.value = 'TOTAL'; styleTotalCell(cell); }
    else if (i === 4) { cell.value = totalExistencia; styleTotalCell(cell); }
    else styleTotalCell(cell);
  });

  // Columnas anchas fijas (las definimos arriba, no hace falta autoWidth)
  ws.views = [{ state: 'frozen', ySplit: dataStartRow, activeCell: `A${dataStartRow + 1}` }];

  const dt  = getDateTime();
  const fileName = `Inventario-${sanitize(nombreSucursal)}-${dt}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, fileName);
}

// ─── Exportar Clientes ───────────────────────────────────────────────────────

export async function exportarClientesExcel(clientes) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VolPart';
  const ws = workbook.addWorksheet('Clientes');

  const cols = [
    { header: 'Código',    key: 'codigoCliente',  width: 10 },
    { header: 'NIT',       key: 'nit',            width: 18 },
    { header: 'Nombre',    key: 'nombreCliente',  width: 38 },
    { header: 'Teléfono',  key: 'telefono',       width: 16 },
    { header: 'Dirección', key: 'direccion',      width: 42 },
  ];
  ws.columns = cols;

  const dataStartRow = insertHeader(ws, 'Reporte de Clientes', null, cols.length);

  const headerRow = ws.getRow(dataStartRow);
  cols.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    styleHeaderCell(cell);
  });
  headerRow.height = 26;

  clientes.forEach((c, idx) => {
    const row = ws.getRow(dataStartRow + 1 + idx);
    row.height = 20;
    const values = [c.codigoCliente, c.nit, c.nombreCliente, c.telefono, c.direccion];
    values.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      styleDataCell(cell, idx % 2 !== 0);
    });
  });

  // Fila de total
  const totalRow = ws.getRow(dataStartRow + 1 + clientes.length);
  totalRow.height = 22;
  cols.forEach((_, i) => {
    const cell = totalRow.getCell(i + 1);
    if (i === 1) { cell.value = `${clientes.length} clientes`; styleTotalCell(cell); }
    else styleTotalCell(cell);
  });

  ws.views = [{ state: 'frozen', ySplit: dataStartRow, activeCell: `A${dataStartRow + 1}` }];

  const dt = getDateTime();
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, `clientes-${dt}.xlsx`);
}

// ─── Exportar Ventas ─────────────────────────────────────────────────────────

export async function exportarVentasExcel(ventas, nombreSucursal) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VolPart';

  // ── Hoja 1: Resumen de ventas ──────────────────────────────────────────────
  const wsV = workbook.addWorksheet('Resumen Ventas');
  const colsV = [
    { header: 'Código Venta', key: 'codigoVenta',  width: 15 },
    { header: 'N° Serie',     key: 'numeroSerie',   width: 18 },
    { header: 'Cliente',      key: 'cliente',       width: 32 },
    { header: 'NIT',          key: 'nit',           width: 16 },
    { header: 'Teléfono',     key: 'telefono',      width: 14 },
    { header: 'Dirección',    key: 'direccion',     width: 36 },
    { header: 'Total (Q)',    key: 'total',         width: 14 },
  ];
  wsV.columns = colsV;

  const dsV = insertHeader(wsV, 'Resumen de Ventas', nombreSucursal, colsV.length);
  const hrV = wsV.getRow(dsV);
  colsV.forEach((col, i) => { const c = hrV.getCell(i + 1); c.value = col.header; styleHeaderCell(c); });
  hrV.height = 26;

  let totalGeneral = 0;
  ventas.forEach((v, idx) => {
    const row = wsV.getRow(dsV + 1 + idx);
    row.height = 20;
    const total = parseFloat(v.total);
    totalGeneral += total;
    const values = [
      v.codigoVenta, v.numeroSerie,
      v.cliente?.nombreCliente ?? 'Sin cliente',
      v.cliente?.nit ?? '-',
      v.cliente?.telefono ?? '-',
      v.cliente?.direccion ?? '-',
      total,
    ];
    values.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      styleDataCell(cell, idx % 2 !== 0);
    });
    row.getCell(7).numFmt = '#,##0.00';
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
  });

  // Fila total
  const trV = wsV.getRow(dsV + 1 + ventas.length);
  trV.height = 22;
  colsV.forEach((_, i) => {
    const cell = trV.getCell(i + 1);
    if (i === 5) { cell.value = 'TOTAL GENERAL'; styleTotalCell(cell); }
    else if (i === 6) { cell.value = totalGeneral; cell.numFmt = '#,##0.00'; styleTotalCell(cell); }
    else styleTotalCell(cell);
  });

  wsV.views = [{ state: 'frozen', ySplit: dsV, activeCell: `A${dsV + 1}` }];

  // ── Hoja 2: Detalle de ítems ───────────────────────────────────────────────
  const wsI = workbook.addWorksheet('Detalle Items');
  const colsI = [
    { header: 'Código Venta',     key: 'codigoVenta',    width: 15 },
    { header: 'N° Serie',         key: 'numeroSerie',    width: 18 },
    { header: 'Cód. Producto',    key: 'codigoProducto', width: 16 },
    { header: 'Nombre Producto',  key: 'nombre',         width: 42 },
    { header: 'UPC',              key: 'upc',            width: 20 },
    { header: 'Cantidad',         key: 'cantidad',       width: 11 },
    { header: 'Precio Unit. (Q)', key: 'precioVenta',    width: 16 },
    { header: 'Subtotal (Q)',     key: 'totalItem',      width: 15 },
  ];
  wsI.columns = colsI;

  const dsI = insertHeader(wsI, 'Detalle de Items por Venta', nombreSucursal, colsI.length);
  const hrI = wsI.getRow(dsI);
  colsI.forEach((col, i) => { const c = hrI.getCell(i + 1); c.value = col.header; styleHeaderCell(c); });
  hrI.height = 26;

  let rowIdx = 0;
  let totalItems = 0;
  ventas.forEach(v => {
    v.items?.forEach(item => {
      const producto = item.inventarioProducto?.producto;
      const subtotal = parseFloat(item.totalItemVenta);
      totalItems += subtotal;
      const row = wsI.getRow(dsI + 1 + rowIdx);
      row.height = 20;
      const values = [
        v.codigoVenta,
        v.numeroSerie,
        producto?.codigoProducto ?? item.codigoInventarioProducto,
        producto?.nombreProducto ?? '-',
        producto?.upc ?? '-',
        item.cantidad,
        parseFloat(item.precioVenta),
        subtotal,
      ];
      values.forEach((val, i) => {
        const cell = row.getCell(i + 1);
        cell.value = val;
        styleDataCell(cell, rowIdx % 2 !== 0);
      });
      row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(7).numFmt = '#,##0.00';
      row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(8).numFmt = '#,##0.00';
      row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
      rowIdx++;
    });
  });

  // Fila total ítems
  const trI = wsI.getRow(dsI + 1 + rowIdx);
  trI.height = 22;
  colsI.forEach((_, i) => {
    const cell = trI.getCell(i + 1);
    if (i === 6) { cell.value = 'TOTAL'; styleTotalCell(cell); }
    else if (i === 7) { cell.value = totalItems; cell.numFmt = '#,##0.00'; styleTotalCell(cell); }
    else styleTotalCell(cell);
  });

  wsI.views = [{ state: 'frozen', ySplit: dsI, activeCell: `A${dsI + 1}` }];

  const dt = getDateTime();
  const fileName = `ventas-${sanitize(nombreSucursal)}-${dt}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, fileName);
}
