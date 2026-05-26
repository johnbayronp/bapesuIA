import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../context/CompanyContext';

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

const FACTURA_PREFIX = 'FAC';

export default function CobrosModule() {
  const { company } = useCompany();
  const navigate    = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') === 'facturas' ? 'facturas' : 'invoices';
  const setTab    = (t) => setSearchParams({ tab: t }, { replace: true });

  // ── Estado compartido ─────────────────────────────────────────────
  const [invoices,  setInvoices]  = useState([]);
  const [facturas,  setFacturas]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [deleting,  setDeleting]  = useState(null);

  const load = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    const [inv, fac] = await Promise.all([
      supabase.from('bapesu_invoices').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('bapesu_facturas').select('id,prefix,number,issue_date,due_date,client_name,client_nit,total,status').eq('company_id', company.id).order('created_at', { ascending: false }),
    ]);
    setInvoices(inv.data ?? []);
    setFacturas(fac.data ?? []);
    setLoading(false);
  }, [company]);

  useEffect(() => { load(); }, [load]);

  // Reset filtros al cambiar de tab
  useEffect(() => { setSearch(''); setStatus('all'); }, [activeTab]);

  // ── Acciones cuentas de cobro ─────────────────────────────────────
  const handleDeleteInvoice = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta cuenta de cobro?')) return;
    setDeleting(id);
    await supabase.from('bapesu_invoices').delete().eq('id', id);
    await load();
    setDeleting(null);
  };

  const handleConvertToFactura = async (inv, e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Convertir cuenta de cobro #${inv.number} a factura?\nSe creará pre-llenada con los mismos datos.`)) return;
    try {
      const { data: items } = await supabase.from('bapesu_invoice_items').select('*').eq('invoice_id', inv.id).order('position');
      const { count } = await supabase.from('bapesu_facturas').select('id', { count: 'exact', head: true }).eq('company_id', company.id);
      const newNumber = String((count ?? 0) + 1).padStart(3, '0');
      const { data: newFac, error } = await supabase.from('bapesu_facturas').insert({
        company_id: company.id, client_id: inv.client_id,
        client_name: inv.client_name, client_nit: inv.client_nit,
        client_email: inv.client_email, client_phone: inv.client_phone, client_address: inv.client_address,
        prefix: FACTURA_PREFIX, number: newNumber,
        issue_date: inv.issue_date, due_date: inv.due_date,
        concept: inv.concept, notes: inv.notes, payment_info: inv.payment_info,
        include_iva: inv.include_iva, iva_rate: inv.iva_rate,
        include_retefuente: inv.include_retefuente, retefuente_rate: inv.retefuente_rate,
        include_reteiva: false, reteiva_rate: 15, include_reteica: false, reteica_rate: 0.414,
        subtotal: inv.subtotal, iva_amount: inv.iva_amount,
        retefuente_amount: inv.retefuente_amount, reteiva_amount: 0, reteica_amount: 0,
        total: inv.total, status: 'draft',
      }).select('id').single();
      if (error) throw error;
      if (items?.length) {
        await supabase.from('bapesu_factura_items').insert(
          items.map((it) => ({ factura_id: newFac.id, service_id: it.service_id, description: it.description, quantity: it.quantity, price: it.price, position: it.position }))
        );
      }
      navigate(`/dashboard/cobros/facturas/${newFac.id}`);
    } catch (err) { alert('Error: ' + (err.message ?? 'intenta de nuevo')); }
  };

  // ── Acciones facturas ─────────────────────────────────────────────
  const handleDeleteFactura = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta factura?')) return;
    setDeleting(id);
    await supabase.from('bapesu_facturas').delete().eq('id', id);
    await load();
    setDeleting(null);
  };

  const handleFacturaStatus = async (id, status, e) => {
    e.stopPropagation();
    await supabase.from('bapesu_facturas').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    await load();
  };

  const handleInvoiceStatus = async (id, status, e) => {
    e.stopPropagation();
    await supabase.from('bapesu_invoices').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    await load();
  };

  // ── Datos del tab activo ──────────────────────────────────────────
  const tab    = TABS.find((t) => t.id === activeTab);
  const list   = activeTab === 'invoices' ? invoices : facturas;
  const filtered = list.filter((d) => {
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
  });

  // KPIs unificados (ambos tabs)
  const allDocs   = [...invoices, ...facturas];
  const totalPaid = allDocs.filter((d) => d.status === 'paid').reduce((a, d) => a + Number(d.total || 0), 0);
  const totalPend = allDocs.filter((d) => ['draft', 'sent'].includes(d.status)).reduce((a, d) => a + Number(d.total || 0), 0);

  const tabPaid = list.filter((d) => d.status === 'paid').reduce((a, d) => a + Number(d.total || 0), 0);
  const tabPend = list.filter((d) => ['draft', 'sent'].includes(d.status)).reduce((a, d) => a + Number(d.total || 0), 0);

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

      {/* KPIs globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total cobrado', value: formatCOP(totalPaid), icon: '✅', color: 'from-emerald-400 to-teal-500' },
          { label: 'Por cobrar',    value: formatCOP(totalPend), icon: '⏳', color: 'from-yellow-400 to-amber-500' },
          { label: 'Cuentas cobro', value: invoices.length,      icon: '🧾', color: 'from-emerald-300 to-teal-400' },
          { label: 'Facturas',      value: facturas.length,      icon: '📄', color: 'from-violet-400 to-indigo-500' },
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
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full ${activeTab === 'invoices' ? 'bg-emerald-500' : 'bg-violet-500'}`} />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pagado ({tab.label})</p>
            <p className={`text-lg font-extrabold ${activeTab === 'invoices' ? 'text-emerald-600' : 'text-violet-600'}`}>{formatCOP(tabPaid)}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-2 h-8 rounded-full bg-amber-400" />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Por cobrar ({tab.label})</p>
            <p className="text-lg font-extrabold text-amber-600">{formatCOP(tabPend)}</p>
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
            <div className="col-span-1">Vence</div>
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
              const overdue = doc.status === 'sent' && doc.due_date && doc.due_date < new Date().toISOString().slice(0, 10);

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
                  <div className={`hidden md:block col-span-1 text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {doc.due_date ? new Date(doc.due_date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '—'}
                    {overdue && <span className="ml-0.5">⚠</span>}
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
