import { useCallback, useEffect, useState } from 'react';
import { posSalesApi } from '../../../../api';
import { useCompany } from '../../../../context/CompanyContext';
import { docTypeLabel, formatDateTime, money, paymentLabel } from './printDocs';

const FILTERS = [
  ['PENDING', 'Pendientes'],
  ['SENT', 'Enviadas'],
  ['', 'Todas'],
];
const saleCode = (sale) => `V-${String(sale.sale_number).padStart(5, '0')}`;

// Texto listo para pegar en el software de facturación.
const einvoiceText = (sale) => {
  const d = sale.einvoice_data || {};
  return [
    `Venta ${saleCode(sale)} · ${formatDateTime(sale.sold_at)}`,
    `${docTypeLabel(d.docType)}: ${d.docNumber}`,
    `${d.docType === 'NIT' ? 'Razón social' : 'Nombre'}: ${d.name}`,
    `Correo: ${d.email}`,
    d.phone && `Teléfono: ${d.phone}`,
    (d.address || d.city) && `Dirección: ${[d.address, d.city].filter(Boolean).join(', ')}`,
    '',
    ...sale.items.map((it) => `${it.quantity} × ${it.description} — ${money(it.unit_price)} c/u = ${money(it.quantity * it.unit_price)}`),
    Number(sale.discount) > 0 && `Descuento: -${money(sale.discount)}`,
    Number(sale.shipping_cost) > 0 && `Envío: ${money(sale.shipping_cost)}`,
    `Total: ${money(sale.total)} · Pago: ${paymentLabel(sale.payment_method)}`,
  ].filter((line) => line !== false && line !== undefined && line !== null).join('\n');
};

export default function EinvoiceList({ refreshKey, onChange }) {
  const { company } = useCompany();
  const [filter, setFilter] = useState('PENDING');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [marking, setMarking] = useState(null); // { id, number }
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await posSalesApi.listEinvoices(company.id, filter || undefined);
    if (err) setError(err.message?.includes('requires_einvoice') ? 'Falta actualizar la base de datos: ejecuta de nuevo database/pos_sales_module.sql en Supabase.' : err.message);
    else setSales(data ?? []);
    setLoading(false);
  }, [company?.id, filter]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const copy = async (sale) => {
    try { await navigator.clipboard.writeText(einvoiceText(sale)); setNotice(`Datos de ${saleCode(sale)} copiados.`); }
    catch { setNotice('No se pudo copiar. Selecciona el texto manualmente.'); }
  };

  const setStatus = async (sale, status, number) => {
    setBusyId(sale.id);
    setError('');
    const { error: err } = await posSalesApi.setEinvoiceStatus(sale.id, { status, number: number?.trim() });
    setBusyId(null);
    if (err) return setError(err.message);
    setMarking(null);
    setNotice(status === 'SENT' ? `${saleCode(sale)} marcada como enviada.` : `${saleCode(sale)} volvió a pendientes.`);
    // onChange sube refreshKey y eso recarga la lista.
    if (onChange) onChange(); else load();
  };

  const pendingActive = sales.filter((s) => s.einvoice_status === 'PENDING' && s.status !== 'VOIDED');

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Facturación electrónica</h2>
          <p className="mt-1 text-xs text-gray-500">Ventas en las que el cliente pidió factura electrónica. Márcalas como enviadas cuando la emitas.</p>
        </div>
        <div role="tablist" aria-label="Filtrar por estado" className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {FILTERS.map(([id, label]) => (
            <button key={id || 'all'} type="button" role="tab" aria-selected={filter === id} onClick={() => { setFilter(id); setNotice(''); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === id ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{label}</button>
          ))}
        </div>
      </div>

      {filter === 'PENDING' && !loading && pendingActive.length > 0 && (
        <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <strong>{pendingActive.length}</strong> {pendingActive.length === 1 ? 'factura pendiente' : 'facturas pendientes'} por {money(pendingActive.reduce((sum, s) => sum + Number(s.total), 0))}.
        </p>
      )}
      {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
      {notice && <p role="status" className="mt-3 text-xs text-violet-700">{notice}</p>}

      {loading ? <p className="mt-5 text-sm text-gray-500">Cargando…</p> : sales.length === 0 ? (
        <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
          {filter === 'PENDING' ? 'No hay facturas pendientes. 🎉' : 'No hay ventas con factura electrónica en este filtro.'}
        </p>
      ) : (
        <ul className="mt-5 grid gap-4 xl:grid-cols-2">
          {sales.map((sale) => {
            const d = sale.einvoice_data || {};
            const voided = sale.status === 'VOIDED';
            const sent = sale.einvoice_status === 'SENT';
            return (
              <li key={sale.id} className={`rounded-xl border p-4 ${voided ? 'border-gray-200 bg-gray-50 text-gray-500' : sent ? 'border-emerald-200' : 'border-sky-200'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{saleCode(sale)} · {money(sale.total)}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(sale.sold_at)} · {paymentLabel(sale.payment_method)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {voided && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">VENTA ANULADA</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${sent ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                      {sent ? `Enviada${sale.einvoice_number ? ` · ${sale.einvoice_number}` : ''}` : 'Pendiente'}
                    </span>
                  </div>
                </div>

                <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                  <dt className="text-gray-500">{docTypeLabel(d.docType)}</dt><dd className="font-semibold text-gray-900">{d.docNumber}</dd>
                  <dt className="text-gray-500">{d.docType === 'NIT' ? 'Razón social' : 'Nombre'}</dt><dd className="text-gray-900">{d.name}</dd>
                  <dt className="text-gray-500">Correo</dt><dd className="break-all text-gray-900">{d.email}</dd>
                  {d.phone && <><dt className="text-gray-500">Teléfono</dt><dd className="text-gray-900">{d.phone}</dd></>}
                  {(d.address || d.city) && <><dt className="text-gray-500">Dirección</dt><dd className="text-gray-900">{[d.address, d.city].filter(Boolean).join(', ')}</dd></>}
                </dl>
                <p className="mt-2 text-xs text-gray-500">{sale.items.map((it) => `${it.quantity}× ${it.description}`).join(', ')}</p>
                {sent && sale.einvoice_sent_at && <p className="mt-1 text-xs text-emerald-700">Marcada como enviada el {formatDateTime(sale.einvoice_sent_at)}</p>}
                {voided && !sent && <p className="mt-1 text-xs font-semibold text-amber-700">Esta venta fue anulada: no la factures.</p>}

                {marking?.id === sale.id ? (
                  <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-emerald-50 p-3">
                    <label className="block flex-1 text-xs font-semibold text-gray-700">Número de factura (opcional)
                      <input autoFocus className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" value={marking.number} onChange={(e) => setMarking({ ...marking, number: e.target.value })} placeholder="FE-0001" />
                    </label>
                    <button type="button" disabled={busyId === sale.id} onClick={() => setStatus(sale, 'SENT', marking.number)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Confirmar</button>
                    <button type="button" onClick={() => setMarking(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600">Cancelar</button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => copy(sale)} className="rounded-lg border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50">Copiar datos</button>
                    {!sent && !voided && <button type="button" onClick={() => setMarking({ id: sale.id, number: '' })} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">Marcar como enviada</button>}
                    {sent && <button type="button" disabled={busyId === sale.id} onClick={() => setStatus(sale, 'PENDING')} className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50">Volver a pendiente</button>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
