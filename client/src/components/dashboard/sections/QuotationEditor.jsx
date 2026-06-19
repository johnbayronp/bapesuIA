import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientsApi, quotationsApi, servicesApi } from '../../../api';
import { useCompany } from '../../../context/CompanyContext';
import { evictNewEditorCache } from '../routeCacheApi';
import { queryKeys } from '../../../lib/queryKeys';
import { invalidateCompanyData, unwrapSupabaseCount, unwrapSupabaseResponse, unwrapSupabaseSingle } from '../../../lib/queryUtils';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0,
}).format(n || 0);

const INPUT = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400 transition';
const LABEL = 'block text-xs font-medium text-gray-600 mb-1';

function lightenHex(hex, amount) {
  const h = (hex || '#0f172a').replace('#', '');
  if (h.length < 6) return hex;
  const r = Math.min(255, parseInt(h.slice(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(h.slice(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(h.slice(4, 6), 16) + amount);
  return `rgb(${r},${g},${b})`;
}

const DEFAULT_QUOTE = {
  number: '',
  issue_date: new Date().toISOString().slice(0, 10),
  valid_days: 30,
  project_type: '',
  objective: '',
  signature_name: '',
  terms: 'Esta cotización tiene una validez de los días aquí indicados.\nLos pagos se realizan según las condiciones acordadas.',
  include_iva: false,
  iva_rate: 19,
  status: 'draft',
};

const newItem = () => ({
  service_id: null,
  description: '',
  quantity: 1,
  price: 0,
  position: 0,
});

export default function QuotationEditor() {
  const { user, company } = useCompany();
  const brandColor  = company?.brand_color || '#0f172a';
  const accentColor = lightenHex(brandColor, 35);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [error, setError]     = useState('');

  const [quote, setQuote]   = useState(DEFAULT_QUOTE);
  const [items, setItems]   = useState([newItem()]);
  const [clientId, setClientId] = useState(null);

  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: [...queryKeys.company.clients(company?.id), 'select'],
    enabled: Boolean(company?.id),
    queryFn: () => clientsApi.listForSelect(company.id, 'id, name, nit, email, phone, city, address').then(unwrapSupabaseResponse),
  });
  const servicesQuery = useQuery({
    queryKey: [...queryKeys.company.services(company?.id), 'active-select'],
    enabled: Boolean(company?.id),
    queryFn: () => servicesApi.listActiveForSelect(company.id, 'id, name, default_price, unit, is_active').then(unwrapSupabaseResponse),
  });
  const nextNumberQuery = useQuery({
    queryKey: [...queryKeys.company.quotations(company?.id), 'next-number'],
    enabled: Boolean(company?.id) && !isEdit,
    queryFn: () => quotationsApi.countByCompany(company.id).then(unwrapSupabaseCount),
  });
  const quotationQuery = useQuery({
    queryKey: queryKeys.company.quotation(id),
    enabled: Boolean(company?.id) && isEdit,
    queryFn: async () => {
      const [quotation, quotationItems] = await Promise.all([
        quotationsApi.get(id).then(unwrapSupabaseSingle),
        quotationsApi.getItems(id).then(unwrapSupabaseResponse),
      ]);
      return { quotation, quotationItems };
    },
  });

  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);
  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);

  useEffect(() => {
    if (isEdit || nextNumberQuery.data == null) return;
    setQuote((p) => ({ ...p, number: String((nextNumberQuery.data ?? 0) + 1).padStart(3, '0') }));
  }, [isEdit, nextNumberQuery.data]);

  // Pre-cargar firma con email del usuario
  useEffect(() => {
    if (!user || isEdit) return;
    setQuote((p) => p.signature_name ? p : { ...p, signature_name: user.email?.split('@')[0]?.toUpperCase() ?? '' });
  }, [user, isEdit]);

  // Cargar cotizaci??n existente
  useEffect(() => {
    if (!isEdit) return;
    const q = quotationQuery.data?.quotation;
    if (q) {
      setQuote({
        number: q.number ?? '',
        issue_date: q.issue_date ?? DEFAULT_QUOTE.issue_date,
        valid_days: q.valid_days ?? 30,
        project_type: q.project_type ?? '',
        objective: q.objective ?? '',
        signature_name: q.signature_name ?? '',
        terms: q.terms ?? '',
        include_iva: q.include_iva ?? false,
        iva_rate: q.iva_rate ?? 19,
        status: q.status ?? 'draft',
      });
      setClientId(q.client_id ?? null);

      const its = quotationQuery.data?.quotationItems ?? [];
      setItems(its && its.length ? its.map((i) => ({
        service_id: i.service_id, description: i.description, quantity: Number(i.quantity), price: Number(i.price), position: i.position,
      })) : [newItem()]);
    }
  }, [quotationQuery.data, isEdit]);

  const setQ  = (k, v) => setQuote((p) => ({ ...p, [k]: v }));

  // Items
  const updateItem = (i, k, v) => setItems((p) => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const removeItem = (i)       => setItems((p) => p.length > 1 ? p.filter((_, idx) => idx !== i) : p);
  const addItem    = ()        => setItems((p) => [...p, newItem()]);

  // Insertar servicio del catálogo
  const addServiceItem = (svc) => {
    setItems((p) => {
      // Si el último item está vacío, lo reemplazo
      const last = p[p.length - 1];
      const filled = { service_id: svc.id, description: svc.name, quantity: 1, price: Number(svc.default_price) || 0, position: p.length - 1 };
      if (!last.description && !last.price) return [...p.slice(0, -1), filled];
      return [...p, filled];
    });
  };

  // Cliente seleccionado
  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId) ?? null, [clients, clientId]);

  // Totales
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0);
  const ivaAmt   = quote.include_iva ? subtotal * (Number(quote.iva_rate) || 0) / 100 : 0;
  const total    = subtotal + ivaAmt;

  // Guardar
  const saveMutation = useMutation({
    mutationFn: async (status = quote.status) => {
      const payload = {
        company_id: company.id,
        client_id: clientId,
        client_name:  selectedClient?.name ?? null,
        client_nit:   selectedClient?.nit ?? null,
        client_email: selectedClient?.email ?? null,
        client_phone: selectedClient?.phone ?? null,
        number: quote.number || null,
        issue_date: quote.issue_date || null,
        valid_days: parseInt(quote.valid_days) || 30,
        project_type: quote.project_type || null,
        objective: quote.objective || null,
        signature_name: quote.signature_name || null,
        terms: quote.terms || null,
        include_iva: quote.include_iva,
        iva_rate: parseFloat(quote.iva_rate) || 0,
        subtotal, iva_amount: ivaAmt, total,
        status,
        updated_at: new Date().toISOString(),
      };

      let quotationId = id;
      if (isEdit) {
        const { error: e } = await quotationsApi.update(id, payload);
        if (e) throw e;
      } else {
        const { data, error: e } = await quotationsApi.create({ ...payload, created_by: user?.id ?? null });
        if (e) throw e;
        quotationId = data.id;
      }

      const removeRes = await quotationsApi.removeItems(quotationId);
      if (removeRes.error) throw removeRes.error;
      const itemsPayload = items
        .filter((i) => i.description.trim() || i.price > 0)
        .map((i, idx) => ({
          quotation_id: quotationId,
          service_id: i.service_id,
          description: i.description.trim() || 'Sin descripci?n',
          quantity: Number(i.quantity) || 1,
          price: Number(i.price) || 0,
          position: idx,
        }));
      if (itemsPayload.length) {
        const { error: e } = await quotationsApi.addItems(itemsPayload);
        if (e) throw e;
      }

      return quotationId;
    },
    onSuccess: async (quotationId) => {
      await invalidateCompanyData(queryClient, company?.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.company.quotation(quotationId) });
      if (!isEdit) {
        evictNewEditorCache('quotation');
        navigate(`/dashboard/quotations/${quotationId}`, { replace: true });
      } else {
        await quotationQuery.refetch();
      }
    },
  });

  const handleSave = async (status = quote.status) => {
    if (!company?.id) { setError('No tienes empresa asociada'); return; }
    setError('');

    try {
      await saveMutation.mutateAsync(status);
    } catch (e) {
      setError(e.message ?? 'Error al guardar');
    }
  };
  const handlePrint = async () => {
    if (!isEdit) await handleSave();
    window.print();
  };

  const loading = (isEdit && quotationQuery.isLoading) || clientsQuery.isLoading || servicesQuery.isLoading;
  const saving = saveMutation.isPending;

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
    <div className="max-w-6xl mx-auto" id="cotizacion-outer">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => { evictNewEditorCache('quotation'); navigate('/dashboard/quotations'); }} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {isEdit ? `Cotización #${quote.number}` : 'Nueva cotización'}
            </h1>
            <p className="text-xs text-gray-500">{selectedClient?.name ?? 'Sin cliente seleccionado'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select value={quote.status} onChange={(e) => setQ('status', e.target.value)} className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-yellow-400/60">
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="accepted">Aceptada</option>
            <option value="rejected">Rechazada</option>
          </select>
          <button onClick={() => handleSave()} disabled={saving} className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={handlePrint} disabled={saving} className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 text-sm font-semibold transition shadow-[0_4px_14px_rgba(245,158,11,0.3)] disabled:opacity-60">
            Imprimir / PDF
          </button>
        </div>
      </div>

      {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 no-print">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="cotizacion-grid">

        {/* ── EDITOR ── */}
        <div className="space-y-4 no-print">

          {/* Cliente */}
          <Card title="Cliente">
            <div>
              <label className={LABEL}>Cliente registrado *</label>
              <select className={INPUT} value={clientId ?? ''} onChange={(e) => setClientId(e.target.value || null)}>
                <option value="">— Selecciona un cliente —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.nit ? ` · ${c.nit}` : ''}</option>)}
              </select>
              {clients.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1.5">
                  No tienes clientes registrados. <a href="/dashboard/clients" className="underline font-semibold">Agrega uno aquí</a>.
                </p>
              )}
            </div>
            {selectedClient && (
              <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs space-y-0.5">
                {selectedClient.nit && <p className="text-gray-600"><span className="text-gray-400">NIT:</span> {selectedClient.nit}</p>}
                {selectedClient.email && <p className="text-gray-600"><span className="text-gray-400">Email:</span> {selectedClient.email}</p>}
                {selectedClient.phone && <p className="text-gray-600"><span className="text-gray-400">Tel:</span> {selectedClient.phone}</p>}
                {selectedClient.city && <p className="text-gray-600"><span className="text-gray-400">Ciudad:</span> {selectedClient.city}</p>}
              </div>
            )}
          </Card>

          {/* Datos */}
          <Card title="Datos de la cotización">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Número</label>
                <input className={INPUT} value={quote.number} onChange={(e) => setQ('number', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Fecha</label>
                <input type="date" className={INPUT} value={quote.issue_date} onChange={(e) => setQ('issue_date', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Validez (días)</label>
                <input type="number" min="1" className={INPUT} value={quote.valid_days} onChange={(e) => setQ('valid_days', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Tipo de proyecto</label>
                <input className={INPUT} value={quote.project_type} onChange={(e) => setQ('project_type', e.target.value)} placeholder="Ej: Diseño web" />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Objetivo / descripción</label>
                <textarea rows={2} className={INPUT + ' resize-none'} value={quote.objective} onChange={(e) => setQ('objective', e.target.value)} placeholder="¿Cuál es el objetivo del proyecto?" />
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card title="Servicios e ítems">
            {/* Selector rápido del catálogo */}
            {services.length > 0 && (
              <div className="mb-3">
                <label className={LABEL}>Agregar desde catálogo</label>
                <div className="flex flex-wrap gap-1.5">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addServiceItem(s)}
                      className="px-3 py-1.5 text-xs rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition flex items-center gap-1.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      {s.name}
                      <span className="text-[10px] text-yellow-600">{formatCOP(s.default_price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {services.length === 0 && (
              <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
                No tienes servicios en el catálogo. <a href="/dashboard/services" className="underline font-semibold">Crea uno aquí</a> para reutilizarlo.
              </div>
            )}

            {/* Items */}
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start p-2 rounded-lg bg-gray-50">
                  <div className="col-span-12 sm:col-span-6">
                    <input
                      className={INPUT}
                      value={it.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      placeholder="Descripción del servicio"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <input
                      type="number" min="0" step="0.5"
                      className={INPUT}
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      placeholder="Cant."
                    />
                  </div>
                  <div className="col-span-7 sm:col-span-3">
                    <input
                      type="number" min="0" step="1000"
                      className={INPUT}
                      value={it.price}
                      onChange={(e) => updateItem(idx, 'price', e.target.value)}
                      placeholder="Precio"
                    />
                  </div>
                  <button onClick={() => removeItem(idx)} className="col-span-2 sm:col-span-1 w-9 h-9 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition mx-auto">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addItem} className="mt-2 w-full py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-500 hover:border-yellow-400 hover:text-yellow-600 hover:bg-yellow-50 transition">
              + Agregar ítem manual
            </button>

            {/* IVA */}
            <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={quote.include_iva} onChange={(e) => setQ('include_iva', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400" />
                <span className="text-xs text-gray-700 font-medium">Incluir IVA</span>
              </label>
              {quote.include_iva && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-[11px] text-gray-500">Tasa:</label>
                  <input type="number" min="0" max="100" step="0.5" className="w-20 px-2 py-1 text-xs rounded border border-gray-200" value={quote.iva_rate} onChange={(e) => setQ('iva_rate', e.target.value)} />
                  <span className="text-[11px] text-gray-500">%</span>
                </div>
              )}
            </div>
          </Card>

          {/* Términos y firma */}
          <Card title="Términos y firma">
            <div>
              <label className={LABEL}>Firmado por</label>
              <input className={INPUT} value={quote.signature_name} onChange={(e) => setQ('signature_name', e.target.value)} />
            </div>
            <div className="mt-3">
              <label className={LABEL}>Términos y condiciones</label>
              <textarea rows={3} className={INPUT + ' resize-none'} value={quote.terms} onChange={(e) => setQ('terms', e.target.value)} />
            </div>
          </Card>
        </div>

        {/* ── PREVIEW IMPRIMIBLE ── */}
        <div id="cotizacion-preview-col">
          <div id="cotizacion-print" className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden text-gray-900">

            {/* Header */}
            <div style={{ background: brandColor, color: '#fff' }} className="px-7 py-5 flex items-center justify-between gap-4">
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
                  <p className="text-[10px] opacity-80 tracking-widest mt-0.5">{company?.tagline ?? ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest opacity-70">Cotización</p>
                <p className="text-2xl font-extrabold">N° {quote.number || '—'}</p>
                <p className="text-[10px] opacity-70 mt-1">{new Date(quote.issue_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Cliente */}
            <div className="px-7 py-4 grid grid-cols-2 gap-4 border-b border-gray-100">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Cliente</p>
                <p className="text-sm font-bold">{selectedClient?.name ?? 'Selecciona un cliente'}</p>
                {selectedClient?.nit && <p className="text-[11px] text-gray-500">NIT: {selectedClient.nit}</p>}
                {selectedClient?.email && <p className="text-[11px] text-gray-500">{selectedClient.email}</p>}
                {selectedClient?.phone && <p className="text-[11px] text-gray-500">{selectedClient.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Proyecto</p>
                <p className="text-sm font-semibold">{quote.project_type || '—'}</p>
                <p className="text-[11px] text-gray-500 mt-1">Validez: {quote.valid_days} días</p>
              </div>
            </div>

            {quote.objective && (
              <div className="px-7 py-3 border-b border-gray-100">
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Objetivo</p>
                <p className="text-xs text-gray-700 whitespace-pre-line">{quote.objective}</p>
              </div>
            )}

            {/* Items */}
            <table className="w-full text-xs">
              <thead style={{ background: accentColor, color: '#fff' }}>
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
              <div className="w-64 text-xs space-y-1">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-semibold">{formatCOP(subtotal)}</span></div>
                {quote.include_iva && (
                  <div className="flex justify-between text-gray-600"><span>IVA ({quote.iva_rate}%)</span><span className="font-semibold">{formatCOP(ivaAmt)}</span></div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
                  <span className="font-bold text-gray-900">TOTAL</span>
                  <span className="font-extrabold" style={{ color: brandColor }}>{formatCOP(total)}</span>
                </div>
              </div>
            </div>

            {/* Términos */}
            {quote.terms && (
              <div className="px-7 py-4 border-t border-gray-100 bg-gray-50">
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Términos</p>
                <p className="text-[11px] text-gray-600 whitespace-pre-line leading-relaxed">{quote.terms}</p>
              </div>
            )}

            {/* Firma */}
            <div className="px-7 py-5 border-t border-gray-100">
              <p className="text-[10px] text-gray-400">Atentamente,</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{quote.signature_name || '—'}</p>
              <p className="text-[10px] text-gray-500">{company?.name}</p>
            </div>

            {/* Footer empresa */}
            <div style={{ background: brandColor, color: '#fff' }} className="px-7 py-3 text-[10px] flex items-center justify-between flex-wrap gap-2">
              <span>{company?.phone}</span>
              <span>{company?.email}</span>
              <span>{company?.instagram}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body * { visibility: hidden !important; }
          #cotizacion-print, #cotizacion-print * { visibility: visible !important; }
          #cotizacion-print {
            position: fixed !important; top: 0; left: 0; width: 100vw;
            border: none !important; box-shadow: none !important; border-radius: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          #cotizacion-print * {
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
