import jsPDF from 'jspdf';
import logoUrl from '../assets/logonuevo.jpg';

// ── Paleta de colores ────────────────────────────────────────────────────────
const C = {
  darkBlue:  [26,  58,  92],
  medBlue:   [0,  122, 204],
  lightBlue: [232, 244, 253],
  softBlue:  [214, 234, 248],
  green:     [39,  174,  96],
  white:     [255, 255, 255],
  lightGray: [245, 247, 250],
  midGray:   [160, 175, 190],
  darkGray:  [60,  70,   80],
  rowAlt:    [241, 248, 255],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rgb = (arr) => ({ r: arr[0], g: arr[1], b: arr[2] });

function setFill(doc, color)   { doc.setFillColor(color[0], color[1], color[2]); }
function setStroke(doc, color) { doc.setDrawColor(color[0], color[1], color[2]); }
function setTxt(doc, color)    { doc.setTextColor(color[0], color[1], color[2]); }

function roundRect(doc, x, y, w, h, r, fillColor) {
  setFill(doc, fillColor);
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

function headerRect(doc, x, y, w, h, fillColor) {
  // Rounded top, square bottom
  roundRect(doc, x, y, w, h + 3, 2, fillColor);
  setFill(doc, fillColor);
  doc.rect(x, y + h - 1, w, 4, 'F');
}

// ── Función principal ────────────────────────────────────────────────────────

/**
 * Genera y descarga la factura PDF de una venta.
 *
 * @param {object} params
 * @param {string} params.numeroSerie  - Número de serie de la venta (del API)
 * @param {number} params.codigoVenta  - Código de la venta (del API, fallback)
 * @param {object} params.cliente      - { nit, nombre, telefono, direccion }
 * @param {Array}  params.items        - ventasList: [{ codigoproducto, nombreproducto, precio, cantidadVenta }]
 * @param {number} params.total        - Total calculado
 * @param {string} params.nombreSucursal
 */
export function generarFacturaPDF({ numeroSerie, codigoVenta, cliente, items, total, nombreSucursal }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const PW = 210;           // ancho A4
  const M  = 14;            // margen
  const CW = PW - 2 * M;   // ancho de contenido = 182mm
  const serie = numeroSerie ?? `#${codigoVenta ?? Date.now()}`;

  // ── 1. ENCABEZADO ──────────────────────────────────────────────────────────
  setFill(doc, C.darkBlue);
  doc.rect(0, 0, PW, 40, 'F');

  // Logo
  try {
    doc.addImage(logoUrl, 'JPEG', M, 5, 28, 22);
  } catch (_) { /* si falla el logo, continúa */ }

  // Título
  setTxt(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('FACTURA DE VENTA', PW - M, 13, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° Serie: ${serie}`, PW - M, 20, { align: 'right' });
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}  ${new Date().toLocaleTimeString('es-GT')}`, PW - M, 26, { align: 'right' });
  if (nombreSucursal) {
    doc.text(`Sucursal: ${nombreSucursal}`, PW - M, 32, { align: 'right' });
  }

  // Línea decorativa azul medio
  setFill(doc, C.medBlue);
  doc.rect(0, 40, PW, 3, 'F');

  // ── 2. DATOS DEL CLIENTE ──────────────────────────────────────────────────
  let y = 50;

  // Cabecera de sección
  headerRect(doc, M, y, CW, 7, C.medBlue);
  setTxt(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('DATOS DEL CLIENTE', M + 3, y + 5);
  y += 10;

  // Fondo del bloque cliente
  setFill(doc, C.lightBlue);
  doc.rect(M, y, CW, 22, 'F');

  // Línea borde suave
  setStroke(doc, C.softBlue);
  doc.setLineWidth(0.3);
  doc.rect(M, y, CW, 22);

  const col1x = M + 4;
  const col2x = M + CW / 2 + 4;

  const labelVal = (lbl, val, x, ly) => {
    setTxt(doc, C.darkBlue);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(lbl, x, ly);
    setTxt(doc, C.darkGray);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val ?? '-'), x + doc.getTextWidth(lbl) + 2, ly);
  };

  labelVal('NIT:',       cliente.nit,       col1x, y + 7);
  labelVal('Nombre:',    cliente.nombre,     col2x, y + 7);
  labelVal('Teléfono:',  cliente.telefono,   col1x, y + 15);
  labelVal('Dirección:', cliente.direccion,  col2x, y + 15);
  y += 28;

  // ── 3. TABLA DE PRODUCTOS ─────────────────────────────────────────────────

  // Cabecera de sección
  headerRect(doc, M, y, CW, 7, C.darkBlue);
  setTxt(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('DETALLE DE PRODUCTOS', M + 3, y + 5);
  y += 10;

  // Definición de columnas (suma = 182mm)
  const cols = [
    { label: '#',          x: M,       w: 9,   align: 'center' },
    { label: 'Código',     x: M + 9,   w: 26,  align: 'left'   },
    { label: 'Descripción',x: M + 35,  w: 79,  align: 'left'   },
    { label: 'Cant.',      x: M + 114, w: 14,  align: 'center' },
    { label: 'Precio',     x: M + 128, w: 27,  align: 'right'  },
    { label: 'Subtotal',   x: M + 155, w: 27,  align: 'right'  },
  ];

  // Fila de encabezados de columna
  setFill(doc, C.darkBlue);
  doc.rect(M, y, CW, 8, 'F');
  setTxt(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  cols.forEach(col => {
    const tx = col.align === 'right'  ? col.x + col.w - 2
             : col.align === 'center' ? col.x + col.w / 2
             : col.x + 2;
    doc.text(col.label, tx, y + 5.5, { align: col.align });
  });
  y += 8;

  // Filas de datos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const ROW_H = 8;

  items.forEach((item, idx) => {
    // Zebra
    setFill(doc, idx % 2 === 0 ? C.white : C.rowAlt);
    doc.rect(M, y, CW, ROW_H, 'F');

    // Línea inferior de fila
    setStroke(doc, C.midGray);
    doc.setLineWidth(0.1);
    doc.line(M, y + ROW_H, M + CW, y + ROW_H);

    setTxt(doc, C.darkGray);
    const precio   = parseFloat(item.precio ?? 0);
    const cantidad = item.cantidadVenta ?? 1;
    const subtotal = precio * cantidad;

    const nombre = String(item.nombreproducto ?? '-');
    const nombreMostrar = nombre.length > 46 ? nombre.slice(0, 43) + '...' : nombre;

    const cellData = [
      { val: String(idx + 1),                           col: cols[0] },
      { val: String(item.codigoproducto ?? '-'),         col: cols[1] },
      { val: nombreMostrar,                              col: cols[2] },
      { val: String(cantidad),                           col: cols[3] },
      { val: `Q ${precio.toFixed(2)}`,                  col: cols[4] },
      { val: `Q ${subtotal.toFixed(2)}`,                col: cols[5] },
    ];

    cellData.forEach(({ val, col }) => {
      const tx = col.align === 'right'  ? col.x + col.w - 2
               : col.align === 'center' ? col.x + col.w / 2
               : col.x + 2;
      doc.text(val, tx, y + 5.5, { align: col.align });
    });

    y += ROW_H;
  });

  // Borde exterior de la tabla
  setStroke(doc, C.midGray);
  doc.setLineWidth(0.3);
  doc.rect(M, y - items.length * ROW_H - 8, CW, items.length * ROW_H + 8);

  // ── 4. TOTAL ──────────────────────────────────────────────────────────────
  y += 5;
  const totalW = 70;
  const totalX = M + CW - totalW;

  setFill(doc, C.green);
  doc.roundedRect(totalX, y, totalW, 12, 2, 2, 'F');
  setTxt(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`TOTAL:  Q ${parseFloat(total).toFixed(2)}`, totalX + totalW - 4, y + 8.5, { align: 'right' });

  // ── 5. PIE DE PÁGINA ─────────────────────────────────────────────────────
  const footerY = 280;
  setStroke(doc, C.midGray);
  doc.setLineWidth(0.3);
  doc.line(M, footerY, M + CW, footerY);

  setTxt(doc, C.midGray);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Gracias por su compra  •  VolPart', PW / 2, footerY + 5, { align: 'center' });
  doc.text(`Generado el ${new Date().toLocaleString('es-GT')}`, PW / 2, footerY + 10, { align: 'center' });

  // ── Descargar ─────────────────────────────────────────────────────────────
  doc.save(`factura-${serie}.pdf`);
}
