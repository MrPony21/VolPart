import productData from "../../data.json"

export async function getProducts(){
    const productos = await window.api.getProducts()
    return productos
}

export async function createProduct(product) {
    const productoNuevo = await window.api.createProduct(product)
    return productoNuevo
}

export async function updateProduct(productoActualizado){
    // const index = productData.findIndex(p => p.codigo === productoActualizado.codigo);
    // if(index === -1){
    //     throw new Error("Producto no encontrado")
    // }

    // productData[index] = productoActualizado
    // fs.writeFileSync(dataPath, JSON.stringify(productData, null, 2));
    // return productoActualizado
    try{
        await window.api.updateProduct(productoActualizado)
        return productoActualizado
    }catch(err){
        console.error("Ocurrio un error en la actualizacion del producto", error)
    }
}


export async function callSelectImage(){
    const ruta = await window.api.selectImage();
    return ruta
}

export async function exportarInventarioJSON(){
    const ruta = await window.api.exportarInventarioEnJson();
    return ruta
}

export const exportarExcel = async () => {
    const response = await window.api.exportarInventarioEnExcel();
    return response
};


export async function importProduct(productos){
    const response = await window.api.importarProductos(productos);
    return response
}

export async function getClientes() {
    const clientes = await window.api.getClientes();
    return clientes;
}

export async function createCliente(cliente) {
    const nuevoCliente = await window.api.createCliente(cliente);
    return nuevoCliente;
}

export async function updateCliente(clienteActualizado) {
    try {
        await window.api.updateCliente(clienteActualizado);
        return clienteActualizado;
    } catch (err) {
        console.error("Ocurrió un error en la actualización del cliente", err);
    }
}

export async function deleteCliente(nit) {
    const response = await window.api.deleteCliente(nit);
    return response;
}

export async function createSale(venta) {
  // venta: { client, items, total, date }
  const result = await window.api.createSale(venta);
  return result; // { nuevaVenta, invoicePath }
}

export async function getSales() {
  const ventas = await window.api.getSales();
  return ventas; 
}


export async function exportarVentasJSON() {
  const response = await window.api.exportarVentasJson();
  return response;
}

/** Exporta clientes en JSON */
export async function exportarClientesJSON() {
  const response = await window.api.exportarClientesJson();
  return response;
}