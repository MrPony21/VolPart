const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require("fs");
const ExcelJS = require('exceljs');
const path = require('path');

const dataPath = path.join(app.getPath('userData'), 'data.json');
const clientesPath = path.join(app.getPath('userData'), 'clientes.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.maximize(); 

  if (app.isPackaged) {
    win.loadFile(path.resolve(__dirname, '..', 'app', 'index.html'))
  } else {
    win.loadURL('http://localhost:5173')
  }

}


app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});


//#region Productos

ipcMain.handle("get-products", async () => {
  const raw = fs.readFileSync(dataPath);
  return JSON.parse(raw);
});

ipcMain.handle("update-product", async (event, updatedProduct) => {
  const raw = fs.readFileSync(dataPath);
  const products = JSON.parse(raw);

  const index = products.findIndex(p => p.codigo === updatedProduct.codigo);
  if (index !== -1) {
    products[index] = updatedProduct;
    fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));
    return updatedProduct;
  }

  throw new Error("Producto no encontrado");
});


ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'png'] }]
  });

  if (result.canceled) return null;

  const origen = result.filePaths[0];
  const nombreArchivo = path.basename(origen);
  const destino = path.join(__dirname, 'imagenes', nombreArchivo);

  fs.copyFileSync(origen, destino);

  return `imagenes/${nombreArchivo}`;
});


ipcMain.handle('create-product', async (event, nuevoProducto) => {
  try {
    // Leer el archivo actual
    const data = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
      : [];

    const productoExiste = data.some(producto => producto.codigo === nuevoProducto.codigo)

    if (productoExiste) {
      throw new Error(`Ya existe un producto con código ${nuevoProducto.codigo}`)
    }


    // Agregar el nuevo producto
    data.push(nuevoProducto);

    // Guardar el archivo actualizado
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');

    return nuevoProducto;
  } catch (error) {
    console.error("Error al guardar el producto:", error);
    throw error;
  }
});


ipcMain.handle('exportar-inventario-json', async () => {
  try {
    // 1. Leer contenido actual del JSON
    const productos = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
      : [];

    if (productos.length === 0) {
      return { success: false, mensaje: 'No hay productos para exportar.' };
    }

    // 2. Diálogo para seleccionar ubicación de guardado
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Guardar productos como...',
      defaultPath: 'productos_exportados.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (canceled || !filePath) {
      return { success: false, mensaje: 'Exportación cancelada por el usuario.' };
    }

    // 3. Guardar archivo en la ruta seleccionada
    fs.writeFileSync(filePath, JSON.stringify(productos, null, 2), 'utf-8');

    return { success: true, mensaje: 'Exportación exitosa.', ruta: filePath };
  } catch (error) {
    console.error('Error al exportar productos:', error);
    return { success: false, mensaje: 'Error interno al exportar productos.' };
  }
});


ipcMain.handle('exportar-excel-productos', async () => {
  try {
    const productos = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
      : [];

    if (productos.length === 0) {
      return { success: false, mensaje: 'No hay productos para exportar.' };
    }

    // Crear libro y hoja
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos');

    // Definir columnas
    worksheet.columns = [
      { header: 'Código', key: 'codigo', width: 20 },
      { header: 'Nombre', key: 'nombre', width: 80 },
      { header: 'Marca', key: 'marca', width: 20 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Precio', key: 'precio', width: 15 }
    ];
    // Estilo para encabezado
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF007ACC' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });


    // Agregar filas
    worksheet.addTable({
      name: 'TablaProductos',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true
      },
      columns: [
        { name: 'Código', filterButton: true },
        { name: 'Nombre', filterButton: true },
        { name: 'Marca', filterButton: true },
        { name: 'Cantidad', filterButton: true },
        { name: 'Precio', filterButton: true }
      ],
      rows: productos.map(p => [
        p.codigo,
        p.nombre,
        p.marca,
        p.cantidad,
        p.precio
      ])
    });


    // Diálogo para guardar
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Exportar productos a Excel',
      defaultPath: 'productos.xlsx',
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    });

    if (canceled || !filePath) {
      return { success: false, mensaje: 'Exportación cancelada por el usuario.' };
    }

    // Guardar archivo
    await workbook.xlsx.writeFile(filePath);

    return { success: true, mensaje: 'Exportación a Excel completa.', ruta: filePath };
  } catch (err) {
    console.error("Error al exportar Excel:", err);
    return { success: false, mensaje: 'Error al exportar a Excel.' };
  }
});


