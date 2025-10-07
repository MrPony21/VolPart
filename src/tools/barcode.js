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
export function generatePdfWithBarcode(code, logoUrl, fileNameOrCount) {
  // === Configuración de página y “sticker” (en puntos; 72 pt = 1 in) ===
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth  = doc.internal.pageSize.getWidth();   // 612 pt (8.5 in)
  const pageHeight = doc.internal.pageSize.getHeight();  // 792 pt (11 in)
  const margin     = 40;

  // Marco general (como en tu plantilla)
  const contentW   = pageWidth - margin * 2;
  const contentH   = pageHeight - margin * 2;

  // Tamaño del sticker (pequeño para etiquetas)
  const stickerW   = 180;  // ~2.5 in
  const stickerH   = 120;  // ~1.67 in
  const gapX       = 10;   // separación horizontal entre stickers
  const gapY       = 10;   // separación vertical entre stickers
  const pad        = 6;    // padding interno del sticker

  // Layout interno del sticker
  const logoW      = 90;   // ancho del logo dentro del sticker
  const logoH      = 60;   // alto del logo
  const gapAfterLogo   = 10;
  const barcodeH       = 50; // alto del código de barras
  const gapAfterBarcode= 8;
  const textFontSize   = 10;

  // === Tercer parámetro: archivo o cantidad ===
  let fileName = `barcode_${code}.pdf`;
  let count = 1;
  if (typeof fileNameOrCount === 'string' && fileNameOrCount.trim()) {
    fileName = fileNameOrCount.trim();
  } else if (typeof fileNameOrCount === 'number' && isFinite(fileNameOrCount)) {
    count = Math.max(1, Math.floor(fileNameOrCount));
  }

  // Cálculo de columnas/filas que caben en el área con marco
  const cols = Math.max(1, Math.floor((contentW + gapX) / (stickerW + gapX)));
  const rows = Math.max(1, Math.floor((contentH + gapY) / (stickerH + gapY)));
  const perPage = Math.max(1, cols * rows);

  // Función para dibujar el marco de la página (como tu paso 1)
  const drawPageFrame = () => {
    doc.setLineWidth(1);
    doc.rect(margin, margin, contentW, contentH);
  };

  drawPageFrame();

  // Preparamos el barcode como dataURL (mismo para todos los stickers)
  const makeBarcodeDataUrl = () => {
    const canvas = document.createElement('canvas');
    // Para mejor nitidez, generamos un poco más ancho que el destino (x2)
    const targetW = Math.floor((stickerW - pad * 2) * 0.95);
    canvas.width  = targetW * 2;
    canvas.height = barcodeH * 2;

    JsBarcode(canvas, String(code), {
      format: 'CODE128',
      displayValue: true,    // como en tu plantilla
      margin: 0,
      height: canvas.height, // ocupa el alto completo del canvas
      lineColor: '#000',
      background: '#fff',
      // ancho de barra heurístico: quepan muchas barras y sea nítido
      width: Math.max(1, Math.round(canvas.width / 120)),
    });
    return canvas.toDataURL('image/png');
  };

  const barcodeDataUrl = makeBarcodeDataUrl();

  // Dibuja un sticker (logo + barcode + texto) en (x,y)
  const drawSticker = (x, y) => {
    // (opcional) borde del sticker para referencia visual fina
    // doc.setLineWidth(0.5); doc.rect(x, y, stickerW, stickerH);

    const innerX = x + pad;
    const innerY = y + pad;
    const innerW = stickerW - pad * 2;
    const innerH = stickerH - pad * 2;

    // Logo centrado
    const logoX = innerX + (innerW - logoW) / 2;
    const logoY = innerY;
    if (logoUrl) {
      // Usa el mismo tipo 'PNG' que tu plantilla (asumiendo dataURL/PNG válido)
      doc.addImage(logoUrl, 'PNG', logoX, logoY, Math.min(logoW, innerW), logoH);
    }

    // Barcode centrado debajo del logo
    const barcodeW = innerW * 0.95; // 95% del ancho interno
    const barcodeX = innerX + (innerW - barcodeW) / 2;
    const barcodeY = logoY + logoH + gapAfterLogo;
    doc.addImage(barcodeDataUrl, 'PNG', barcodeX, barcodeY, barcodeW, barcodeH);

    // Texto centrado al pie del sticker
    doc.setFontSize(textFontSize);
    const textY = barcodeY + barcodeH + gapAfterBarcode + textFontSize; // baseline
    const centerX = x + stickerW / 2;
  
  };

  for (let i = 0; i < count; i++) {
    const indexInPage = i % perPage;
    const row = Math.floor(indexInPage / cols);
    const col = indexInPage % cols;

    if (i > 0 && indexInPage === 0) {
      doc.addPage();
      drawPageFrame();
    }

    const cellX = margin + col * (stickerW + gapX);
    const cellY = margin + row * (stickerH + gapY);

    drawSticker(cellX, cellY);
  }

  // Guardar (como en tu paso 6)
  doc.save(fileName);
}


