import productData from "../../data.json"

export async function getProducts(){
    const productos = await window.api.getProducts()
    return productos
}

export async function createProduct(product) {
    product.push(product)
    return product
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