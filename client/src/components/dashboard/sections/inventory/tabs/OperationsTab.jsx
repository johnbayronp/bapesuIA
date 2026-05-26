import { useState } from 'react';
import { OP_TYPES } from '../useOperations';

const STATUS_STYLE = {
  borrador:   'bg-yellow-100 text-yellow-700',
  confirmado: 'bg-emerald-100 text-emerald-700',
  anulado:    'bg-gray-100 text-gray-500 line-through',
};

const TYPE_DOT = {
  entrada:  'bg-emerald-500',
  salida:   'bg-red-500',
  traslado: 'bg-blue-500',
  conteo:   'bg-violet-500',
};

export default function OperationsTab({
  ops, suppliers, warehouses, saving,
  openNewOp, openEditOp, handleConfirmOp, handleCancelOp, handleDeleteOp, handleReapplyStock,
  openAddSupplier, openEditSupplier, handleDeleteSupplier,
  openAddWarehouse, openEditWarehouse, handleDeleteWarehouse,
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const visible = ops.filter((o) => {
    if (filter !== 'all' && o.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (o.reference ?? '').toLowerCase().includes(q)
          || (o.client_ref ?? '').toLowerCase().includes(q)
          || (o.bapesu_suppliers?.name ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const kpis = {
    entrada:  ops.filter((o) => o.type === 'entrada'  && o.status === 'confirmado').length,
    salida:   ops.filter((o) => o.type === 'salida'   && o.status === 'confirmado').length,
    traslado: ops.filter((o) => o.type === 'traslado' && o.status === 'confirmado').length,
    conteo:   ops.filter((o) => o.type === 'conteo'   && o.status === 'confirmado').length,
    borrador: ops.filter((o) => o.status === 'borrador').length,
  };

  return (
    <div className="space-y-6">
      {/* Cards de acceso rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(OP_TYPES).map(([key, info]) => (
          <button
            key={key}
            onClick={() => openNewOp(key)}
            className="relative group bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
          >
            {/* fondo degradado sutil */}
            <div className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-0 group-hover:opacity-8 transition-opacity rounded-2xl`} />
            <span className="text-3xl mb-3 block">{info.icon}</span>
            <span className="inline-block mb-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">Operaciones</span>
            <p className="font-semibold text-gray-800 text-sm leading-tight">{info.label}</p>
            <p className="text-xs text-gray-500 mt-1 leading-snug">{info.desc}</p>
            <div className={`mt-3 text-2xl font-bold ${info.color.includes('emerald') ? 'text-emerald-600' : info.color.includes('red') ? 'text-red-500' : info.color.includes('blue') ? 'text-blue-600' : 'text-violet-600'}`}>
              {kpis[key]}
            </div>
            <p className="text-xs text-gray-400">confirmadas</p>
          </button>
        ))}
      </div>

      {/* Borradores pendientes */}
      {kpis.borrador > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <span className="text-yellow-500 text-xl">⚠️</span>
          <p className="text-sm text-yellow-700 font-medium">
            Tienes <strong>{kpis.borrador}</strong> operación{kpis.borrador > 1 ? 'es' : ''} en borrador sin confirmar. El stock no se actualiza hasta que las confirmes.
          </p>
        </div>
      )}

      {/* Historial */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-50">
          <span className="font-semibold text-gray-800 text-sm">Historial de operaciones</span>
          <div className="flex gap-1 ml-auto flex-wrap">
            {['all', 'entrada', 'salida', 'traslado', 'conteo'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${filter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >{f === 'all' ? 'Todos' : OP_TYPES[f]?.label.split(' ')[0]}</button>
            ))}
          </div>
          <input
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-48"
            placeholder="Buscar referencia, proveedor…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-sm">No hay operaciones registradas</p>
            <p className="text-xs mt-1">Haz clic en una de las tarjetas de arriba para crear la primera</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visible.map((op) => (
              <OpRow
                key={op.id}
                op={op}
                saving={saving}
                openEditOp={openEditOp}
                handleConfirmOp={handleConfirmOp}
                handleCancelOp={handleCancelOp}
                handleDeleteOp={handleDeleteOp}
                handleReapplyStock={handleReapplyStock}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Proveedores & Bodegas ─────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Proveedores */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏭</span>
              <span className="font-semibold text-gray-800 text-sm">Proveedores</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{suppliers.length}</span>
            </div>
            <button onClick={openAddSupplier}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium transition">
              + Nuevo
            </button>
          </div>
          {suppliers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-2xl mb-1">🏭</p>
              <p className="text-xs">Sin proveedores aún</p>
              <button onClick={openAddSupplier} className="mt-2 text-xs text-indigo-500 hover:underline">Crear el primero</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {suppliers.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 group transition">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400 truncate">{[s.nit, s.phone, s.email].filter(Boolean).join(' · ') || 'Sin datos'}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEditSupplier(s)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 text-xs transition">✏️</button>
                    <button onClick={() => handleDeleteSupplier(s.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 text-xs transition">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bodegas */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏢</span>
              <span className="font-semibold text-gray-800 text-sm">Bodegas / Ubicaciones</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{warehouses.length}</span>
            </div>
            <button onClick={openAddWarehouse}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition">
              + Nueva
            </button>
          </div>
          {warehouses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-2xl mb-1">🏢</p>
              <p className="text-xs">Sin bodegas aún</p>
              <button onClick={openAddWarehouse} className="mt-2 text-xs text-blue-500 hover:underline">Crear la primera</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {warehouses.map((w) => (
                <div key={w.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 group transition">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm shrink-0">🏢</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{w.name}</p>
                    <p className="text-xs text-gray-400 truncate">{w.address || w.description || 'Sin dirección'}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEditWarehouse(w)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 text-xs transition">✏️</button>
                    <button onClick={() => handleDeleteWarehouse(w.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 text-xs transition">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OpRow({ op, saving, openEditOp, handleConfirmOp, handleCancelOp, handleDeleteOp, handleReapplyStock }) {
  const info = OP_TYPES[op.type];
  const canEdit     = op.status === 'borrador';
  const canConfirm  = op.status === 'borrador';
  const canCancel   = op.status === 'confirmado';
  const canDelete   = op.status !== 'confirmado';
  const canReapply  = op.status === 'confirmado';

  const wh_from = op.wh_from?.name ?? op.warehouse_from ?? null;
  const wh_to   = op.wh_to?.name   ?? op.warehouse_to   ?? null;
  const supplier = op.bapesu_suppliers?.name ?? null;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition group">
      {/* Dot + tipo */}
      <div className="flex items-center gap-2 w-44 shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[op.type]}`} />
        <span className="text-sm font-medium text-gray-700 truncate">{info.label.split(' ')[0]}</span>
      </div>

      {/* Referencia */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 font-medium truncate">
          {op.reference || <span className="italic text-gray-400">Sin referencia</span>}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {supplier && `Proveedor: ${supplier}`}
          {wh_from && ` · Desde: ${wh_from}`}
          {wh_to   && ` → ${wh_to}`}
          {op.client_ref && ` · ${op.client_ref}`}
        </p>
      </div>

      {/* Fecha */}
      <div className="text-xs text-gray-500 w-24 text-right shrink-0">
        {op.op_date ? new Date(op.op_date + 'T12:00:00').toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
      </div>

      {/* Status */}
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-24 text-center shrink-0 ${STATUS_STYLE[op.status]}`}>
        {op.status}
      </span>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition shrink-0">
        {canEdit && (
          <button onClick={() => openEditOp(op)} title="Editar"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition text-sm">✏️</button>
        )}
        {canConfirm && (
          <button onClick={() => handleConfirmOp(op)} disabled={saving} title="Confirmar y aplicar stock"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition text-sm">✅</button>
        )}
        {canReapply && (
          <button onClick={() => handleReapplyStock(op)} disabled={saving} title="Re-aplicar stock (si no se actualizó)"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-50 text-orange-500 hover:bg-orange-100 transition text-sm">🔁</button>
        )}
        {canCancel && (
          <button onClick={() => handleCancelOp(op)} disabled={saving} title="Anular (revierte el stock)"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition text-sm">🚫</button>
        )}
        {canDelete && (
          <button onClick={() => handleDeleteOp(op)} title="Eliminar"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition text-sm">🗑️</button>
        )}
      </div>
    </div>
  );
}
