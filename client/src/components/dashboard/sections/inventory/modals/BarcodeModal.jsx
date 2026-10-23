import { useEffect, useMemo, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { formatCOP } from '../constants';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

// Code 128 acepta letras, números y símbolos ASCII: es el que leen todos los lectores.
function barcodeSvg(value) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, value, { format: 'CODE128', displayValue: false, margin: 0, height: 60, width: 2 });
  // Escalable: se ajusta al ancho de la etiqueta sin perder proporción de barras.
  if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', `0 0 ${parseFloat(svg.getAttribute('width'))} ${parseFloat(svg.getAttribute('height'))}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'none');
  return svg.outerHTML;
}

const SIZES = {
  small: { label: '50 × 25 mm', w: 50, h: 25 },
  medium: { label: '60 × 40 mm', w: 60, h: 40 },
};

function printLabels({ product, copies, size, showPrice }) {
  const { w, h } = SIZES[size];
  const svg = barcodeSvg(product.sku);
  const label = `<div class="label">
    <p class="name">${esc(product.name)}</p>
    <div class="bars">${svg}</div>
    <p class="sku">${esc(product.sku)}</p>
    ${showPrice ? `<p class="price">${esc(formatCOP(product.sale_price))}</p>` : ''}
  </div>`;
  const win = window.open('', '_blank', 'width=480,height=640');
  if (!win) return false;
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Código ${esc(product.sku)}</title>
<style>
  @page { size: ${w}mm ${h}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; }
  .label { width: ${w}mm; height: ${h}mm; padding: 1.5mm 2.5mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-after: always; overflow: hidden; }
  .label:last-child { page-break-after: auto; }
  .name { font-size: ${size === 'small' ? 8 : 10}pt; font-weight: bold; line-height: 1.1; max-height: 2.2em; overflow: hidden; width: 100%; }
  .bars { width: 100%; flex: 1; min-height: 0; margin: 1mm 0 .5mm; }
  .bars svg { width: 100%; height: 100%; display: block; }
  .sku { font-size: ${size === 'small' ? 8 : 10}pt; letter-spacing: .08em; font-family: 'Courier New', monospace; }
  .price { font-size: ${size === 'small' ? 8 : 11}pt; font-weight: bold; }
</style></head><body>${Array.from({ length: copies }, () => label).join('')}
<script>window.onload = () => { window.focus(); window.print(); };</script></body></html>`);
  win.document.close();
  return true;
}

export default function BarcodeModal({ product, onClose }) {
  const [copies, setCopies] = useState('1');
  const [size, setSize] = useState('small');
  const [showPrice, setShowPrice] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const preview = useMemo(() => {
    try { return { svg: barcodeSvg(product.sku) }; }
    catch { return { error: 'Este SKU tiene caracteres que no se pueden convertir en código de barras. Usa solo letras, números y guiones.' }; }
  }, [product.sku]);

  const handlePrint = () => {
    const n = Number(copies);
    if (!Number.isInteger(n) || n < 1 || n > 500) return setError('Indica entre 1 y 500 etiquetas.');
    setError('');
    if (!printLabels({ product, copies: n, size, showPrice })) setError('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="barcode-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="barcode-title" className="text-lg font-bold text-gray-900">Código de barras</h2>
            <p className="text-xs text-gray-500">Etiqueta con el nombre y el SKU del producto.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">✕</button>
        </div>

        {preview.error ? (
          <p className="mt-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{preview.error}</p>
        ) : (
          <div className="mx-auto mt-5 flex w-64 flex-col items-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-center">
            <p className="w-full truncate text-sm font-bold text-gray-900">{product.name}</p>
            <div className="mt-1 h-16 w-full" dangerouslySetInnerHTML={{ __html: preview.svg }} />
            <p className="mt-1 font-mono text-sm tracking-wider text-gray-900">{product.sku}</p>
            {showPrice && <p className="text-sm font-bold text-gray-900">{formatCOP(product.sale_price)}</p>}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-gray-700">Tamaño de etiqueta
            <select value={size} onChange={(e) => setSize(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              {Object.entries(SIZES).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-gray-700">Cantidad de etiquetas
            <input type="number" min="1" max="500" step="1" value={copies} onChange={(e) => setCopies(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} /> Mostrar precio de venta
        </label>

        {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button>
          <button type="button" disabled={Boolean(preview.error)} onClick={handlePrint} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40">Imprimir etiquetas</button>
        </div>
      </div>
    </div>
  );
}
