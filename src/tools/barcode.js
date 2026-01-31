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
export function generatePdfWithBarcode(code, price, logoUrl, fileNameOrCount) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  // Página carta
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // === Grid fijo: 3 columnas x 10 filas ===
  const margin = 30;     // ajustable
  const gridCols = 3;
  const gridRows = 10;
  const gapX = 10;       // separación horizontal
  const gapY = 5.1;        // separación vertical

  // Utilidad: mm → puntos (1 in = 25.4 mm, 1 in = 72 pt)
  const mmToPt = (mm) => (mm * 72) / 25.4;

  // Desfase por columna (col 0, 1, 2):
  //   - primera columna: un poco a la izquierda
  //   - segunda: sin cambio
  //   - tercera: un poco a la derecha
  // Ajusta los mm si lo necesitas (-1, 0, +1 es un buen inicio)
  const colNudge = [
    -mmToPt(2),  // columna 0
     0,          // columna 1
    +mmToPt(1),  // columna 2
  ];



  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;

  // Tamaño del sticker derivado del grid
  const stickerW = Math.floor((contentW - gapX * (gridCols - 1)) / gridCols);
  const stickerH = Math.floor((contentH - gapY * (gridRows - 1)) / gridRows);
  const pad = 6;

  // Tipografía
  const textFontSize = 9;

  // Archivo o cantidad
  let fileName = `barcode_${code}.pdf`;
  let count = 1;
  if (typeof fileNameOrCount === 'string' && fileNameOrCount.trim()) {
    fileName = fileNameOrCount.trim();
  } else if (typeof fileNameOrCount === 'number' && isFinite(fileNameOrCount)) {
    count = Math.max(1, Math.floor(fileNameOrCount));
  }

  // Marco (opcional)
  // const drawPageFrame = () => {
  //   doc.setLineWidth(0.8);
  //   doc.rect(margin, margin, contentW, contentH);
  // };
  // drawPageFrame();

  // Barcode en dataURL (reutilizable)
  const makeBarcodeDataUrl = (targetW, targetH) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(140, targetW * 2);    // @2x nitidez
    canvas.height = Math.max(35, targetH * 2);

    JsBarcode(canvas, String(code), {
      format: 'CODE128',
      displayValue: true,
      margin: 0,
      height: canvas.height * 0.75,
      lineColor: '#000',
      background: '#fff',
      width: Math.max(1, Math.round(canvas.width / 140)),
    });
    return canvas.toDataURL('image/png');
  };

  // Layout interno (logo IZQ, barcode DER, precio abajo)
  const innerW = stickerW - pad * 2;
  const innerH = stickerH - pad * 2;

  const logoBox = Math.min(44, Math.floor(innerH * 0.65)); // logo un poco más pequeño
  const logoGap = 6;

  const priceLine = textFontSize + 3;
  const barcodeW = Math.max(60, innerW - logoBox - logoGap);
  const barcodeH = Math.max(36, innerH - priceLine - 2);

  const barcodeDataUrl = makeBarcodeDataUrl(barcodeW, barcodeH);

  const drawSticker = (x, y) => {
    const ix = x + pad;
    const iy = y + 1;

    // (opcional) borde del sticker
    // doc.setLineWidth(0.3); doc.rect(x, y, stickerW, stickerH);

    if (logoUrl) {
      const logoX = ix;
      const logoY = iy ;
      doc.addImage(logoUrl, 'PNG', logoX, logoY, logoBox, logoBox,);
    }

    const bcX = ix + logoBox + logoGap;
    const bcY = iy;
    doc.addImage(barcodeDataUrl, 'PNG', bcX, bcY, barcodeW, barcodeH);

    doc.setFontSize(textFontSize);
    const centerX = x + stickerW / 2;
    const textY = iy + barcodeH + Math.max(8, innerH - barcodeH - 2);
    //doc.text(`Q. ${price}`, centerX, textY, { align: 'center', baseline: 'alphabetic' });
  };

  const perPage = gridCols * gridRows; // 30 por página

  for (let i = 0; i < count; i++) {
    const idx = i % perPage;
    const row = Math.floor(idx / gridCols);
    const col = idx % gridCols;

    if (i > 0 && idx === 0) {
      doc.addPage();
      drawPageFrame();
    }

    const baseX = margin + col * (stickerW + gapX);
    const cellX = baseX + (colNudge[col] || 0); 
    const cellY = margin + row * (stickerH + gapY);
    drawSticker(cellX, cellY);
  }

  doc.save(fileName);
}
