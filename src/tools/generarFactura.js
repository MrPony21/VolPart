import { generarDocumentoPDF, C } from './documentoPdf';

/**
 * Genera y descarga la factura PDF de una venta.
 *
 * El layout vive en documentoPdf.js, compartido con la cotización: aquí solo
 * quedan los datos propios de la factura.
 *
 * @param {object} params
 * @param {string} params.numeroSerie  - Número de serie de la venta (del API)
 * @param {number} params.codigoVenta  - Código de la venta (del API, fallback)
 * @param {object} params.cliente      - { nit, nombre, telefono, direccion }
 * @param {Array}  params.items        - ventasList: [{ codigoproducto, nombreproducto, precio, cantidadVenta }]
 * @param {number} params.total        - Total calculado
 * @param {string} params.nombreSucursal
 * @param {string} [params.observacion] - Nota corta, ej. de donde salio la
 *   venta. La factura normal del punto de venta no la manda.
 */
export function generarFacturaPDF({ numeroSerie, codigoVenta, cliente, items, total, nombreSucursal, observacion }) {
  const serie = numeroSerie ?? `#${codigoVenta ?? Date.now()}`;

  generarDocumentoPDF({
    titulo: 'COMPROBANTE DE VENTA',
    etiquetaSerie: 'N° Serie',
    serie,
    cliente,
    items: items.map((item) => ({
      codigo: item.codigoproducto,
      descripcion: item.nombreproducto,
      cantidad: item.cantidadVenta ?? 1,
      precio: item.precio,
    })),
    total,
    nombreSucursal,
    colorTotal: C.green,
    leyendaPie: 'Gracias por su compra  •  VolPart',
    observacion,
    nombreArchivo: `COMPROBANTE-${serie}.pdf`,
  });
}