// Importar productos desde un JSON y sobrescribir el archivo actual
ipcMain.handle('importar-productos', async (event, productos) => {
  try {
    if (!Array.isArray(productos)) {
      return { success: false, mensaje: 'El archivo no contiene un array de productos.' };
    }
    // Validación básica: cada producto debe tener al menos un código
    for (const p of productos) {
      if (!p.codigo) {
        return { success: false, mensaje: 'Todos los productos deben tener un campo "codigo".' };
      }
    }
    fs.writeFileSync(dataPath, JSON.stringify(productos, null, 2), 'utf-8');
    return { success: true, mensaje: 'Productos importados correctamente.' };
  } catch (error) {
    console.error('Error al importar productos:', error);
    return { success: false, mensaje: 'Error interno al importar productos.' };
  }
});
//#endregion

//#region Clientes

ipcMain.handle('get-clientes', async () => {
  if (!fs.existsSync(clientesPath)) return [];
  const raw = fs.readFileSync(clientesPath);
  return JSON.parse(raw);
});

ipcMain.handle('create-cliente', async (event, nuevoCliente) => {
  try {
    const data = fs.existsSync(clientesPath)
      ? JSON.parse(fs.readFileSync(clientesPath, 'utf-8'))
      : [];
    const existe = data.some(c => c.nit === nuevoCliente.nit);
    if (existe) {
      throw new Error(`Ya existe un cliente con NIT ${nuevoCliente.nit}`);
    }
    data.push(nuevoCliente);
    fs.writeFileSync(clientesPath, JSON.stringify(data, null, 2), 'utf-8');
    return nuevoCliente;
  } catch (error) {
    console.error('Error al guardar el cliente:', error);
    throw error;
  }
});

ipcMain.handle('update-cliente', async (event, clienteActualizado) => {
  const data = fs.existsSync(clientesPath)
    ? JSON.parse(fs.readFileSync(clientesPath, 'utf-8'))
    : [];
  const index = data.findIndex(c => c.nit === clienteActualizado.nit);
  if (index !== -1) {
    data[index] = clienteActualizado;
    fs.writeFileSync(clientesPath, JSON.stringify(data, null, 2));
    return clienteActualizado;
  }
  throw new Error('Cliente no encontrado');
});

ipcMain.handle('delete-cliente', async (event, nit) => {
  const data = fs.existsSync(clientesPath)
    ? JSON.parse(fs.readFileSync(clientesPath, 'utf-8'))
    : [];
  const nuevos = data.filter(c => c.nit !== nit);
  fs.writeFileSync(clientesPath, JSON.stringify(nuevos, null, 2));
  return true;
});

ipcMain.handle('exportar-clientes-json', async () => {
  const clientesPath = path.join(app.getPath('userData'), 'clientes.json');
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Exportar Clientes (JSON)',
    defaultPath: 'clientes.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (canceled) return { success: false, mensaje: 'Exportación cancelada' };

  try {
    const data = fs.readFileSync(clientesPath, 'utf-8');
    fs.writeFileSync(filePath, data, 'utf-8');
    return { success: true, ruta: filePath };
  } catch (err) {
    return { success: false, mensaje: err.message };
  }
});


//#endregion


