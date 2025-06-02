const { contextBridge, ipcRenderer } = require("electron");


window.addEventListener('DOMContentLoaded', () => {
    console.log("Preload ejecutado");
});
  

contextBridge.exposeInMainWorld("api", {
  updateProduct: (product) => ipcRenderer.invoke("update-product", product),
  getProducts: () => ipcRenderer.invoke("get-products")
});