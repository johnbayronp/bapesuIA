import React from 'react';
import { INPUT, LABEL, getStockStatus } from '../constants';

const TYPES = [
  { id: 'entrada', label: 'Entrada',  desc: 'Suma al stock disponible', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { id: 'salida',  label: 'Salida',   desc: 'Resta del stock disponible', color: 'bg-red-100 text-red-600 border-red-300' },
  { id: 'ajuste',  label: 'Ajuste',   desc: 'Establece el stock exacto', color: 'bg-blue-100 text-blue-600 border-blue-300' },
];

export default function StockAdjustModal({ product, form, setSF, onSave, onClose, saving, error }) {
  if (!product) return null;

  const st = getStockStatus(product.stock_available, product.stock_min);

  const preview = () => {
    const qty = parseFloat(form.quantity) || 0;
    const cur = Number(product.stock_available) || 0;
    if (form.type === 'entrada') return cur + qty;
    if (form.type === 'salida')  return Math.max(cur - qty, 0);
    return qty;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Ajustar stock</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info del producto */}
          <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            {product.photo_url ? (
              <img src={product.photo_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-sm">
                {product.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${st.color}`}>
                  Stock actual: {product.stock_available ?? 0} {product.unit}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Tipo */}
            <div>
              <label className={LABEL}>Tipo de movimiento</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((t) => (
                  <button key={t.id} type="button" onClick={() => setSF('type', t.id)}
                    className={`py-2 px-2 rounded-xl border-2 text-xs font-semibold transition text-center ${
                      form.type === t.id ? t.color + ' border-current' : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
                    }`}>
                    {t.label}
                    <p className="text-[9px] font-normal mt-0.5 opacity-70 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad */}
            <div>
              <label className={LABEL}>
                {form.type === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
              </label>
              <input type="number" min="0.001" step="0.001" className={INPUT} value={form.quantity}
                onChange={(e) => setSF('quantity', e.target.value)} placeholder="0" autoFocus />
            </div>

            {/* Preview */}
            {form.quantity > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-xs">
                <span className="text-gray-500">Stock resultante:</span>
                <span className="font-bold text-indigo-700">{preview()} {product.unit}</span>
              </div>
            )}

            {/* Notas */}
            <div>
              <label className={LABEL}>Notas (opcional)</label>
              <input className={INPUT} value={form.notes} onChange={(e) => setSF('notes', e.target.value)} placeholder="Ej: Compra proveedor X, Venta factura #002..." />
            </div>

            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={onSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-sm transition disabled:opacity-60">
              {saving ? 'Guardando...' : 'Registrar movimiento'}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
