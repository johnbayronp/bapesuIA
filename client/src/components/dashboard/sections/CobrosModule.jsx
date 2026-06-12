import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { facturasApi, invoicesApi } from '../../../api';
import { useCompany } from '../../../context/CompanyContext';
import { useConvertInvoiceToFactura } from '../../../hooks/useInvoices';
import { queryKeys } from '../../../lib/queryKeys';
import { invalidateCompanyData, unwrapSupabaseResponse } from '../../../lib/queryUtils';

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

// ── Status configs ────────────────────────────────────────────────────
const INV_STATUS = {
  draft:     { label: 'Borrador', bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
  sent:      { label: 'Enviada',  bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  paid:      { label: 'Pagada',   bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Anulada',  bg: 'bg-red-100',     text: 'text-red-600',     dot: 'bg-red-400' },
};

const TABS = [
  {
    id: 'invoices',
    label: 'Cuentas de cobro',
    icon: '🧾',
    color: 'emerald',
    newHref: '/dashboard/cobros/invoices/new',
    newLabel: 'Nueva cuenta de cobro',
  },
  {
    id: 'facturas',
    label: 'Facturas',
    icon: '📄',
    color: 'violet',
    newHref: '/dashboard/cobros/facturas/new',
    newLabel: 'Nueva factura',
  },
];

export default function CobrosModule() {
  const { company } = useCompany();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') === 'facturas' ? 'facturas' : 'invoices';
  const setTab    = (t) => setSearchParams({ tab: t }, { replace: true });

  // ── Estado compartido ─────────────────────────────────────────────
  const [search,    setSearch]    = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [deleting,  setDeleting]  = useState(null);

  const invoicesQuery = useQuery({
    queryKey: queryKeys.company.invoices(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => invoicesApi.list(company.id).then(unwrapSupabaseResponse),
  });

  const facturasQuery = useQuery({
    queryKey: queryKeys.company.facturas(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => facturasApi.list(company.id).then(unwrapSupabaseResponse),
  });

  const invoices = invoicesQuery.data ?? [];
  const facturas = facturasQuery.data ?? [];
  const loading = invoicesQuery.isLoading || facturasQuery.isLoading;
  const invalidate = () => invalidateCompanyData(queryClient, company?.id);
  const convertInvoice = useConvertInvoiceToFactura(company?.id);

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id) => {
      const response = await invoicesApi.remove(id);
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const deleteFacturaMutation = useMutation({
    mutationFn: async (id) => {
      const response = await facturasApi.remove(id);
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await invoicesApi.update(id, { status, updated_at: new Date().toISOString() });
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const updateFacturaStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await facturasApi.update(id, { status, updated_at: new Date().toISOString() });
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  // Reset filtros al cambiar de tab
  useEffect(() => { setSearch(''); setStatus('all'); }, [activeTab]);

  // ── Acciones cuentas de cobro ─────────────────────────────────────
  const handleDeleteInvoice = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta cuenta de cobro?')) return;
    setDeleting(id);
    await deleteInvoiceMutation.mutateAsync(id);
    setDeleting(null);
  };

  const handleConvertToFactura = async (inv, e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Convertir cuenta de cobro #${inv.number} a factura?\nSe creará pre-llenada con los mismos datos.`)) return;
    try {
      const newFac = await convertInvoice.mutateAsync(inv);
      navigate(`/dashboard/cobros/facturas/${newFac.id}`);
    } catch (err) { alert('Error: ' + (err.message ?? 'intenta de nuevo')); }
  };

  // ── Acciones facturas ─────────────────────────────────────────────
  const handleDeleteFactura = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta factura?')) return;
    setDeleting(id);
    await deleteFacturaMutation.mutateAsync(id);
    setDeleting(null);
  };

  const handleFacturaStatus = async (id, status, e) => {
    e.stopPropagation();
    await updateFacturaStatusMutation.mutateAsync({ id, status });
  };

  const handleInvoiceStatus = async (id, status, e) => {
    e.stopPropagation();
    await updateInvoiceStatusMutation.mutateAsync({ id, status });
  };

  // ── Datos del tab activo ──────────────────────────────────────────
  const tab    = TABS.find((t) => t.id === activeTab);
  const list   = activeTab === 'invoices' ? invoices : facturas;
  const filtered = useMemo(() => list.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (d.client_name ?? '').toLowerCase().includes(q) ||
        (d.number ?? '').toLowerCase().includes(q) ||
        (d.client_nit ?? '').toLowerCase().includes(q) ||
        (d.concept ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  }), [list, search, statusFilter]);

  // KPIs unificados (ambos tabs)
  const today     = new Date().toISOString().slice(0, 10);
  const allDocs   = [...invoices, ...facturas];

  const totalPaid     = allDocs.filter((d) => d.status === 'paid').reduce((a, d) => a + Number(d.total || 0), 0);
  // Enviadas con fecha de vence futura o sin fecha → por cobrar vigente
  const totalPend     = allDocs.filter((d) => d.status === 'sent' && (!d.due_date || d.due_date >= today)).reduce((a, d) => a + Number(d.total || 0), 0);
  // Enviadas con fecha de vence pasada → cartera vencida
  const totalOverdue  = allDocs.filter((d) => d.status === 'sent' && d.due_date && d.due_date < today).reduce((a, d) => a + Number(d.total || 0), 0);
  // Borradores sin enviar
  const totalDraft    = allDocs.filter((d) => d.status === 'draft').reduce((a, d) => a + Number(d.total || 0), 0);

  const tabPaid    = list.filter((d) => d.status === 'paid').reduce((a, d) => a + Number(d.total || 0), 0);
  const tabPend    = list.filter((d) => d.status === 'sent' && (!d.due_date || d.due_date >= today)).reduce((a, d) => a + Number(d.total || 0), 0);
  const tabOverdue = list.filter((d) => d.status === 'sent' && d.due_date && d.due_date < today).reduce((a, d) => a + Number(d.total || 0), 0);

  const accentBtn = activeTab === 'invoices'
    ? 'from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 shadow-[0_4px_16px_rgba(16,185,129,0.3)]'
    : 'from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-[0_4px_16px_rgba(139,92,246,0.3)]';

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Cobros</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {allDocs.length} documento{allDocs.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Link
          to={tab.newHref}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${accentBtn} text-white font-semibold text-sm transition`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          {tab.newLabel}
        </Link>
      </div>

      {/* KPIs globales — fila 1: métricas financieras */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {[
          {
            label: 'Cobrado',
            sub: 'Documentos pagados',
            value: formatCOP(totalPaid),
            icon: '✅',
            valueColor: 'text-emerald-600',
            border: 'border-emerald-100',
            iconBg: 'from-emerald-400 to-teal-500',
          },
          {
            label: 'Por cobrar',
            sub: 'Enviadas y vigentes',
            value: formatCOP(totalPend),
            icon: '🟡',
            valueColor: 'text-amber-600',
            border: 'border-amber-100',
            iconBg: 'from-yellow-400 to-amber-500',
          },
          {
            label: 'Vencido',
            sub: 'Enviadas, fecha pasada',
            value: formatCOP(totalOverdue),
            icon: '⏳',
            valueColor: totalOverdue > 0 ? 'text-red-600' : 'text-gray-400',
            border: totalOverdue > 0 ? 'border-red-100' : 'border-gray-100',
            iconBg: totalOverdue > 0 ? 'from-red-400 to-rose-500' : 'from-gray-300 to-gray-400',
          },
          {
            label: 'Borradores',
            sub: 'Sin enviar al cliente',
            value: formatCOP(totalDraft),
            icon: '📄',
            valueColor: 'text-gray-500',
            border: 'border-gray-100',
            iconBg: 'from-gray-300 to-gray-400',
          },
        ].map((k) => (
          <div key={k.label} className={`bg-white border ${k.border} rounded-2xl p-4 shadow-sm flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.iconBg} flex items-center justify-center text-base flex-shrink-0`}>
              {k.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{k.label}</p>
              <p className={`text-base font-extrabold truncate ${k.valueColor}`}>{k.value}</p>
              <p className="text-[10px] text-gray-400 truncate">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* KPIs globales — fila 2: conteo de documentos */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'Cuentas de cobro', value: invoices.length, icon: '🧾', color: 'from-emerald-300 to-teal-400', valueColor: 'text-teal-700' },
          { label: 'Facturas',         value: facturas.length, icon: '📑', color: 'from-violet-400 to-indigo-500', valueColor: 'text-violet-700' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-sm flex-shrink-0`}>
              {k.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{k.label}</p>
              <p className={`text-base font-extrabold ${k.valueColor}`}>{k.value} <span className="text-xs font-normal text-gray-400">documentos</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-5 w-fit">
        {TABS.map((t) => {
          const isActive = t.id === activeTab;
          const count    = t.id === 'invoices' ? invoices.length : facturas.length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? t.id === 'invoices'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isActive
                  ? t.id === 'invoices' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats del tab activo */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full ${activeTab === 'invoices' ? 'bg-emerald-500' : 'bg-violet-500'}`} />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pagado</p>
            <p className={`text-base font-extrabold ${activeTab === 'invoices' ? 'text-emerald-600' : 'text-violet-600'}`}>{formatCOP(tabPaid)}</p>
          </div>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-2 h-8 rounded-full bg-amber-400" />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Por cobrar</p>
            <p className="text-base font-extrabold text-amber-600">{formatCOP(tabPend)}</p>
          </div>
        </div>
        <div className={`bg-white border rounded-xl p-3 shadow-sm flex items-center gap-3 ${tabOverdue > 0 ? 'border-red-100' : 'border-gray-200'}`}>
          <div className={`w-2 h-8 rounded-full ${tabOverdue > 0 ? 'bg-red-400' : 'bg-gray-300'}`} />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Vencido</p>
            <p className={`text-base font-extrabold ${tabOverdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCOP(tabOverdue)}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Buscar ${tab.label.toLowerCase()}...`}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[['all', 'Todos'], ['draft', 'Borrador'], ['sent', 'Enviado'], ['paid', 'Pagado'], ['cancelled', 'Anulado']].map(([k, l]) => (
            <button key={k} onClick={() => setStatus(k)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                statusFilter === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>{l}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl text-center">
          <span className="text-4xl mb-3">{tab.icon}</span>
          <p className="text-gray-700 font-semibold">{search || statusFilter !== 'all' ? 'Sin resultados' : `Aún no hay ${tab.label.toLowerCase()}`}</p>
          {!search && statusFilter === 'all' && (
            <Link to={tab.newHref} className={`mt-4 text-sm font-medium ${activeTab === 'invoices' ? 'text-emerald-600 hover:text-emerald-700' : 'text-violet-600 hover:text-violet-700'}`}>
              + Crear el primero
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Cabecera tabla */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
            <div className="col-span-2">Número</div>
            <div className="col-span-2">Cliente</div>
            <div className="col-span-2">Emisión</div>
            <div className="col-span-1">Vence / Días</div>
            <div className="col-span-1">Estado</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-3 text-right">Acciones</div>
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.map((doc) => {
              const st      = INV_STATUS[doc.status] ?? INV_STATUS.draft;
              const editHref = activeTab === 'invoices'
                ? `/dashboard/cobros/invoices/${doc.id}`
                : `/dashboard/cobros/facturas/${doc.id}`;
              const numLabel = activeTab === 'invoices'
                ? `#${doc.number ?? '—'}`
                : `${doc.prefix ?? 'FAC'}-${doc.number ?? '—'}`;
              const overdue = doc.status === 'sent' && doc.due_date && doc.due_date < today;
              const overdueDays = overdue
                ? Math.floor((new Date(today) - new Date(doc.due_date + 'T12:00:00')) / 86400000)
                : 0;

              return (
                <div
                  key={doc.id}
                  onClick={() => navigate(editHref)}
                  className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-gray-50 transition cursor-pointer ${overdue ? 'bg-red-50/30' : ''}`}
                >
                  <div className="col-span-6 md:col-span-2">
                    <span className={`text-sm font-bold ${activeTab === 'invoices' ? 'text-emerald-600' : 'text-violet-600'}`}>{numLabel}</span>
                  </div>
                  <div className="col-span-6 md:col-span-2 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.client_name ?? '—'}</p>
                    {doc.client_nit && <p className="text-[11px] text-gray-400">NIT: {doc.client_nit}</p>}
                  </div>
                  <div className="hidden md:block col-span-2 text-xs text-gray-500">
                    {doc.issue_date ? new Date(doc.issue_date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                  <div className="hidden md:block col-span-1">
                    <p className={`text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {doc.due_date ? new Date(doc.due_date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '—'}
                    </p>
                    {overdue && (
                      <span className="inline-block mt-0.5 text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full leading-none">
                        {overdueDays}d vencido
                      </span>
                    )}
                  </div>
                  <div className="col-span-3 md:col-span-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.bg} ${st.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                  <div className="col-span-3 md:col-span-1 text-right">
                    <p className="text-sm font-extrabold text-gray-900">{formatCOP(doc.total)}</p>
                  </div>

                  {/* Acciones */}
                  <div className="col-span-6 md:col-span-3 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>

                    {/* Convertir a factura */}
                    {activeTab === 'invoices' && doc.status === 'paid' && (
                      <button onClick={(e) => handleConvertToFactura(doc, e)} title="Convertir a factura"
                        className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200 flex items-center justify-center transition">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </button>
                    )}

                    {/* Marcar enviado */}
                    {doc.status === 'draft' && (
                      <button onClick={(e) => activeTab === 'invoices' ? handleInvoiceStatus(doc.id, 'sent', e) : handleFacturaStatus(doc.id, 'sent', e)}
                        title="Marcar enviado"
                        className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      </button>
                    )}

                    {/* Marcar pagado */}
                    {doc.status === 'sent' && (
                      <button onClick={(e) => activeTab === 'invoices' ? handleInvoiceStatus(doc.id, 'paid', e) : handleFacturaStatus(doc.id, 'paid', e)}
                        title="Marcar pagado"
                        className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center transition">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                      </button>
                    )}

                    {/* Editar */}
                    <button onClick={(e) => { e.stopPropagation(); navigate(editHref); }}
                      title="Editar"
                      className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center transition">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    </button>

                    {/* Eliminar */}
                    <button onClick={(e) => activeTab === 'invoices' ? handleDeleteInvoice(doc.id, e) : handleDeleteFactura(doc.id, e)}
                      disabled={deleting === doc.id} title="Eliminar"
                      className="w-8 h-8 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition disabled:opacity-40">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
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
