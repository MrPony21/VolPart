import jsPDF from 'jspdf';
import logoUrl from '../assets/logonuevo.jpg';
import { setFill, setStroke, setTxt } from './documentoPdf';

// La cotización tiene hoja propia, no es la factura con otro título.
//
// Antes compartían layout y solo cambiaba el encabezado: de lejos, o impresas
// en blanco y negro, eran indistinguibles. Aquí todo lo estructural cambia —
// barra lateral en vez de banda superior, marca de agua en diagonal, tabla sin
// zebra, total a lo ancho y un bloque de condiciones — para que nadie confunda
// una propuesta con un cobro.

// Paleta ámbar/carbón, distinta del azul marino y verde de la factura. El
// ámbar es el mismo lenguaje de color que el estado "Pendiente" del módulo.
const C = {
  tinta:       [51,  58,  69],   // carbón, texto y estructura
  tintaSuave:  [110, 120, 132],
  ambar:       [199, 119,   0],  // acento
  ambarClaro:  [253, 244, 227],  // fondos suaves
  linea:       [222, 226, 230],
  blanco:      [255, 255, 255],
  marcaAgua:   [242, 240, 236],
};

const PW = 210;   // ancho A4
const PH = 297;   // alto A4
const BARRA = 6;  // barra de acento pegada al borde izquierdo
const M = 18;     // margen de contenido, libra la barra
const MD = 14;    // margen derecho
const CW = PW - M - MD;

const COLS = [
  { label: '#',           w: 8,  align: 'center' },
  { label: 'Código',      w: 24, align: 'left'   },
  { label: 'Descripción', w: 76, align: 'left'   },
  { label: 'Cant.',       w: 16, align: 'center' },
  { label: 'Precio',      w: 27, align: 'right'  },
  { label: 'Subtotal',    w: 27, align: 'right'  },
];

// x acumulada de cada columna
let acumulado = M;
const COLS_X = COLS.map((col) => {
  const x = acumulado;
  acumulado += col.w;
  return { ...col, x };
});

const ALTO_FILA = 8;
const LIMITE_FILAS = 244; // desde aquí, la tabla salta de página

function textoCelda(doc, valor, col, y) {
  const x = col.align === 'right'  ? col.x + col.w - 2
          : col.align === 'center' ? col.x + col.w / 2
          : col.x + 2;
  doc.text(String(valor), x, y, { align: col.align });
}

/** Barra lateral y marca de agua: se repiten en cada página. */
function fondoPagina(doc) {
  setFill(doc, C.ambar);
  doc.rect(0, 0, BARRA, PH, 'F');

  // La marca de agua va primero para que quede debajo de todo. Por eso la
  // tabla no lleva relleno por fila: si lo llevara, la taparía.
  setTxt(doc, C.marcaAgua);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(64);
  doc.text('COTIZACIÓN', PW / 2 - 10, 205, { align: 'center', angle: 32 });
}

/** Fila de encabezados de la tabla. Devuelve la y de la primera fila de datos. */
function encabezadoTabla(doc, y) {
  setFill(doc, C.ambarClaro);
  doc.rect(M, y, CW, 9, 'F');

  setStroke(doc, C.ambar);
  doc.setLineWidth(0.6);
  doc.line(M, y + 9, M + CW, y + 9);

  setTxt(doc, C.tinta);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  COLS_X.forEach((col) => textoCelda(doc, col.label, col, y + 6));

  return y + 9;
}

/**
 * Genera y descarga el PDF de una cotización.
 *
 * @param {object} params
 * @param {string} params.numeroSerie      - COT-<id> que devuelve el API
 * @param {number} params.codigoCotizacion - Código de la cotización (fallback)
 * @param {object} params.cliente          - { nit, nombre, telefono, direccion }
 * @param {Array}  params.items            - [{ codigo, descripcion, cantidad, precio }]
 * @param {number} params.total
 * @param {string} params.nombreSucursal
 */
