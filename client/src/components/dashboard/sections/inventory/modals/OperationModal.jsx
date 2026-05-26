import { useState } from 'react';
import { INPUT, LABEL, formatPriceCOP, parsePriceCOP, formatCOP } from '../constants';
import { OP_TYPES } from '../useOperations';

const ACCENT = {
  entrada:  'text-emerald-600 bg-emerald-50 ring-emerald-200',
  salida:   'text-red-600 bg-red-50 ring-red-200',
  traslado: 'text-blue-600 bg-blue-50 ring-blue-200',
  conteo:   'text-violet-600 bg-violet-50 ring-violet-200',
};
const BTN_CONFIRM = {
  entrada:  'bg-emerald-600 hover:bg-emerald-700',
  salida:   'bg-red-600 hover:bg-red-700',
  traslado: 'bg-blue-600 hover:bg-blue-700',
  conteo:   'bg-violet-600 hover:bg-violet-700',
};

export default function OperationModal({
  opModal, opForm, setOF, items, setItem, addItem, removeItem,
  suppliers, warehouses, products, pendingDocs,
  saving, error, closeOpModal, handleSaveOp,
  openAddSupplier, openAddWarehouse,
}) {
  if (!opModal) return null;
  const type = opForm.type;
  const info = OP_TYPES[type];
  const isEdit = opModal.mode === 'edit';
  const isCounteo = type === 'conteo';

  const [docSearch, setDocSearch] = useState('');
  const [showDocList, setShowDocList] = useState(false);
  const filteredDocs = docSearch.length > 0
    ? (pendingDocs ?? []).filter((d) => d.label.toLowerCase().includes(docSearch.toLowerCase())).slice(0, 8)
    : (pendingDocs ?? []).slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <span className="text-2xl">{info.icon}</span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Editar' : 'Nueva'} {info.label}</h2>
            <p className="text-xs text-gray-500">{info.desc}</p>
          </div>
          <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${ACCENT[type]}`}>{type}</span>
          <button onClick={closeOpModal} className="ml-2 text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Fecha</label>
              <input type="date" className={INPUT} value={opForm.op_date} onChange={(e) => setOF('op_date', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Referencia / Nro. orden</label>
              <input className={INPUT} value={opForm.reference} onChange={(e) => setOF('reference', e.target.value)} />
            </div>
            {/* Proveedor — solo en entradas */}
            {type === 'entrada' && (
              <div>
                <label className={LABEL}>Proveedor</label>
                <div className="flex gap-1.5">
                  <select className={INPUT} value={opForm.supplier_id} onChange={(e) => setOF('supplier_id', e.target.value)}>
                    <option value="">Sin especificar</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button type="button" onClick={openAddSupplier} title="Crear nuevo proveedor"
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-indigo-600 hover:bg-indigo-50 transition text-base font-bold">+</button>
                </div>
              </div>
            )}
            {/* Bodega origen — salida y traslado */}
            {(type === 'salida' || type === 'traslado') && (
              <div>
                <label className={LABEL}>Bodega origen</label>
                <div className="flex gap-1.5">
                  <select className={INPUT} value={opForm.warehouse_from} onChange={(e) => setOF('warehouse_from', e.target.value)}>
                    <option value="">Sin especificar</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <button type="button" onClick={openAddWarehouse} title="Crear nueva bodega"
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 transition text-base font-bold">+</button>
                </div>
              </div>
            )}
            {/* Bodega destino — entrada y traslado */}
            {(type === 'entrada' || type === 'traslado') && (
              <div>
                <label className={LABEL}>Bodega destino</label>
                <div className="flex gap-1.5">
                  <select className={INPUT} value={opForm.warehouse_to} onChange={(e) => setOF('warehouse_to', e.target.value)}>
                    <option value="">Sin especificar</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <button type="button" onClick={openAddWarehouse} title="Crear nueva bodega"
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 transition text-base font-bold">+</button>
                </div>
              </div>
            )}
            {/* Referencia cliente — salida: autocomplete de documentos pendientes */}
            {type === 'salida' && (
              <div className="md:col-span-3 relative">
                <label className={LABEL}>Documento / Factura vinculada</label>
                <div className="relative">
                  <input
                    className={INPUT + ' pr-8'}
                    placeholder="Buscar cuenta de cobro o factura pendiente…"
                    value={opForm.client_ref || docSearch}
                    onChange={(e) => {
                      setDocSearch(e.target.value);
                      setOF('client_ref', e.target.value);
                      setShowDocList(true);
                    }}
                    onFocus={() => setShowDocList(true)}
                    onBlur={() => setTimeout(() => setShowDocList(false), 150)}
                  />
                  {opForm.client_ref && (
                    <button type="button" onClick={() => { setOF('client_ref', ''); setDocSearch(''); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">×</button>
                  )}
                </div>
                {showDocList && filteredDocs.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {filteredDocs.map((doc) => (
                      <button
                        key={doc.id} type="button"
                        onMouseDown={() => {
                          setOF('client_ref', doc.label);
                          setDocSearch(doc.label);
                          setShowDocList(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-indigo-50 text-left transition"
                      >
                        <span className="text-sm text-gray-800 truncate">{doc.label}</span>
                        <span className="text-xs text-gray-500 shrink-0 ml-3">{formatCOP(doc.amount)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showDocList && (pendingDocs ?? []).length === 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow px-4 py-3 text-xs text-gray-400">
                    No hay cuentas de cobro ni facturas pendientes
                  </div>
                )}
              </div>
            )}
            <div className="md:col-span-3">
              <label className={LABEL}>Notas</label>
              <input className={INPUT} placeholder="Observaciones opcionales..." value={opForm.notes} onChange={(e) => setOF('notes', e.target.value)} />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Productos</span>
              <button onClick={addItem} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100 transition">+ Agregar fila</button>
            </div>
            <div className="space-y-2">
              {/* Header */}
              <div className={`grid text-xs font-medium text-gray-500 px-2 ${isCounteo ? 'grid-cols-[2fr_1fr_1fr_1fr_auto]' : type === 'entrada' ? 'grid-cols-[2fr_1fr_1fr_1fr_auto]' : 'grid-cols-[2fr_1fr_1fr_auto]'} gap-2`}>
                <span>Producto</span>
                <span>{isCounteo ? 'Cant. esperada' : 'Cantidad'}</span>
                {type === 'entrada' && <span>Costo unitario</span>}
                {isCounteo && <span>Cant. contada</span>}
                <span>Lote / vencimiento</span>
                <span />
              </div>

              {items.map((it, i) => {
                const selProd = it.product_id ? products.find((p) => p.id === it.product_id) : null;
                const unit = selProd?.unit || '';
                return (
                <div key={i} className={`grid items-start gap-2 bg-gray-50 rounded-xl px-2 py-2 ${isCounteo ? 'grid-cols-[2fr_1fr_1fr_1fr_auto]' : type === 'entrada' ? 'grid-cols-[2fr_1fr_1fr_1fr_auto]' : 'grid-cols-[2fr_1fr_1fr_auto]'}`}>
                  {/* Producto selector */}
                  <div>
                    <select
                      className={INPUT + ' text-xs'}
                      value={it.product_id}
                      onChange={(e) => setItem(i, 'product_id', e.target.value)}
                    >
                      <option value="">— Seleccionar —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>
                      ))}
                    </select>
                    {selProd && (
                      <div className="flex items-center gap-1.5 mt-1 px-0.5">
                        {unit && <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full leading-none">{unit}</span>}
                        <span className="text-[10px] text-gray-400 leading-none">
                          en stock: <strong className="text-gray-600">{Number(selProd.stock_available ?? 0).toLocaleString('es-CO')}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="relative">
                    <input
                      type="number" min="0" step="0.001"
                      className={INPUT + ' text-xs' + (unit ? ' pr-7' : '')}
                      placeholder={isCounteo ? 'Esperado' : 'Cant.'}
                      value={isCounteo ? it.quantity : it.quantity}
                      onChange={(e) => setItem(i, 'quantity', e.target.value)}
                    />
                    {unit && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400 pointer-events-none select-none">
                        {unit}
                      </span>
                    )}
                  </div>

                  {/* Costo unitario — solo entrada */}
                  {type === 'entrada' && (
                    <input
                      type="text"
                      className={INPUT + ' text-xs'}
                      placeholder="$ Costo"
                      value={it.unit_cost ? formatPriceCOP(parsePriceCOP(it.unit_cost)) : ''}
                      onChange={(e) => setItem(i, 'unit_cost', parsePriceCOP(e.target.value))}
                    />
                  )}

                  {/* Cantidad contada — solo conteo */}
                  {isCounteo && (
                    <div className="relative">
                      <input
                        type="number" min="0" step="0.001"
                        className={INPUT + ' text-xs' + (unit ? ' pr-8' : '')}
                        placeholder="Contado"
                        value={it.qty_counted}
                        onChange={(e) => setItem(i, 'qty_counted', e.target.value)}
                      />
                      {unit && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400 pointer-events-none">
                          {unit}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Lote + fecha vencimiento */}
                  <div className="flex gap-1">
                    <input
                      className={INPUT + ' text-xs flex-1'}
                      placeholder="Lote"
                      value={it.lot_number}
                      onChange={(e) => setItem(i, 'lot_number', e.target.value)}
                    />
                    <input
                      type="date"
                      className={INPUT + ' text-xs w-34'}
                      value={it.expiry_date}
                      onChange={(e) => setItem(i, 'expiry_date', e.target.value)}
                    />
                  </div>

                  {/* Eliminar */}
                  <button onClick={() => removeItem(i)} disabled={items.length === 1}
                    className="mt-1 text-gray-400 hover:text-red-500 disabled:opacity-30 transition text-lg leading-none px-1">×</button>
                </div>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={closeOpModal} disabled={saving} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
          <button
            onClick={() => handleSaveOp(false)} disabled={saving}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >{saving ? 'Guardando…' : 'Guardar borrador'}</button>
          <button
            onClick={() => handleSaveOp(true)} disabled={saving}
            className={`px-5 py-2 text-sm rounded-xl text-white font-medium transition ${BTN_CONFIRM[type]} disabled:opacity-60`}
          >{saving ? 'Confirmando…' : `Confirmar y aplicar stock`}</button>
        </div>
      </div>
    </div>
  );
}
