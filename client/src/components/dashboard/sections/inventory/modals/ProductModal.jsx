import React from 'react';
import { INPUT, LABEL, UNITS, formatPriceCOP, parsePriceCOP } from '../constants';

export default function ProductModal({ modal, form, setF, categories, warehouses = [], suppliers = [], onSave, onClose, saving, error }) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />

        <div className="p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">
              {modal.mode === 'add' ? 'Nuevo producto' : 'Editar producto'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">

            {/* ── Ficha ── */}
            <div>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">Ficha del producto</p>
              <div className="space-y-3">
                <div>
                  <label className={LABEL}>Nombre *</label>
                  <input className={INPUT} value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="Ej: Camiseta básica negra" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>SKU</label>
                    <input className={INPUT} value={form.sku} onChange={(e) => setF('sku', e.target.value)} placeholder="CAM-001" />
                  </div>
                  <div>
                    <label className={LABEL}>Código de barras</label>
                    <input className={INPUT} value={form.barcode} onChange={(e) => setF('barcode', e.target.value)} placeholder="7701234567890" />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Descripción</label>
                  <textarea rows={2} className={INPUT + ' resize-none'} value={form.description} onChange={(e) => setF('description', e.target.value)} placeholder="Descripción del producto..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Categoría</label>
                    <select className={INPUT} value={form.category_id} onChange={(e) => setF('category_id', e.target.value)}>
                      <option value="">— Sin categoría —</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Unidad de medida</label>
                    <select className={INPUT} value={form.unit} onChange={(e) => setF('unit', e.target.value)}>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>URL de foto</label>
                  <input className={INPUT} value={form.photo_url} onChange={(e) => setF('photo_url', e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>

            {/* ── Stock ── */}
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Stock inicial</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'stock_available',  label: 'Disponible' },
                  { key: 'stock_reserved',   label: 'Reservado'  },
                  { key: 'stock_in_transit', label: 'En tránsito' },
                  { key: 'stock_min',        label: 'Mínimo ⚠'   },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className={LABEL}>{label}</label>
                    <input type="number" min="0" className={INPUT} value={form[key]} onChange={(e) => setF(key, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={LABEL}>Ubicación / Bodega</label>
                  {warehouses.length > 0 ? (
                    <select className={INPUT} value={form.stock_location} onChange={(e) => setF('stock_location', e.target.value)}>
                      <option value="">— Sin especificar —</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.name}>{w.name}{w.address ? ` · ${w.address}` : ''}</option>
                      ))}
                    </select>
                  ) : (
                    <input className={INPUT} value={form.stock_location} onChange={(e) => setF('stock_location', e.target.value)} placeholder="Ej: Bodega A, Estante 3" />
                  )}
                </div>
                <div>
                  <label className={LABEL}>Proveedor principal</label>
                  <select className={INPUT} value={form.supplier_id} onChange={(e) => setF('supplier_id', e.target.value)}>
                    <option value="">— Sin especificar —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Precios ── */}
            <div>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3">Precios y costos</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={LABEL}>Precio de compra</label>
                  <input type="text" inputMode="numeric" className={INPUT}
                    value={formatPriceCOP(form.purchase_price)}
                    onChange={(e) => setF('purchase_price', parsePriceCOP(e.target.value))}
                    placeholder="0" />
                </div>
                <div>
                  <label className={LABEL}>Precio de venta</label>
                  <input type="text" inputMode="numeric" className={INPUT}
                    value={formatPriceCOP(form.sale_price)}
                    onChange={(e) => setF('sale_price', parsePriceCOP(e.target.value))}
                    placeholder="0" />
                </div>
                <div>
                  <label className={LABEL}>IVA (%)</label>
                  <input type="number" min="0" max="100" className={INPUT} value={form.tax_rate} onChange={(e) => setF('tax_rate', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Activo */}
            <label className="flex items-center gap-2 select-none cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setF('is_active', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400" />
              <span className="text-xs text-gray-600">Producto activo (visible en el catálogo)</span>
            </label>

            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6">
            <button onClick={onSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm transition disabled:opacity-60">
              {saving ? 'Guardando...' : modal.mode === 'add' ? 'Crear producto' : 'Actualizar'}
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
