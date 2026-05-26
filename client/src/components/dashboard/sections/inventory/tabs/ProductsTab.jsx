import React, { useState } from 'react';
import { formatCOP, getStockStatus } from '../constants';

export default function ProductsTab({ products, categories, onEdit, onDelete, onAdjustStock, onToggle, deleting }) {
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatus] = useState('all');

  const filtered = products.filter((p) => {
    if (statusFilter === 'active'   && !p.is_active) return false;
    if (statusFilter === 'inactive' &&  p.is_active) return false;
    if (catFilter !== 'all' && p.category_id !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return [p.name, p.sku, p.barcode, p.description].some((v) => (v ?? '').toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU, código de barras..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-300">
          <option value="all">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-300">
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
          <span className="text-4xl mb-3">📦</span>
          <p className="text-gray-700 font-semibold">{search ? 'Sin resultados' : 'Aún no hay productos'}</p>
          <p className="text-xs text-gray-400 mt-1">Crea tu primer producto para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const st  = getStockStatus(p.stock_available, p.stock_min);
            const cat = p.bapesu_inventory_categories;
            return (
              <div key={p.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition ${p.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>

                {/* Foto */}
                <div className="relative h-36 bg-gray-100 flex items-center justify-center">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-300">
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                      <span className="text-xs">Sin foto</span>
                    </div>
                  )}
                  {cat && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: cat.color }}>
                      {cat.name}
                    </span>
                  )}
                  <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.color}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${st.dot}`} />
                    {st.label}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                      {p.sku && <p className="text-[11px] text-gray-400 mt-0.5">SKU: {p.sku}</p>}
                    </div>
                    <p className="text-base font-extrabold text-indigo-600 flex-shrink-0">{formatCOP(p.sale_price)}</p>
                  </div>
                  {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.description}</p>}

                  {/* Stock */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v2l8 8 8-8V3zM4 21h16v-2l-8-8-8 8v2z"/></svg>
                      {p.stock_available ?? 0} disp.
                    </span>
                    {p.stock_reserved > 0 && <span className="text-amber-600">{p.stock_reserved} reservado</span>}
                    {p.stock_location && <span className="truncate">📍 {p.stock_location}</span>}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => onAdjustStock(p)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-semibold transition">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>
                      Stock
                    </button>
                    <button onClick={() => onEdit(p)}
                      className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center transition">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button onClick={() => onToggle(p)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${p.is_active ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d={p.is_active ? 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z' : 'M8 5v14l11-7z'}/></svg>
                    </button>
                    <button onClick={() => onDelete(p.id)} disabled={deleting === p.id}
                      className="w-8 h-8 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition disabled:opacity-40">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
