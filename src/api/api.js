const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper para obtener headers con Bearer token
const getAuthHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
  };
  
  // Agregar sucursal seleccionada si existe
  const selectedBranch = localStorage.getItem("selectedBranch");
//   if (selectedBranch) {
//     headers["X-Branch"] = selectedBranch;
//   }
  
  return headers;
};

// Helper para manejar respuestas y errores de autenticación
const handleResponse = async (response) => {
    console.log("response", response)
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/#/"; // Redirige al login
    throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente");
  }
  
  // Si no está autorizado (403 Forbidden)
  if (response.status === 403) {
    throw new Error("No tienes permisos para realizar esta acción");
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error HTTP ${response.status}`);
  }
  
  return response.json();
};

//Funciones de inventario
export async function getInventory(){
     const response = await fetch(`${API_BASE_URL}/inventario`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    return handleResponse(response);
}
// Funciones de Productos
export async function getProducts(){
    const response = await fetch(`${API_BASE_URL}/Product`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
}

export async function getProductsByInventory(inventoryId){
    const response = await fetch(`${API_BASE_URL}/product/inventario/${inventoryId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
}


export async function createProduct(product) {
    const response = await fetch(`${API_BASE_URL}/productos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(product),
    });
    return handleResponse(response);
}

export async function updateProduct(productoActualizado){
    try {
        const response = await fetch(`${API_BASE_URL}/productos/${productoActualizado.id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(productoActualizado),
        });
        return handleResponse(response);
    } catch(err){
        console.error("Ocurrió un error en la actualización del producto", err);
        throw err;
    }
}

export async function callSelectImage(){
    const ruta = await window.api.selectImage();
    return ruta;
}

export async function exportarInventarioJSON(){
    const ruta = await window.api.exportarInventarioEnJson();
    return ruta;
}

export const exportarExcel = async () => {
    const response = await window.api.exportarInventarioEnExcel();
    return response;
};

export async function importProduct(productos){
    const response = await fetch(`${API_BASE_URL}/productos/import`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(productos),
    });
    return handleResponse(response);
}

// Funciones de Clientes
export async function getClientes() {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
}

export async function createCliente(cliente) {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(cliente),
    });
    return handleResponse(response);
}

export async function updateCliente(clienteActualizado) {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes/${clienteActualizado.nit}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(clienteActualizado),
        });
        return handleResponse(response);
    } catch (err) {
        console.error("Ocurrió un error en la actualización del cliente", err);
        throw err;
    }
}

export async function deleteCliente(nit) {
    const response = await fetch(`${API_BASE_URL}/clientes/${nit}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
}

// Funciones de Ventas
export async function createSale(venta) {
  const response = await fetch(`${API_BASE_URL}/ventas`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(venta),
  });
  return handleResponse(response);
}

export async function getSales() {
  const response = await fetch(`${API_BASE_URL}/ventas`, {
      method: "GET",
      headers: getAuthHeaders(),
  });
  return handleResponse(response);
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

/** Importa un array de ventas (incluso vacío) */
export async function importVentas(ventas) {
  const response = await fetch(`${API_BASE_URL}/ventas/import`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(ventas),
  });
  return handleResponse(response);
}

/** Importa un array de clientes (incluso vacío) */
export async function importClientes(clientes) {
  const response = await fetch(`${API_BASE_URL}/clientes/import`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(clientes),
  });
  return handleResponse(response);
}