import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../context/CompanyContext';

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

const numberToWords = (n) =>
  new Intl.NumberFormat('es-CO').format(Math.floor(Number(n) || 0)) + ' pesos m/cte';

const INPUT = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-violet-400 transition';
const LABEL = 'block text-xs font-medium text-gray-600 mb-1';

const DEFAULT_FAC = {
  prefix: 'FAC', number: '', issue_date: new Date().toISOString().slice(0, 10),
  due_date: '', concept: '', notes: '', payment_info: '',
  include_iva: false, iva_rate: 19,
  include_retefuente: false, retefuente_rate: 4,
  include_reteiva: false, reteiva_rate: 15,
  include_reteica: false, reteica_rate: 0.414,
  status: 'draft',
};

const newItem = () => ({ service_id: null, description: '', quantity: 1, price: 0, position: 0 });

export default function FacturaEditor() {
  const { user, company } = useCompany();
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const [fac, setFac]         = useState(DEFAULT_FAC);
  const [items, setItems]     = useState([newItem()]);
  const [clientId, setClientId] = useState(null);
  const [clients, setClients]   = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (!company?.id) return;
    Promise.all([
      supabase.from('bapesu_clients').select('id,name,nit,email,phone,address').eq('company_id', company.id).order('name'),
      supabase.from('bapesu_services').select('id,name,default_price,unit,is_active').eq('company_id', company.id).eq('is_active', true).order('name'),
    ]).then(([c, s]) => { setClients(c.data ?? []); setServices(s.data ?? []); });
  }, [company]);

  useEffect(() => {
    if (isEdit || !company) return;
    setFac((p) => ({ ...p, payment_info: p.payment_info || (company.payment_info ?? '') }));
  }, [company, isEdit]);

  useEffect(() => {
    if (isEdit || !company?.id) return;
    supabase.from('bapesu_facturas').select('id', { count: 'exact', head: true }).eq('company_id', company.id)
      .then(({ count }) => setFac((p) => ({ ...p, number: String((count ?? 0) + 1).padStart(3, '0') })));
  }, [isEdit, company]);

  const loadFac = useCallback(async () => {
    if (!isEdit || !company?.id) return;
    setLoading(true);
    const { data: q } = await supabase.from('bapesu_facturas').select('*').eq('id', id).maybeSingle();
    if (q) {
      setFac({
        prefix: q.prefix ?? 'FAC', number: q.number ?? '',
        issue_date: q.issue_date ?? DEFAULT_FAC.issue_date, due_date: q.due_date ?? '',
        concept: q.concept ?? '', notes: q.notes ?? '', payment_info: q.payment_info ?? '',
        include_iva: q.include_iva ?? false, iva_rate: q.iva_rate ?? 19,
        include_retefuente: q.include_retefuente ?? false, retefuente_rate: q.retefuente_rate ?? 4,
        include_reteiva: q.include_reteiva ?? false, reteiva_rate: q.reteiva_rate ?? 15,
        include_reteica: q.include_reteica ?? false, reteica_rate: q.reteica_rate ?? 0.414,
        status: q.status ?? 'draft',
      });
      setClientId(q.client_id ?? null);
      const { data: its } = await supabase.from('bapesu_factura_items').select('*').eq('factura_id', id).order('position');
      setItems(its?.length ? its.map((i) => ({ service_id: i.service_id, description: i.description, quantity: Number(i.quantity), price: Number(i.price), position: i.position })) : [newItem()]);
    }
    setLoading(false);
  }, [isEdit, id, company]);

  useEffect(() => { loadFac(); }, [loadFac]);

  const setF = (k, v) => setFac((p) => ({ ...p, [k]: v }));
  const updateItem  = (i, k, v) => setItems((p) => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const removeItem  = (i)       => setItems((p) => p.length > 1 ? p.filter((_, idx) => idx !== i) : p);
  const addItem     = ()        => setItems((p) => [...p, newItem()]);
  const addServiceItem = (svc)  => setItems((p) => {
    const last = p[p.length - 1];
    const filled = { service_id: svc.id, description: svc.name, quantity: 1, price: Number(svc.default_price) || 0, position: p.length - 1 };
    if (!last.description && !last.price) return [...p.slice(0, -1), filled];
    return [...p, filled];
  });

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId) ?? null, [clients, clientId]);

  // ── Cálculos ──────────────────────────────────────────────────────────
  const subtotal    = items.reduce((a, it) => a + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0);
  const ivaAmt      = fac.include_iva ? subtotal * (Number(fac.iva_rate) || 0) / 100 : 0;
  const reteFuente  = fac.include_retefuente ? subtotal * (Number(fac.retefuente_rate) || 0) / 100 : 0;
  const reteIVA     = fac.include_reteiva ? ivaAmt * (Number(fac.reteiva_rate) || 0) / 100 : 0;
  const reteICA     = fac.include_reteica ? subtotal * (Number(fac.reteica_rate) || 0) / 100 : 0;
  const total       = subtotal + ivaAmt - reteFuente - reteIVA - reteICA;

  // ── Guardar ───────────────────────────────────────────────────────────
  const handleSave = async (status = fac.status) => {
    if (!company?.id) { setError('No tienes empresa asociada'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        company_id: company.id, client_id: clientId,
        client_name: selectedClient?.name ?? null, client_nit: selectedClient?.nit ?? null,
        client_email: selectedClient?.email ?? null, client_phone: selectedClient?.phone ?? null,
        client_address: selectedClient?.address ?? null,
        prefix: fac.prefix || 'FAC', number: fac.number || null,
        issue_date: fac.issue_date || null, due_date: fac.due_date || null,
        concept: fac.concept || null, notes: fac.notes || null, payment_info: fac.payment_info || null,
        include_iva: fac.include_iva, iva_rate: parseFloat(fac.iva_rate) || 0,
        include_retefuente: fac.include_retefuente, retefuente_rate: parseFloat(fac.retefuente_rate) || 0,
        include_reteiva: fac.include_reteiva, reteiva_rate: parseFloat(fac.reteiva_rate) || 0,
        include_reteica: fac.include_reteica, reteica_rate: parseFloat(fac.reteica_rate) || 0,
        subtotal, iva_amount: ivaAmt,
        retefuente_amount: reteFuente, reteiva_amount: reteIVA, reteica_amount: reteICA,
        total, status, updated_at: new Date().toISOString(),
      };

      let facId = id;
      if (isEdit) {
        const { error: e } = await supabase.from('bapesu_facturas').update(payload).eq('id', id);
        if (e) throw e;
      } else {
        const { data, error: e } = await supabase.from('bapesu_facturas').insert({ ...payload, created_by: user?.id ?? null }).select('id').single();
        if (e) throw e;
        facId = data.id;
      }

      await supabase.from('bapesu_factura_items').delete().eq('factura_id', facId);
      const itemsPayload = items
        .filter((i) => i.description.trim() || i.price > 0)
        .map((i, idx) => ({
          factura_id: facId, service_id: i.service_id,
          description: i.description.trim() || 'Sin descripción',
          quantity: Number(i.quantity) || 1, price: Number(i.price) || 0, position: idx,
        }));
      if (itemsPayload.length) {
        const { error: e } = await supabase.from('bapesu_factura_items').insert(itemsPayload);
        if (e) throw e;
      }

      if (!isEdit) navigate(`/dashboard/cobros/facturas/${facId}`, { replace: true });
      else await loadFac();
    } catch (e) { setError(e.message ?? 'Error al guardar'); }
    setSaving(false);
  };

  const handlePrint = async () => {
    if (!isEdit) await handleSave();
    window.print();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="w-7 h-7 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto" id="factura-outer">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/cobros?tab=facturas')} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Volver
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {isEdit ? `Factura ${fac.prefix}-${fac.number}` : 'Nueva factura'}
            </h1>
            <p className="text-xs text-gray-500">{selectedClient?.name ?? 'Sin cliente'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={fac.status} onChange={(e) => setF('status', e.target.value)} className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-violet-400/60">
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="paid">Pagada</option>
            <option value="cancelled">Anulada</option>
          </select>
          <button onClick={() => handleSave()} disabled={saving} className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={handlePrint} disabled={saving} className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white text-sm font-semibold transition shadow-[0_4px_14px_rgba(139,92,246,0.3)] disabled:opacity-60">
            Imprimir / PDF
          </button>
        </div>
      </div>

      {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 no-print">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── EDITOR ── */}
        <div className="space-y-4 no-print">

          <Card title="Cliente">
            <select className={INPUT} value={clientId ?? ''} onChange={(e) => setClientId(e.target.value || null)}>
              <option value="">— Selecciona un cliente —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.nit ? ` · ${c.nit}` : ''}</option>)}
            </select>
            {selectedClient && (
              <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs space-y-0.5">
                {selectedClient.nit     && <p className="text-gray-600"><span className="text-gray-400">NIT:</span> {selectedClient.nit}</p>}
                {selectedClient.email   && <p className="text-gray-600"><span className="text-gray-400">Email:</span> {selectedClient.email}</p>}
                {selectedClient.phone   && <p className="text-gray-600"><span className="text-gray-400">Tel:</span> {selectedClient.phone}</p>}
                {selectedClient.address && <p className="text-gray-600"><span className="text-gray-400">Dir:</span> {selectedClient.address}</p>}
              </div>
            )}
          </Card>

          <Card title="Datos de la factura">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Prefijo</label>
                <input className={INPUT} value={fac.prefix} onChange={(e) => setF('prefix', e.target.value)} placeholder="FAC" />
              </div>
              <div>
                <label className={LABEL}>Número</label>
                <input className={INPUT} value={fac.number} onChange={(e) => setF('number', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Fecha emisión</label>
                <input type="date" className={INPUT} value={fac.issue_date} onChange={(e) => setF('issue_date', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Fecha vencimiento</label>
                <input type="date" className={INPUT} value={fac.due_date} onChange={(e) => setF('due_date', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Concepto</label>
                <input className={INPUT} value={fac.concept} onChange={(e) => setF('concept', e.target.value)} placeholder="Ej: Servicios de diseño gráfico" />
              </div>
            </div>
          </Card>

          <Card title="Productos / Servicios">
            {services.length > 0 && (
              <div className="mb-3">
                <label className={LABEL}>Agregar desde catálogo</label>
                <div className="flex flex-wrap gap-1.5">
                  {services.map((s) => (
                    <button key={s.id} type="button" onClick={() => addServiceItem(s)}
                      className="px-3 py-1.5 text-xs rounded-full bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      {s.name} <span className="text-[10px] text-violet-500">{formatCOP(s.default_price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start p-2 rounded-lg bg-gray-50">
                  <div className="col-span-12 sm:col-span-6">
                    <input className={INPUT} value={it.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Descripción" />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <input type="number" min="0" step="0.5" className={INPUT} value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} placeholder="Cant." />
                  </div>
                  <div className="col-span-7 sm:col-span-3">
                    <input type="number" min="0" step="1000" className={INPUT} value={it.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} placeholder="Precio" />
                  </div>
                  <button onClick={() => removeItem(idx)} className="col-span-2 sm:col-span-1 w-9 h-9 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition mx-auto">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="mt-2 w-full py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition">
              + Agregar ítem manual
            </button>
          </Card>

          {/* Impuestos y retenciones */}
          <Card title="Impuestos y retenciones">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'include_iva',        rateKey: 'iva_rate',        label: 'IVA',          placeholder: '19', hint: '% sobre subtotal' },
                { key: 'include_retefuente', rateKey: 'retefuente_rate', label: 'Retefuente',   placeholder: '4',  hint: '% sobre subtotal' },
                { key: 'include_reteiva',    rateKey: 'reteiva_rate',    label: 'ReteIVA',      placeholder: '15', hint: '% sobre el IVA' },
                { key: 'include_reteica',    rateKey: 'reteica_rate',    label: 'ReteICA',      placeholder: '0.414', hint: '% sobre subtotal (‰)' },
              ].map((t) => (
                <div key={t.key} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                    <input type="checkbox" checked={fac[t.key]} onChange={(e) => setF(t.key, e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-violet-500 focus:ring-violet-400" />
                    <span className="text-xs text-gray-700 font-semibold">{t.label}</span>
                  </label>
                  {fac[t.key] && (
                    <div>
                      <input type="number" min="0" step="0.01" className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400/60" value={fac[t.rateKey]} onChange={(e) => setF(t.rateKey, e.target.value)} placeholder={t.placeholder} />
                      <p className="text-[10px] text-gray-400 mt-1">{t.hint}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Información adicional">
            <div>
              <label className={LABEL}>Notas</label>
              <textarea rows={2} className={INPUT + ' resize-none'} value={fac.notes} onChange={(e) => setF('notes', e.target.value)} placeholder="Observaciones, condiciones de pago..." />
            </div>
            <div className="mt-3">
              <label className={LABEL}>Información de pago</label>
              <textarea rows={2} className={INPUT + ' resize-none'} value={fac.payment_info} onChange={(e) => setF('payment_info', e.target.value)} placeholder="Bancolombia · Ahorros · 123-456-789-00" />
            </div>
          </Card>
        </div>

        {/* ── PREVIEW ── */}
        <div id="factura-preview-col">
          <div id="factura-print" className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden text-gray-900 text-[13px]">

            {/* Header */}
            <div style={{ background: '#4c1d95', color: '#fff' }} className="px-7 py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {company?.logo_url && (
                  <div className="flex-shrink-0 bg-white rounded-xl p-1.5 shadow">
                    <img src={company.logo_url} alt="logo" className="h-14 w-14 object-contain rounded-lg" onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold leading-tight truncate">{company?.name ?? 'TU EMPRESA'}</h2>
                  {company?.nit && <p className="text-[10px] opacity-80 mt-0.5">NIT: {company.nit}</p>}
                  {company?.address && <p className="text-[10px] opacity-70">{company.address}{company.city ? `, ${company.city}` : ''}</p>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] uppercase tracking-widest opacity-70">Factura de Venta</p>
                <p className="text-2xl font-extrabold">{fac.prefix || 'FAC'}-{fac.number || '—'}</p>
                <p className="text-[10px] opacity-70 mt-0.5">
                  {fac.issue_date && new Date(fac.issue_date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                {fac.due_date && <p className="text-[10px] opacity-60">Vence: {new Date(fac.due_date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
              </div>
            </div>

            {/* Partes */}
            <div className="px-7 py-4 grid grid-cols-2 gap-4 border-b border-gray-100 bg-violet-50/30">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Vendedor</p>
                <p className="text-sm font-bold text-gray-900">{company?.name ?? '—'}</p>
                {company?.nit   && <p className="text-[11px] text-gray-500">NIT: {company.nit}</p>}
                {company?.email && <p className="text-[11px] text-gray-500">{company.email}</p>}
                {company?.phone && <p className="text-[11px] text-gray-500">{company.phone}</p>}
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Comprador</p>
                <p className="text-sm font-bold text-gray-900">{selectedClient?.name ?? 'Selecciona un cliente'}</p>
                {selectedClient?.nit     && <p className="text-[11px] text-gray-500">NIT: {selectedClient.nit}</p>}
                {selectedClient?.email   && <p className="text-[11px] text-gray-500">{selectedClient.email}</p>}
                {selectedClient?.address && <p className="text-[11px] text-gray-500">{selectedClient.address}</p>}
              </div>
            </div>

            {fac.concept && (
              <div className="px-7 py-2 border-b border-gray-100 bg-gray-50">
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">Concepto</p>
                <p className="text-xs text-gray-700">{fac.concept}</p>
              </div>
            )}

            {/* Items */}
            <table className="w-full text-xs">
              <thead style={{ background: '#5b21b6', color: '#fff' }}>
                <tr>
                  <th className="px-7 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">Descripción</th>
                  <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider text-[10px] w-12">Cant.</th>
                  <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-[10px] w-28">V. Unitario</th>
                  <th className="px-7 py-2 text-right font-semibold uppercase tracking-wider text-[10px] w-32">V. Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="px-7 py-2 text-gray-800">{it.description || <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{it.quantity}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{formatCOP(it.price)}</td>
                    <td className="px-7 py-2 text-right font-semibold text-gray-800">{formatCOP((it.quantity || 0) * (it.price || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div className="px-7 py-4 border-t border-gray-100 flex justify-end">
              <div className="w-80 text-xs space-y-1">
                <Row label="Subtotal" value={formatCOP(subtotal)} />
                {fac.include_iva && <Row label={`IVA (${fac.iva_rate}%)`} value={formatCOP(ivaAmt)} />}
                {fac.include_retefuente && <Row label={`Retefuente (-${fac.retefuente_rate}%)`} value={`-${formatCOP(reteFuente)}`} red />}
                {fac.include_reteiva && <Row label={`ReteIVA (-${fac.reteiva_rate}% del IVA)`} value={`-${formatCOP(reteIVA)}`} red />}
                {fac.include_reteica && <Row label={`ReteICA (-${fac.reteica_rate}%)`} value={`-${formatCOP(reteICA)}`} red />}
                <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
                  <span className="font-bold text-gray-900">TOTAL A PAGAR</span>
                  <span className="font-extrabold" style={{ color: '#5b21b6' }}>{formatCOP(total)}</span>
                </div>
                <p className="text-[10px] text-gray-400 italic text-right capitalize">{numberToWords(total)}</p>
              </div>
            </div>

            {fac.payment_info && (
              <div className="px-7 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Información de pago</p>
                <p className="text-[11px] text-gray-700 whitespace-pre-line">{fac.payment_info}</p>
              </div>
            )}

            {fac.notes && (
              <div className="px-7 py-3 border-t border-gray-100">
                <p className="text-[11px] text-gray-500 italic whitespace-pre-line">{fac.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ background: '#4c1d95', color: '#fff' }} className="px-7 py-3 text-[10px] flex items-center justify-between flex-wrap gap-2 opacity-90">
              <span>{company?.phone}</span>
              <span>{company?.email}</span>
              <span>{company?.website ?? company?.instagram}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body * { visibility: hidden !important; }
          #factura-print, #factura-print * { visibility: visible !important; }
          #factura-print {
            position: fixed !important; top: 0; left: 0; width: 100vw;
            border: none !important; box-shadow: none !important; border-radius: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, red }) {
  return (
    <div className={`flex justify-between ${red ? 'text-red-600' : 'text-gray-600'}`}>
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
