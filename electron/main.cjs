const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require("fs");
const path = require('path');

const dataPath = path.resolve(__dirname, "../data.json");

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

  win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});


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