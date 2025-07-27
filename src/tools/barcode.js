// src/utils/pdfBarcode.js
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';

/**
 * Genera y descarga un PDF con:
 * - Un borde alrededor de todo el contenido
 * - El logo perfectamente centrado arriba
 * - El código de barras centrado justo debajo
 * - Texto del código centrado al pie
 *
 * @param {string} code      Texto a codificar.
 * @param {string} logoUrl   URL o import de tu logo (PNG/JPEG).
 * @param {string} [fileName] Nombre de archivo por defecto: "barcode_<code>.pdf".
 */
export function generatePdfWithBarcode(code, logoUrl, fileName) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin     = 40;
  const contentW   = pageWidth - margin * 2;

  // 1) Dibujar marco
  doc.setLineWidth(1);
  doc.rect(margin, margin, contentW, pageHeight - margin * 2);

  // 2) Logo centrado
  const logoW = 120;
  const logoH = 60;
  const logoX = margin + (contentW - logoW) / 2;
  const logoY = margin + 20;
  doc.addImage(logoUrl, 'PNG', logoX, logoY, logoW, logoH);

  // 3) Generar barcode en un canvas
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, code, {
    format: 'CODE128',
    displayValue: true,
    height: 50,
    margin: 10,
  });
  const barcodeDataUrl = canvas.toDataURL('image/png');

  // 4) Dibujar barcode centrado
  const barcodeW = contentW * 0.8;   // 80% del ancho del contenido
  const barcodeH = 80;
  const barcodeX = margin + (contentW - barcodeW) / 2;
  const barcodeY = logoY + logoH + 40;
  doc.addImage(barcodeDataUrl, 'PNG', barcodeX, barcodeY, barcodeW, barcodeH);

  // 5) Texto del código centrado
  doc.setFontSize(14);
  const textY = barcodeY + barcodeH + 30;
  doc.text(`Código: ${code}`, pageWidth / 2, textY, { align: 'center' });

  // 6) Disparar diálogo de descarga
  doc.save(fileName || `barcode_${code}.pdf`);
}
