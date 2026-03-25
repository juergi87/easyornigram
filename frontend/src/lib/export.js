import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

function inlineEdgeStyles(flowEl) {
  const svgProps = ['stroke', 'stroke-width', 'stroke-opacity', 'fill', 'fill-opacity', 'stroke-dasharray'];
  const els = flowEl.querySelectorAll('.react-flow__edge-path, .react-flow__connection-path, .react-flow__edge-interaction');
  const originals = [];
  els.forEach(el => {
    const computed = window.getComputedStyle(el);
    originals.push(el.getAttribute('style') || '');
    svgProps.forEach(prop => {
      const val = computed.getPropertyValue(prop);
      if (val) el.style.setProperty(prop, val);
    });
  });
  return () => els.forEach((el, i) => {
    if (originals[i]) el.setAttribute('style', originals[i]);
    else el.removeAttribute('style');
  });
}

export async function exportPNG(flowEl) {
  const restore = inlineEdgeStyles(flowEl);
  try {
    const dataUrl = await toPng(flowEl, { backgroundColor: null, pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = 'organigramm.png';
    link.href = dataUrl;
    link.click();
  } finally {
    restore();
  }
}

export async function exportPDF(flowEl, format = 'a4') {
  const restore = inlineEdgeStyles(flowEl);
  const dataUrl = await toPng(flowEl, { backgroundColor: '#ffffff', pixelRatio: 2 });
  restore();

  const isA3 = format === 'a3';
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: isA3 ? 'a3' : 'a4'
  });

  const pdfW = isA3 ? 420 : 297;
  const pdfH = isA3 ? 297 : 210;

  const img = new Image();
  img.src = dataUrl;
  await new Promise(r => { img.onload = r; });

  const ratio = Math.min(pdfW / img.width, pdfH / img.height);
  const w = img.width * ratio;
  const h = img.height * ratio;
  const x = (pdfW - w) / 2;
  const y = (pdfH - h) / 2;

  pdf.addImage(dataUrl, 'PNG', x, y, w, h);
  pdf.save(`organigramm-${format}.pdf`);
}
