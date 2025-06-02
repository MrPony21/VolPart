const { app, BrowserWindow, ipcMain } = require('electron');
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