export function generarCotizacionPDF({
  numeroSerie,
  codigoCotizacion,
  cliente,
  items,
  total,
  nombreSucursal,
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const serie = numeroSerie ?? `#${codigoCotizacion ?? Date.now()}`;
  const ahora = new Date();

  fondoPagina(doc);

  // ── 1. ENCABEZADO ─────────────────────────────────────────────────────────
  // Sin banda oscura: el peso visual lo lleva la barra lateral.
  try {
    doc.addImage(logoUrl, 'JPEG', M, 12, 28, 22);
  } catch (_) { /* si falla el logo, continúa */ }

  setTxt(doc, C.tinta);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('COTIZACIÓN', PW - MD, 24, { align: 'right' });

  setStroke(doc, C.ambar);
  doc.setLineWidth(1.2);
  doc.line(PW - MD - 62, 28, PW - MD, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setTxt(doc, C.ambar);
  doc.text(serie, PW - MD, 36, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setTxt(doc, C.tintaSuave);
  doc.text(
    `${ahora.toLocaleDateString('es-GT')}  ${ahora.toLocaleTimeString('es-GT')}`,
    PW - MD, 41, { align: 'right' },
  );
  if (nombreSucursal) {
    doc.text(`Sucursal: ${nombreSucursal}`, PW - MD, 46, { align: 'right' });
  }

  // ── 2. CLIENTE ────────────────────────────────────────────────────────────
  let y = 60;

  const tituloSeccion = (texto, ty) => {
    setTxt(doc, C.ambar);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(texto.toUpperCase(), M, ty);
    setStroke(doc, C.linea);
    doc.setLineWidth(0.3);
    doc.line(M, ty + 2.5, M + CW, ty + 2.5);
  };

  // Etiquetas y valores sueltos sobre el fondo, sin recuadro relleno: deja ver
  // la marca de agua y aligera la hoja frente a la factura.
  const dato = (etiqueta, valor, x, dy) => {
    setTxt(doc, C.tintaSuave);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(etiqueta.toUpperCase(), x, dy);
    setTxt(doc, C.tinta);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(String(valor || '-'), x, dy + 5);
  };

  tituloSeccion('Cliente', y);
  const colIzq = M;
  const colDer = M + CW / 2;
  dato('NIT',       cliente?.nit,       colIzq, y + 10);
  dato('Nombre',    cliente?.nombre,     colDer, y + 10);
  dato('Teléfono',  cliente?.telefono,   colIzq, y + 24);
  dato('Dirección', cliente?.direccion,  colDer, y + 24);

  // ── 3. DETALLE ────────────────────────────────────────────────────────────
  y += 38;
  tituloSeccion('Detalle de productos', y);
  y = encabezadoTabla(doc, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  items.forEach((item, idx) => {
    if (y + ALTO_FILA > LIMITE_FILAS) {
      doc.addPage();
      fondoPagina(doc);
      y = encabezadoTabla(doc, 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }

    const precio = parseFloat(item.precio ?? 0);
    const cantidad = item.cantidad ?? 1;
    const nombre = String(item.descripcion ?? '-');

    setTxt(doc, C.tinta);
    const valores = [
      idx + 1,
      item.codigo ?? '-',
      nombre.length > 46 ? `${nombre.slice(0, 43)}...` : nombre,
      cantidad,
      `Q ${precio.toFixed(2)}`,
      `Q ${(precio * cantidad).toFixed(2)}`,
    ];
    COLS_X.forEach((col, i) => textoCelda(doc, valores[i], col, y + 5.5));

    // Solo una línea fina separando; sin zebra, para no tapar la marca de agua.
    setStroke(doc, C.linea);
    doc.setLineWidth(0.1);
    doc.line(M, y + ALTO_FILA, M + CW, y + ALTO_FILA);

    y += ALTO_FILA;
  });

  // ── 4. TOTAL ──────────────────────────────────────────────────────────────
  // Banda a todo el ancho, no el recuadro pequeño de la factura.
  if (y + 46 > PH - 20) {
    doc.addPage();
    fondoPagina(doc);
    y = 24;
  }

  y += 6;
  setFill(doc, C.tinta);
  doc.rect(M, y, CW, 15, 'F');

  setTxt(doc, C.blanco);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('TOTAL COTIZADO', M + 5, y + 9.5);

  setTxt(doc, C.ambar);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`Q ${parseFloat(total).toFixed(2)}`, M + CW - 5, y + 10.5, { align: 'right' });

  // ── 5. CONDICIONES ────────────────────────────────────────────────────────
  // Lo que de verdad separa una cotización de una factura, dicho en la hoja.
  y += 23;
  setFill(doc, C.ambarClaro);
  doc.rect(M, y, CW, 26, 'F');
  setStroke(doc, C.ambar);
  doc.setLineWidth(0.5);
  doc.line(M, y, M, y + 26);

  setTxt(doc, C.ambar);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CONDICIONES', M + 5, y + 6.5);

  setTxt(doc, C.tinta);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  [
    'Este documento es una cotización: no constituye una venta ni un comprobante de pago.',
    'Los precios aquí detallados se respetan al momento de facturar esta cotización.',
    'La existencia no queda reservada y está sujeta a disponibilidad al facturar.',
  ].forEach((linea, i) => {
    doc.text('•', M + 5, y + 13 + i * 5);
    doc.text(linea, M + 9, y + 13 + i * 5);
  });

  // ── 6. PIE ────────────────────────────────────────────────────────────────
  const pieY = PH - 17;
  setStroke(doc, C.linea);
  doc.setLineWidth(0.3);
  doc.line(M, pieY, M + CW, pieY);

  setTxt(doc, C.tintaSuave);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('VolPart', M, pieY + 5);
  doc.text(`Generado el ${ahora.toLocaleString('es-GT')}`, PW - MD, pieY + 5, { align: 'right' });

  doc.save(`cotizacion-${serie}.pdf`);
}
