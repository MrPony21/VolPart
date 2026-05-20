import ExcelJS from 'exceljs';

function applyHeaderStyle(worksheet) {
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007ACC' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
  });
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

export async function exportarInventarioExcel(productos) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Inventario');

  ws.columns = [
    { header: 'Código',     key: 'codigoproducto', width: 18 },
    { header: 'UPC',        key: 'upc',            width: 20 },
    { header: 'Nombre',     key: 'nombreproducto', width: 45 },
    { header: 'Marca',      key: 'marca',          width: 20 },
    { header: 'Existencia', key: 'existencia',     width: 12 },
    { header: 'Precio',     key: 'precio',         width: 12 },
  ];

  applyHeaderStyle(ws);

  productos.forEach(p => ws.addRow({
    codigoproducto: p.codigoproducto,
    upc:            p.upc,
    nombreproducto: p.nombreproducto,
    marca:          p.marca,
    existencia:     p.existencia,
    precio:         p.precio,
  }));

  // Zebra stripes
  ws.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, 'inventario.xlsx');
}

export async function exportarClientesExcel(clientes) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Clientes');

  ws.columns = [
    { header: 'Código',    key: 'codigoCliente',  width: 10 },
    { header: 'NIT',       key: 'nit',            width: 16 },
    { header: 'Nombre',    key: 'nombreCliente',  width: 35 },
    { header: 'Teléfono',  key: 'telefono',       width: 16 },
    { header: 'Dirección', key: 'direccion',      width: 40 },
  ];

  applyHeaderStyle(ws);

  clientes.forEach(c => ws.addRow({
    codigoCliente: c.codigoCliente,
    nit:           c.nit,
    nombreCliente: c.nombreCliente,
    telefono:      c.telefono,
    direccion:     c.direccion,
  }));

  ws.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, 'clientes.xlsx');
}

export async function exportarVentasExcel(ventas) {
  const workbook = new ExcelJS.Workbook();

  // Hoja 1: resumen de ventas
  const wsVentas = workbook.addWorksheet('Ventas');
  wsVentas.columns = [
    { header: 'Código Venta',  key: 'codigoVenta',       width: 14 },
    { header: 'N° Serie',      key: 'numeroSerie',        width: 16 },
    { header: 'Cliente',       key: 'cliente',            width: 30 },
    { header: 'NIT',           key: 'nit',                width: 16 },
    { header: 'Teléfono',      key: 'telefono',           width: 14 },
    { header: 'Dirección',     key: 'direccion',          width: 35 },
    { header: 'Total (Q)',     key: 'total',              width: 14 },
  ];
  applyHeaderStyle(wsVentas);

  ventas.forEach(v => wsVentas.addRow({
    codigoVenta: v.codigoVenta,
    numeroSerie: v.numeroSerie,
    cliente:     v.cliente?.nombreCliente ?? 'Sin cliente',
    nit:         v.cliente?.nit ?? '-',
    telefono:    v.cliente?.telefono ?? '-',
    direccion:   v.cliente?.direccion ?? '-',
    total:       parseFloat(v.total),
  }));

  wsVentas.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
      });
    }
  });

  // Hoja 2: detalle de items
  const wsItems = workbook.addWorksheet('Detalle Items');
  wsItems.columns = [
    { header: 'Código Venta',   key: 'codigoVenta',    width: 14 },
    { header: 'N° Serie',       key: 'numeroSerie',    width: 16 },
    { header: 'Cód. Producto',  key: 'codigoProducto', width: 16 },
    { header: 'Nombre',         key: 'nombre',         width: 40 },
    { header: 'UPC',            key: 'upc',            width: 18 },
    { header: 'Cantidad',       key: 'cantidad',       width: 10 },
    { header: 'Precio Unit. (Q)', key: 'precioVenta',  width: 16 },
    { header: 'Subtotal (Q)',   key: 'totalItem',      width: 14 },
  ];
  applyHeaderStyle(wsItems);

  ventas.forEach(v => {
    v.items?.forEach(item => {
      const producto = item.inventarioProducto?.producto;
      wsItems.addRow({
        codigoVenta:    v.codigoVenta,
        numeroSerie:    v.numeroSerie,
        codigoProducto: producto?.codigoProducto ?? item.codigoInventarioProducto,
        nombre:         producto?.nombreProducto ?? '-',
        upc:            producto?.upc ?? '-',
        cantidad:       item.cantidad,
        precioVenta:    parseFloat(item.precioVenta),
        totalItem:      parseFloat(item.totalItemVenta),
      });
    });
  });

  wsItems.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, 'ventas.xlsx');
}
