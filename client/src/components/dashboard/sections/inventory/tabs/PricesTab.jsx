import React, { useState } from 'react';
import { formatCOP, getMargin } from '../constants';

export default function PricesTab({ products, onEdit }) {
  const [search, setSearch] = useState('');
  const [sort, setSort]     = useState('name');

  const filtered = products
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [p.name, p.sku].some((v) => (v ?? '').toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sort === 'sale_asc')  return a.sale_price - b.sale_price;
      if (sort === 'sale_desc') return b.sale_price - a.sale_price;
      if (sort === 'margin')    return getMargin(b.purchase_price, b.sale_price) - getMargin(a.purchase_price, a.sale_price);
      return a.name.localeCompare(b.name);
    });

  const totalInventoryValue = products.reduce((a, p) => a + (p.stock_available ?? 0) * (Number(p.purchase_price) || 0), 0);
  const avgMargin = products.length > 0
    ? Math.round(products.reduce((a, p) => a + getMargin(p.purchase_price, p.sale_price), 0) / products.length)
    : 0;

  return (
    <div className="space-y-5">
      {/* KPIs precios */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Valor inventario (costo)', value: formatCOP(totalInventoryValue), color: 'from-indigo-400 to-violet-500', icon: '💼' },
          { label: 'Margen promedio',          value: `${avgMargin}%`,                color: 'from-emerald-400 to-teal-500',  icon: '📈' },
          { label: 'Productos con precio',     value: products.filter((p) => p.sale_price > 0).length, color: 'from-amber-400 to-yellow-500', icon: '🏷️' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-base flex-shrink-0`}>{k.icon}</div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{k.label}</p>
              <p className="text-base font-extrabold text-gray-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-300">
          <option value="name">Ordenar por nombre</option>
          <option value="sale_asc">Precio ↑</option>
          <option value="sale_desc">Precio ↓</option>
          <option value="margin">Mayor margen</option>
        </select>
      </div>

      {/* Tabla de precios */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
          <div className="col-span-4">Producto</div>
          <div className="col-span-2 text-right">Costo</div>
          <div className="col-span-2 text-right">Precio venta</div>
          <div className="col-span-1 text-right">IVA</div>
          <div className="col-span-1 text-right">Margen</div>
          <div className="col-span-2 text-right">P. con IVA</div>
        </div>
        <div className="divide-y divide-gray-100">
          {filtered.map((p) => {
            const margin    = getMargin(p.purchase_price, p.sale_price);
            const priceIva  = Number(p.sale_price) * (1 + Number(p.tax_rate ?? 0) / 100);
            const isGoodMrg = margin >= 30;
            const isBadMrg  = margin < 10 && margin > 0;
            return (
              <div key={p.id} className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-gray-50 transition cursor-pointer" onClick={() => onEdit(p)}>
                <div className="col-span-8 md:col-span-4 flex items-center gap-3 min-w-0">
                  {p.photo_url
                    ? <img src={p.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center flex-shrink-0">{p.name?.[0]}</div>
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    {p.sku && <p className="text-[10px] text-gray-400">SKU: {p.sku}</p>}
                  </div>
                </div>
                <div className="hidden md:block col-span-2 text-right text-xs text-gray-500">{formatCOP(p.purchase_price)}</div>
                <div className="hidden md:block col-span-2 text-right font-bold text-gray-900 text-sm">{formatCOP(p.sale_price)}</div>
                <div className="hidden md:block col-span-1 text-right text-xs text-gray-400">{p.tax_rate ?? 0}%</div>
                <div className="hidden md:block col-span-1 text-right">
                  <span className={`text-xs font-bold ${isGoodMrg ? 'text-emerald-600' : isBadMrg ? 'text-red-500' : 'text-gray-600'}`}>
                    {margin}%
                  </span>
                </div>
                <div className="col-span-4 md:col-span-2 text-right text-sm font-extrabold text-indigo-600">{formatCOP(priceIva)}</div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center">Haz clic en cualquier producto para editar sus precios</p>
    </div>
  );
}
