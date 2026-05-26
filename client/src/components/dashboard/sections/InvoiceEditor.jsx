import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../context/CompanyContext';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0,
}).format(n || 0);

const numberToWords = (n) => {
  const num = Math.floor(Number(n) || 0);
  return new Intl.NumberFormat('es-CO').format(num) + ' pesos m/cte';
};

const INPUT = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400 transition';
const LABEL = 'block text-xs font-medium text-gray-600 mb-1';

const DEFAULT_INV = {
  number: '',
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  concept: '',
  notes: '',
  payment_info: '',
  include_iva: false,
  iva_rate: 19,
  include_retefuente: false,
  retefuente_rate: 4,
  status: 'draft',
};

const newItem = () => ({ service_id: null, description: '', quantity: 1, price: 0, position: 0 });

export default function InvoiceEditor() {
  const { user, company } = useCompany();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const [inv, setInv]       = useState(DEFAULT_INV);
  const [items, setItems]   = useState([newItem()]);
  const [clientId, setClientId] = useState(null);

  const [clients, setClients]   = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (!company?.id) return;
    Promise.all([
      supabase.from('bapesu_clients').select('id, name, nit, email, phone, city, address').eq('company_id', company.id).order('name'),
      supabase.from('bapesu_services').select('id, name, default_price, unit, is_active').eq('company_id', company.id).eq('is_active', true).order('name'),
    ]).then(([c, s]) => {
      setClients(c.data ?? []);
      setServices(s.data ?? []);
    });
  }, [company]);

  // Pre-cargar payment_info de la empresa
  useEffect(() => {
    if (isEdit || !company) return;
    setInv((p) => ({ ...p, payment_info: p.payment_info || (company.payment_info ?? '') }));
  }, [company, isEdit]);

  // Número auto
  useEffect(() => {
    if (isEdit || !company?.id) return;
    supabase
      .from('bapesu_invoices').select('id', { count: 'exact', head: true }).eq('company_id', company.id)
      .then(({ count }) => setInv((p) => ({ ...p, number: String((count ?? 0) + 1).padStart(3, '0') })));
  }, [isEdit, company]);

  const loadInv = useCallback(async () => {
    if (!isEdit || !company?.id) return;
    setLoading(true);
    const { data: q } = await supabase.from('bapesu_invoices').select('*').eq('id', id).maybeSingle();
    if (q) {
      setInv({
        number: q.number ?? '', issue_date: q.issue_date ?? DEFAULT_INV.issue_date,
        due_date: q.due_date ?? '', concept: q.concept ?? '', notes: q.notes ?? '',
        payment_info: q.payment_info ?? '', include_iva: q.include_iva ?? false,
        iva_rate: q.iva_rate ?? 19, include_retefuente: q.include_retefuente ?? false,
        retefuente_rate: q.retefuente_rate ?? 4, status: q.status ?? 'draft',
      });
      setClientId(q.client_id ?? null);

      const { data: its } = await supabase.from('bapesu_invoice_items').select('*').eq('invoice_id', id).order('position');
      setItems(its && its.length ? its.map((i) => ({
        service_id: i.service_id, description: i.description, quantity: Number(i.quantity), price: Number(i.price), position: i.position,
      })) : [newItem()]);
    }
    setLoading(false);
  }, [isEdit, id, company]);

  useEffect(() => { loadInv(); }, [loadInv]);

  const setI = (k, v) => setInv((p) => ({ ...p, [k]: v }));
  const updateItem = (i, k, v) => setItems((p) => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const removeItem = (i)       => setItems((p) => p.length > 1 ? p.filter((_, idx) => idx !== i) : p);
  const addItem    = ()        => setItems((p) => [...p, newItem()]);
  const addServiceItem = (svc) => {
    setItems((p) => {
      const last = p[p.length - 1];
      const filled = { service_id: svc.id, description: svc.name, quantity: 1, price: Number(svc.default_price) || 0, position: p.length - 1 };
      if (!last.description && !last.price) return [...p.slice(0, -1), filled];
      return [...p, filled];
    });
  };

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId) ?? null, [clients, clientId]);

  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0);
  const ivaAmt   = inv.include_iva ? subtotal * (Number(inv.iva_rate) || 0) / 100 : 0;
  const retAmt   = inv.include_retefuente ? subtotal * (Number(inv.retefuente_rate) || 0) / 100 : 0;
  const total    = subtotal + ivaAmt - retAmt;

  const handleSave = async (status = inv.status) => {
    if (!company?.id) { setError('No tienes empresa asociada'); return; }
    setSaving(true); setError('');

    try {
      const payload = {
        company_id: company.id,
        client_id: clientId,
        client_name: selectedClient?.name ?? null,
        client_nit: selectedClient?.nit ?? null,
        client_email: selectedClient?.email ?? null,
        client_phone: selectedClient?.phone ?? null,
        client_address: selectedClient?.address ?? null,
        number: inv.number || null,
        issue_date: inv.issue_date || null,
        due_date: inv.due_date || null,
        concept: inv.concept || null,
        notes: inv.notes || null,
        payment_info: inv.payment_info || null,
        include_iva: inv.include_iva,
        iva_rate: parseFloat(inv.iva_rate) || 0,
        include_retefuente: inv.include_retefuente,
        retefuente_rate: parseFloat(inv.retefuente_rate) || 0,
        subtotal, iva_amount: ivaAmt, retefuente_amount: retAmt, total,
        status,
        updated_at: new Date().toISOString(),
      };

      let invoiceId = id;
      if (isEdit) {
        const { error: e } = await supabase.from('bapesu_invoices').update(payload).eq('id', id);
        if (e) throw e;
      } else {
        const { data, error: e } = await supabase
          .from('bapesu_invoices').insert({ ...payload, created_by: user?.id ?? null }).select('id').single();
        if (e) throw e;
        invoiceId = data.id;
      }

      await supabase.from('bapesu_invoice_items').delete().eq('invoice_id', invoiceId);
      const itemsPayload = items
        .filter((i) => i.description.trim() || i.price > 0)
        .map((i, idx) => ({
          invoice_id: invoiceId,
          service_id: i.service_id,
          description: i.description.trim() || 'Sin descripción',
          quantity: Number(i.quantity) || 1,
          price: Number(i.price) || 0,
          position: idx,
        }));
      if (itemsPayload.length) {
        const { error: e } = await supabase.from('bapesu_invoice_items').insert(itemsPayload);
        if (e) throw e;
      }

      if (!isEdit) navigate(`/dashboard/cobros/invoices/${invoiceId}`, { replace: true });
      else await loadInv();
    } catch (e) {
      setError(e.message ?? 'Error al guardar');
    }
    setSaving(false);
  };

  const handlePrint = async () => {
    if (!isEdit) await handleSave();
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="w-7 h-7 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto" id="invoice-outer">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/cobros?tab=invoices')} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {isEdit ? `Cuenta de cobro #${inv.number}` : 'Nueva cuenta de cobro'}
            </h1>
            <p className="text-xs text-gray-500">{selectedClient?.name ?? 'Sin cliente seleccionado'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select value={inv.status} onChange={(e) => setI('status', e.target.value)} className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-yellow-400/60">
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="paid">Pagada</option>
            <option value="cancelled">Anulada</option>
          </select>
          <button onClick={() => handleSave()} disabled={saving} className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={handlePrint} disabled={saving} className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white text-sm font-semibold transition shadow-[0_4px_14px_rgba(16,185,129,0.3)] disabled:opacity-60">
            Imprimir / PDF
          </button>
        </div>
      </div>

      {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 no-print">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="invoice-grid">

        {/* ── EDITOR ── */}
        <div className="space-y-4 no-print">

          <Card title="Cliente">
            <div>
              <label className={LABEL}>Cliente registrado *</label>
              <select className={INPUT} value={clientId ?? ''} onChange={(e) => setClientId(e.target.value || null)}>
                <option value="">— Selecciona un cliente —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.nit ? ` · ${c.nit}` : ''}</option>)}
              </select>
              {clients.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1.5">
                  No tienes clientes. <a href="/dashboard/clients" className="underline font-semibold">Agrega uno</a>.
                </p>
              )}
            </div>
            {selectedClient && (
              <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs space-y-0.5">
                {selectedClient.nit     && <p className="text-gray-600"><span className="text-gray-400">NIT:</span> {selectedClient.nit}</p>}
                {selectedClient.email   && <p className="text-gray-600"><span className="text-gray-400">Email:</span> {selectedClient.email}</p>}
                {selectedClient.phone   && <p className="text-gray-600"><span className="text-gray-400">Tel:</span> {selectedClient.phone}</p>}
                {selectedClient.address && <p className="text-gray-600"><span className="text-gray-400">Dir:</span> {selectedClient.address}</p>}
              </div>
            )}
          </Card>

          <Card title="Datos de la cuenta de cobro">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Número</label>
                <input className={INPUT} value={inv.number} onChange={(e) => setI('number', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Fecha emisión</label>
                <input type="date" className={INPUT} value={inv.issue_date} onChange={(e) => setI('issue_date', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Fecha vencimiento</label>
                <input type="date" className={INPUT} value={inv.due_date} onChange={(e) => setI('due_date', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Concepto</label>
                <input className={INPUT} value={inv.concept} onChange={(e) => setI('concept', e.target.value)} placeholder="Ej: Servicios prestados en abril 2026" />
              </div>
            </div>
          </Card>

          <Card title="Servicios prestados">
            {services.length > 0 && (
              <div className="mb-3">
                <label className={LABEL}>Agregar desde catálogo</label>
                <div className="flex flex-wrap gap-1.5">
                  {services.map((s) => (
                    <button key={s.id} type="button" onClick={() => addServiceItem(s)}
                      className="px-3 py-1.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      {s.name}
                      <span className="text-[10px] text-emerald-600">{formatCOP(s.default_price)}</span>
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addItem} className="mt-2 w-full py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
              + Agregar ítem manual
            </button>

            {/* IVA + Retefuente */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={inv.include_iva} onChange={(e) => setI('include_iva', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400" />
                  <span className="text-xs text-gray-700 font-medium">IVA</span>
                </label>
                {inv.include_iva && (
                  <input type="number" min="0" max="100" step="0.5" className="mt-2 w-full px-2 py-1 text-xs rounded border border-gray-200" value={inv.iva_rate} onChange={(e) => setI('iva_rate', e.target.value)} />
                )}
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={inv.include_retefuente} onChange={(e) => setI('include_retefuente', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400" />
                  <span className="text-xs text-gray-700 font-medium">Retefuente</span>
                </label>
                {inv.include_retefuente && (
                  <input type="number" min="0" max="100" step="0.5" className="mt-2 w-full px-2 py-1 text-xs rounded border border-gray-200" value={inv.retefuente_rate} onChange={(e) => setI('retefuente_rate', e.target.value)} />
                )}
              </div>
            </div>
          </Card>

          <Card title="Información adicional">
            <div>
              <label className={LABEL}>Notas</label>
              <textarea rows={2} className={INPUT + ' resize-none'} value={inv.notes} onChange={(e) => setI('notes', e.target.value)} />
            </div>
            <div className="mt-3">
              <label className={LABEL}>Información de pago</label>
              <textarea rows={2} className={INPUT + ' resize-none'} value={inv.payment_info} onChange={(e) => setI('payment_info', e.target.value)} placeholder="Bancolombia · Ahorros · 123-456-789-00" />
            </div>
          </Card>
        </div>

        {/* ── PREVIEW ── */}
        <div id="invoice-preview-col">
          <div id="invoice-print" className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden text-gray-900">
            {/* Header */}
            <div style={{ background: '#064e3b', color: '#fff' }} className="px-7 py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {company?.logo_url && (
                  <div className="flex-shrink-0 bg-white rounded-xl p-1.5 shadow-md">
                    <img
                      src={company.logo_url}
                      alt="logo"
                      className="h-14 w-14 object-contain rounded-lg"
                      onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold leading-tight truncate">{company?.name ?? 'TU EMPRESA'}</h2>
                  {company?.nit && <p className="text-[10px] opacity-80 mt-0.5">NIT: {company.nit}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest opacity-70">Cuenta de cobro</p>
                <p className="text-2xl font-extrabold">N° {inv.number || '—'}</p>
                <p className="text-[10px] opacity-70 mt-1">{inv.issue_date && new Date(inv.issue_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Cliente */}
            <div className="px-7 py-4 grid grid-cols-2 gap-4 border-b border-gray-100">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Debe a</p>
                <p className="text-sm font-bold">{company?.name ?? '—'}</p>
                {company?.nit && <p className="text-[11px] text-gray-500">NIT: {company.nit}</p>}
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Por concepto de</p>
                <p className="text-sm font-semibold">{selectedClient?.name ?? 'Selecciona un cliente'}</p>
                {selectedClient?.nit && <p className="text-[11px] text-gray-500">NIT: {selectedClient.nit}</p>}
              </div>
            </div>

            {inv.concept && (
              <div className="px-7 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Concepto</p>
                <p className="text-xs text-gray-700">{inv.concept}</p>
              </div>
            )}

            {/* Items */}
            <table className="w-full text-xs">
              <thead style={{ background: '#047857', color: '#fff' }}>
                <tr>
                  <th className="px-7 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">Descripción</th>
                  <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider text-[10px] w-12">Cant.</th>
                  <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider text-[10px] w-28">Precio</th>
                  <th className="px-7 py-2 text-right font-semibold uppercase tracking-wider text-[10px] w-32">Total</th>
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
              <div className="w-72 text-xs space-y-1">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-semibold">{formatCOP(subtotal)}</span></div>
                {inv.include_iva && <div className="flex justify-between text-gray-600"><span>IVA ({inv.iva_rate}%)</span><span className="font-semibold">{formatCOP(ivaAmt)}</span></div>}
                {inv.include_retefuente && <div className="flex justify-between text-red-600"><span>Retefuente (-{inv.retefuente_rate}%)</span><span className="font-semibold">-{formatCOP(retAmt)}</span></div>}
                <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
                  <span className="font-bold text-gray-900">TOTAL</span>
                  <span className="font-extrabold" style={{ color: '#047857' }}>{formatCOP(total)}</span>
                </div>
                <p className="text-[10px] text-gray-400 italic mt-1 text-right capitalize">{numberToWords(total)}</p>
              </div>
            </div>

            {inv.payment_info && (
              <div className="px-7 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Información de pago</p>
                <p className="text-[11px] text-gray-700 whitespace-pre-line">{inv.payment_info}</p>
              </div>
            )}

            {inv.notes && (
              <div className="px-7 py-3 border-t border-gray-100">
                <p className="text-[11px] text-gray-600 whitespace-pre-line italic">{inv.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ background: '#064e3b', color: '#fff' }} className="px-7 py-3 text-[10px] flex items-center justify-between flex-wrap gap-2">
              <span>{company?.phone}</span>
              <span>{company?.email}</span>
              <span>{company?.address}{company?.city ? `, ${company.city}` : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body * { visibility: hidden !important; }
          #invoice-print, #invoice-print * { visibility: visible !important; }
          #invoice-print {
            position: fixed !important; top: 0; left: 0; width: 100vw;
            border: none !important; box-shadow: none !important; border-radius: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          #invoice-print * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
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
