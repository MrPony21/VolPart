const { contextBridge, ipcRenderer } = require("electron");


window.addEventListener('DOMContentLoaded', () => {
    console.log("Preload ejecutado");
});
  

contextBridge.exposeInMainWorld("api", {
  updateProduct: (product) => ipcRenderer.invoke("update-product", product),
  getProducts: () => ipcRenderer.invoke("get-products"),
  selectImage: () => ipcRenderer.invoke('select-image'),
  createProduct: (nuevoProducto) => ipcRenderer.invoke('create-product', nuevoProducto),
  exportarInventarioEnJson: ()  => ipcRenderer.invoke('exportar-inventario-json'),
  exportarInventarioEnExcel: () => ipcRenderer.invoke('exportar-excel-productos'),
  importarProductos: (productos) => ipcRenderer.invoke('importar-productos', productos),
  getClientes: () => ipcRenderer.invoke('get-clientes'),
  createCliente: (cliente) => ipcRenderer.invoke('create-cliente', cliente),
  updateCliente: (cliente) => ipcRenderer.invoke('update-cliente', cliente),
  deleteCliente: (nit) => ipcRenderer.invoke('delete-cliente', nit),
  createSale: (venta) => ipcRenderer.invoke("create-venta", venta),
  getSales: () => ipcRenderer.invoke('get-ventas'),
  exportarVentasJson: ()     => ipcRenderer.invoke('exportar-ventas-json'),
  exportarClientesJson: ()   => ipcRenderer.invoke('exportar-clientes-json'),
  importarVentas: (ventas)   => ipcRenderer.invoke('importar-ventas', ventas),
  importarClientes: (clientes)=> ipcRenderer.invoke('importar-clientes', clientes),
});