//#region Ventas
ipcMain.handle('create-venta', async (event, venta) => {
  // 1) Persistir la venta en ventas.json (igual que antes)
  const ventasPath = path.join(app.getPath('userData'), 'ventas.json');
  const ventas = fs.existsSync(ventasPath)
    ? JSON.parse(fs.readFileSync(ventasPath, 'utf-8'))
    : [];
  const id = Date.now();
  const nuevaVenta = { id, ...venta };
  ventas.push(nuevaVenta);
  fs.writeFileSync(ventasPath, JSON.stringify(ventas, null, 2));

  // 2) Actualizar stock en data.json (igual que antes)
  const dataPath = path.join(app.getPath('userData'), 'data.json');
  const productos = fs.existsSync(dataPath)
    ? JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    : [];
  venta.items.forEach(item => {
    const idx = productos.findIndex(p => p.codigo === item.codigo);
    if (idx !== -1) productos[idx].cantidad -= item.cantidadVenta;
  });
  fs.writeFileSync(dataPath, JSON.stringify(productos, null, 2));

  // 3) Generar PDF de la factura
  // a) Pedir ruta de guardado
  const { filePath } = await dialog.showSaveDialog({
    title: 'Guardar factura (PDF)',
    defaultPath: `factura-${id}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  let invoicePath = null;
  if (filePath) {
    // b) Crear ventana oculta para renderizar factura
    const pdfWin = new BrowserWindow({ 
      width: 600, 
      height: 800, 
      show: false,
      webPreferences: { offscreen: true }
    });

    // c) Construir un HTML simple con estilo y logo
    const logoPath = path.join(__dirname, 'assets', 'logo.jpg'); // ajusta ruta si hace falta
    const html = `
      <html><body style="font-family: sans-serif; padding:20px;">
        <img src="file://${logoPath}" style="width:150px;"/>
        <h2>Factura de Venta #${id}</h2>
        <p>Fecha: ${new Date().toLocaleString()}</p>
        <h3>Cliente</h3>
        <p>NIT: ${venta.client.nit}<br/>
           Nombre: ${venta.client.nombre}<br/>
           Teléfono: ${venta.client.telefono}<br/>
           Dirección: ${venta.client.direccion}</p>
        <h3>Productos</h3>
        <table width="100%" border="1" cellpadding="4" cellspacing="0">
          <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
          ${venta.items.map(it=>`
            <tr>
              <td>${it.nombre}</td>
              <td align="center">${it.cantidadVenta}</td>
              <td align="right">Q${it.precio.toFixed(2)}</td>
              <td align="right">Q${(it.precio*it.cantidadVenta).toFixed(2)}</td>
            </tr>`).join('')}
        </table>
        <h3 style="text-align:right;">TOTAL: Q${venta.total.toFixed(2)}</h3>
      </body></html>
    `;

    // d) Cargar HTML y generar PDF
    await pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const pdfBuffer = await pdfWin.webContents.printToPDF({});
    fs.writeFileSync(filePath, pdfBuffer);
    pdfWin.destroy();
    invoicePath = filePath;
  }

  return { nuevaVenta, invoicePath };
});
// ─────────────────────────────────────────────────────────────────

ipcMain.handle('get-ventas', async () => {
  const ventasPath = path.join(app.getPath('userData'), 'ventas.json');
  if (!fs.existsSync(ventasPath)) return [];
  const ventas = JSON.parse(fs.readFileSync(ventasPath, 'utf-8'));
  return ventas;
});

ipcMain.handle('exportar-ventas-json', async () => {
  const ventasPath = path.join(app.getPath('userData'), 'ventas.json');
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Exportar Ventas (JSON)',
    defaultPath: 'ventas.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (canceled) return { success: false, mensaje: 'Exportación cancelada' };

  try {
    const data = fs.readFileSync(ventasPath, 'utf-8');
    fs.writeFileSync(filePath, data, 'utf-8');
    return { success: true, ruta: filePath };
  } catch (err) {
    return { success: false, mensaje: err.message };
  }
});


//#endregion
