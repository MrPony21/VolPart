import productData from "../../data.json"


export async function getProducts(){
    return productData
}

export async function createProduct(product) {
    product.push(product)
    return product
}