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
