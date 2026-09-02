/**
 * Flags de funcionalidades controladas por variables de entorno.
 *
 * Vite reemplaza import.meta.env en tiempo de build, asi que para cambiar una
 * flag hay que volver a compilar. Solo la cadena "true" la enciende: si la
 * variable no existe o trae cualquier otro valor, la funcionalidad queda
 * apagada.
 *
 * La API valida la misma flag por su cuenta (IMPORTACION_MASIVA_HABILITADA),
 * asi que encender esta sola no basta: aqui solo se decide si la pantalla se
 * muestra, no si la operacion esta permitida.
 */
export const FEATURES = {
  // Importacion masiva de productos y clientes desde archivo JSON.
  CARGAR_ARCHIVO: import.meta.env.VITE_IMPORTACION_MASIVA_HABILITADA === "true",
};
