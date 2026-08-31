// Reglas de ganancia y formato compartidas por las vistas de ventas.
//
// La regla importante vive aquí una sola vez: un ítem sin precio de compra
// registrado NO puede reportar ganancia real, así que suma 0 en vez de
// inflarla con el precio de venta completo. Antes estaba duplicada en la
// pantalla de ventas y en el export de Excel, y eso se desincroniza solo.

export const OBSERVACION_SIN_COSTO =
  'Sin ganancia real registrada porque no tiene costo';

export const costoItem = (item) =>
  parseFloat(item.precioCompra ?? 0) * item.cantidad;

export const gananciaItem = (item) => {
  if (parseFloat(item.precioCompra ?? 0) === 0) return 0;
  return parseFloat(item.totalItemVenta) - costoItem(item);
};

export const itemSinCosto = (item) => parseFloat(item.precioCompra ?? 0) === 0;

// Total vendido, sumando el subtotal que quedó guardado en cada ítem
export const totalVendidoVenta = (venta) =>
  (venta.items ?? []).reduce((acc, item) => acc + parseFloat(item.totalItemVenta), 0);

// Lo que costó comprar lo vendido, con el precio congelado al momento de la venta
export const totalCostoVenta = (venta) =>
  (venta.items ?? []).reduce((acc, item) => acc + costoItem(item), 0);

export const gananciaVenta = (venta) =>
  (venta.items ?? []).reduce((acc, item) => acc + gananciaItem(item), 0);

// Las ventas anteriores al registro del precio de compra quedaron en costo 0
export const tieneItemSinCosto = (venta) =>
  (venta.items ?? []).some(itemSinCosto);

// Margen sobre lo vendido, en porcentaje. 0 si no hubo venta.
export const margenPorcentaje = (ganancia, vendido) =>
  vendido > 0 ? (ganancia / vendido) * 100 : 0;

// ─── Formato ────────────────────────────────────────────────────────────────

export const adjustFecha = (isoStr) => {
  if (!isoStr) return null;
  return new Date(new Date(isoStr).getTime() - 6 * 60 * 60 * 1000);
};

export const formatFecha = (isoStr) => {
  const date = adjustFecha(isoStr);
  if (!date) return "";
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

export const quetzales = (valor) => `Q${Number(valor).toFixed(2)}`;
