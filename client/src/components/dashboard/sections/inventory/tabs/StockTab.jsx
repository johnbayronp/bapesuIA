import React, { useState } from 'react';
import { getStockStatus } from '../constants';

export default function StockTab({ products, movements, onAdjustStock }) {
  const [filter, setFilter] = useState('all');

  const filtered = products.filter((p) => {
    if (filter === 'low')  return p.stock_available > 0 && p.stock_available <= (p.stock_min ?? 0);
    if (filter === 'out')  return p.stock_available <= 0;
    if (filter === 'ok')   return p.stock_available > (p.stock_min ?? 0);
    return true;
  });

  const totalValue = products.reduce((a, p) => a + (p.stock_available ?? 0) * (Number(p.purchase_price) || 0), 0);
  const outOfStock = products.filter((p) => p.stock_available <= 0).length;
  const lowStock   = products.filter((p) => p.stock_available > 0 && p.stock_available <= (p.stock_min ?? 0)).length;

  const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="space-y-5">
      {/* KPIs stock */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Valor en inventario', value: formatCOP(totalValue), icon: '💰', color: 'from-indigo-400 to-violet-500' },
          { label: 'Total productos',     value: products.length,        icon: '📦', color: 'from-blue-400 to-indigo-500' },
          { label: 'Sin stock',           value: outOfStock,             icon: '🔴', color: 'from-red-400 to-rose-500' },
          { label: 'Stock bajo',          value: lowStock,               icon: '⚠️', color: 'from-yellow-400 to-amber-500' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-base flex-shrink-0`}>
              {k.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{k.label}</p>
              <p className="text-base font-extrabold text-gray-900 truncate">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {(outOfStock > 0 || lowStock > 0) && (
        <div className="flex flex-wrap gap-2">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {outOfStock} producto{outOfStock !== 1 ? 's' : ''} sin stock
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-700 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {lowStock} producto{lowStock !== 1 ? 's' : ''} con stock bajo
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {[['all','Todos'],['ok','En stock'],['low','Stock bajo'],['out','Sin stock']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${filter === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Tabla de stock */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
          <div className="col-span-4">Producto</div>
          <div className="col-span-1 text-center">Disp.</div>
          <div className="col-span-1 text-center">Reserv.</div>
          <div className="col-span-1 text-center">Tránsito</div>
          <div className="col-span-1 text-center">Mínimo</div>
          <div className="col-span-2">Ubicación</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-1 text-right">Acc.</div>
        </div>
        <div className="divide-y divide-gray-100">
          {filtered.map((p) => {
            const st = getStockStatus(p.stock_available, p.stock_min);
            return (
              <div key={p.id} className="grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-gray-50 transition">
                <div className="col-span-8 md:col-span-4 flex items-center gap-3 min-w-0">
                  {p.photo_url
                    ? <img src={p.photo_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-xs">{p.name?.[0]}</div>
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    {p.sku && <p className="text-[10px] text-gray-400">SKU: {p.sku}</p>}
                  </div>
                </div>
                <div className="hidden md:block col-span-1 text-center">
                  <span className={`text-sm font-bold ${p.stock_available <= 0 ? 'text-red-600' : 'text-gray-900'}`}>{p.stock_available ?? 0}</span>
                  {p.unit && <span className="text-[10px] text-gray-400 ml-0.5">{p.unit}</span>}
                </div>
                <div className="hidden md:block col-span-1 text-center text-xs text-amber-600 font-medium">
                  {p.stock_reserved ?? 0}{p.unit && <span className="text-[10px] text-amber-400 ml-0.5">{p.unit}</span>}
                </div>
                <div className="hidden md:block col-span-1 text-center text-xs text-blue-600 font-medium">
                  {p.stock_in_transit ?? 0}{p.unit && <span className="text-[10px] text-blue-400 ml-0.5">{p.unit}</span>}
                </div>
                <div className="hidden md:block col-span-1 text-center text-xs text-gray-400">
                  {p.stock_min ?? 0}{p.unit && <span className="text-[10px] text-gray-300 ml-0.5">{p.unit}</span>}
                </div>
                <div className="hidden md:block col-span-2 text-xs text-gray-500 truncate">{p.stock_location ?? '—'}</div>
                <div className="col-span-3 md:col-span-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${st.color}`}>{st.label}</span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => onAdjustStock(p)}
                    className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center transition" title="Ajustar stock">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Últimos movimientos */}
      {movements.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Últimos movimientos</h3>
          <div className="space-y-2">
            {movements.slice(0, 10).map((m) => {
              const isIn = m.quantity > 0;
              return (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-emerald-100 text-emerald-600' : m.type === 'ajuste' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      {isIn ? <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/> : <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{m.bapesu_products?.name ?? '—'}</p>
                    {m.notes && <p className="text-[10px] text-gray-400 truncate">{m.notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${isIn ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isIn ? '+' : ''}{m.quantity}
                      {m.bapesu_products?.unit && <span className="text-[10px] font-normal ml-0.5 opacity-70">{m.bapesu_products.unit}</span>}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(m.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
