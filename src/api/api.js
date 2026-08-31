
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper para obtener headers con Bearer token
const getAuthHeaders = (isFormData = false) => {
  const headers = {
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

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

export async function getProductIndividual(upc){
    const response = await fetch(`${API_BASE_URL}/product/search/${upc}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    return handleResponse(response);    
}

export async function getProductoByCodigoProductoInventario(codigoProducto, codigoInventario){
    const response = await fetch(`${API_BASE_URL}/product/search?CodigoProducto=${codigoProducto}&CodigoInventario=${codigoInventario}`, {
        method: "GET",  
        headers: getAuthHeaders(),
    });
    return handleResponse(response);    
}



export async function createProduct(product) {
  const isFormData = product instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/product`, {
    method: 'POST',
    headers: getAuthHeaders(isFormData),
    body: isFormData ? product : JSON.stringify(product)
  });

  return handleResponse(response);
}

export async function agregarInventarioProducto(producto){
    const response = await fetch(`${API_BASE_URL}/product/agregarInventario`, {
        method: "POST",
        headers: getAuthHeaders(),  
        body: JSON.stringify(producto),
    });
    return handleResponse(response)
}


export async function updateProduct(codigoProducto, payload){
    try {
        const isFormData = payload instanceof FormData;
        const response = await fetch(`${API_BASE_URL}/product/${codigoProducto}`, {
            method: "PUT",
            headers: getAuthHeaders(isFormData),
            body: isFormData ? payload : JSON.stringify(payload),
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

export async function importProduct(productos, codigoInventario){
    const response = await fetch(`${API_BASE_URL}/product/import?codigoInventario=${codigoInventario}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(productos),
    });
    return handleResponse(response);
}

// Historial de movimientos de un producto: existencia, precio y precio de compra
export async function getHistorialProducto(codigoProducto, codigoInventario){
    const response = await fetch(`${API_BASE_URL}/movimiento/producto/${codigoProducto}?codigoInventario=${codigoInventario}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
}

// Funciones de Clientes
export async function getClientes() {
    const response = await fetch(`${API_BASE_URL}/cliente`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
}

export async function createCliente(cliente) {
    const response = await fetch(`${API_BASE_URL}/cliente`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(cliente),
    });
    return handleResponse(response);
}

export async function updateCliente(codigoCliente, clienteActualizado) {
    try {
        const response = await fetch(`${API_BASE_URL}/cliente/${codigoCliente}`, {
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
export async function createSale(venta, codigoInventario) {
  const response = await fetch(`${API_BASE_URL}/venta?codigoInventario=${codigoInventario}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(venta),
  });
  return handleResponse(response);
}

export async function getSales(codigoInventario) {
  const response = await fetch(`${API_BASE_URL}/venta?codigoInventario=${codigoInventario}`, {
      method: "GET",
      headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// Una venta puntual, con su cliente y sus items
export async function getSale(codigoVenta) {
  const response = await fetch(`${API_BASE_URL}/venta/${codigoVenta}`, {
      method: "GET",
      headers: getAuthHeaders(),
  });
  return handleResponse(response);
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
  const response = await fetch(`${API_BASE_URL}/cliente/import`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(clientes),
  });
  return handleResponse(response);
}

// Funciones de Usuarios
export async function registrarUsuario(usuario) {
  const response = await fetch(`${API_BASE_URL}/usuario`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      NombreUsuario: usuario.nombre,
      contrasena: usuario.password,
      CodigoRol: Number(usuario.rol)
    }),
  });
  return handleResponse(response);
}

export async function obtenerUsuarios() {
  const response = await fetch(`${API_BASE_URL}/usuario`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function actualizarUsuario(usuarioId, usuario) {
  const response = await fetch(`${API_BASE_URL}/usuario/${usuarioId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(usuario),
  });
  return handleResponse(response);
}

export async function getRoles() {
    const response = await fetch(`${API_BASE_URL}/usuario/roles`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
}

export async function cambiarContrasena(usuarioId, dto) {
    console.log("entre a cambiar contraseña con dto", dto)
    const response = await fetch(`${API_BASE_URL}/usuario/${usuarioId}/contrasena`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
    });
    return handleResponse(response);
}