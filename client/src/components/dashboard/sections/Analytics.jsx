import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../context/CompanyContext';

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const STATUS_INVOICE = {
  draft:     { label: 'Borrador',  color: 'bg-gray-100 text-gray-600' },
  sent:      { label: 'Enviada',   color: 'bg-blue-100 text-blue-600' },
  paid:      { label: 'Pagada',    color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Anulada',   color: 'bg-red-100 text-red-600' },
};
const STATUS_QUOTE = {
  draft:    { label: 'Borrador',  color: 'bg-gray-100 text-gray-600' },
  sent:     { label: 'Enviada',   color: 'bg-blue-100 text-blue-600' },
  accepted: { label: 'Aceptada',  color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-600' },
};

function StatCard({ label, value, sub, icon, color = 'yellow' }) {
  const colors = {
    yellow:  'from-yellow-400 to-amber-500',
    emerald: 'from-emerald-400 to-teal-500',
    indigo:  'from-indigo-400 to-violet-500',
    rose:    'from-rose-400 to-pink-500',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <span className="text-white">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const BAR_H = 96; // altura total del área de barras en px

function MiniBar({ data, maxVal, color = '#f59e0b' }) {
  return (
    <div className="w-full">
      {/* Área de barras */}
      <div className="flex items-end gap-1.5" style={{ height: BAR_H }}>
        {data.map((d, i) => {
          const ratio  = maxVal > 0 ? d.value / maxVal : 0;
          const barPx  = ratio > 0 ? Math.max(ratio * BAR_H, 6) : 3;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
              {/* Tooltip */}
              {d.value > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 shadow-lg">
                  {formatCOP(d.value)}
                </div>
              )}
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height:  barPx,
                  background: ratio > 0 ? color : '#e5e7eb',
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Etiquetas de meses */}
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const { company } = useCompany();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices]   = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients]     = useState([]);
  const [services, setServices]   = useState([]);

  const load = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    const [inv, quo, cli, svc] = await Promise.all([
      supabase.from('bapesu_invoices').select('id,total,status,issue_date,client_name').eq('company_id', company.id),
      supabase.from('bapesu_quotations').select('id,total,status,issue_date,client_name').eq('company_id', company.id),
      supabase.from('bapesu_clients').select('id,name,created_at').eq('company_id', company.id),
      supabase.from('bapesu_services').select('id,name,default_price,is_active').eq('company_id', company.id),
    ]);
    setInvoices(inv.data ?? []);
    setQuotations(quo.data ?? []);
    setClients(cli.data ?? []);
    setServices(svc.data ?? []);
    setLoading(false);
  }, [company]);

  useEffect(() => { load(); }, [load]);

  // ── Métricas ──────────────────────────────────────────────────
  const paidInvoices   = invoices.filter((i) => i.status === 'paid');
  const totalRevenue   = paidInvoices.reduce((a, i) => a + Number(i.total), 0);
  const pendingRevenue = invoices.filter((i) => i.status === 'sent').reduce((a, i) => a + Number(i.total), 0);
  const acceptedQuotes = quotations.filter((q) => q.status === 'accepted');
  const conversionRate = quotations.length > 0 ? Math.round((acceptedQuotes.length / quotations.length) * 100) : 0;

  // ── Ingresos por mes (últimos 6 meses) ───────────────────────
  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: MONTHS[d.getMonth()], month: d.getMonth(), year: d.getFullYear(), value: 0 };
  });
  paidInvoices.forEach((inv) => {
    if (!inv.issue_date) return;
    const d = new Date(inv.issue_date);
    const slot = last6.find((s) => s.month === d.getMonth() && s.year === d.getFullYear());
    if (slot) slot.value += Number(inv.total);
  });
  const maxRevenue = Math.max(...last6.map((s) => s.value), 1);

  // ── Cotizaciones por mes (últimos 6) ─────────────────────────
  const last6q = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: MONTHS[d.getMonth()], month: d.getMonth(), year: d.getFullYear(), value: 0 };
  });
  quotations.forEach((q) => {
    if (!q.issue_date) return;
    const d = new Date(q.issue_date);
    const slot = last6q.find((s) => s.month === d.getMonth() && s.year === d.getFullYear());
    if (slot) slot.value += 1;
  });
  const maxQuotes = Math.max(...last6q.map((s) => s.value), 1);

  // ── Estado de cuentas de cobro ────────────────────────────────
  const invByStatus = Object.keys(STATUS_INVOICE).map((k) => ({
    key: k, ...STATUS_INVOICE[k],
    count: invoices.filter((i) => i.status === k).length,
    total: invoices.filter((i) => i.status === k).reduce((a, i) => a + Number(i.total), 0),
  })).filter((s) => s.count > 0);

  // ── Estado de cotizaciones ────────────────────────────────────
  const quoByStatus = Object.keys(STATUS_QUOTE).map((k) => ({
    key: k, ...STATUS_QUOTE[k],
    count: quotations.filter((q) => q.status === k).length,
  })).filter((s) => s.count > 0);

  // ── Top clientes por facturación ──────────────────────────────
  const clientRevMap = {};
  paidInvoices.forEach((inv) => {
    const name = inv.client_name ?? 'Sin nombre';
    clientRevMap[name] = (clientRevMap[name] || 0) + Number(inv.total);
  });
  const topClients = Object.entries(clientRevMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxClient = topClients[0]?.[1] || 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="w-7 h-7 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Analíticas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen de actividad de {company?.name}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ingresos cobrados"
          value={formatCOP(totalRevenue)}
          sub={`${paidInvoices.length} cuenta${paidInvoices.length !== 1 ? 's' : ''} pagada${paidInvoices.length !== 1 ? 's' : ''}`}
          color="emerald"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Por cobrar"
          value={formatCOP(pendingRevenue)}
          sub="Cuentas enviadas sin pagar"
          color="yellow"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Tasa de conversión"
          value={`${conversionRate}%`}
          sub={`${acceptedQuotes.length} de ${quotations.length} cotizaciones`}
          color="indigo"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <StatCard
          label="Clientes"
          value={clients.length}
          sub={`${services.filter((s) => s.is_active).length} servicios activos`}
          color="rose"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Ingresos por mes */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Ingresos cobrados — últimos 6 meses</h2>
          <p className="text-xs text-gray-400 mb-4">Solo cuentas de cobro con estado "Pagada"</p>
          <MiniBar data={last6} maxVal={maxRevenue} color="#10b981" />
        </div>

        {/* Cotizaciones por mes */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Cotizaciones generadas — últimos 6 meses</h2>
          <p className="text-xs text-gray-400 mb-4">Total de cotizaciones por mes</p>
          <MiniBar data={last6q} maxVal={maxQuotes} color="#f59e0b" />
        </div>
      </div>

      {/* Estados + Top clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Estado cuentas de cobro */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Estado cuentas de cobro</h2>
          {invByStatus.length === 0 ? (
            <p className="text-xs text-gray-400">Sin datos aún</p>
          ) : (
            <div className="space-y-2.5">
              {invByStatus.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-900">{s.count}</p>
                    <p className="text-[10px] text-gray-400">{formatCOP(s.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estado cotizaciones */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Estado cotizaciones</h2>
          {quoByStatus.length === 0 ? (
            <p className="text-xs text-gray-400">Sin datos aún</p>
          ) : (
            <div className="space-y-2.5">
              {quoByStatus.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                  <p className="text-xs font-bold text-gray-900">{s.count}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top clientes */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Top clientes por ingreso</h2>
          {topClients.length === 0 ? (
            <p className="text-xs text-gray-400">Sin cuentas pagadas aún</p>
          ) : (
            <div className="space-y-3">
              {topClients.map(([name, total], i) => (
                <div key={name}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-medium text-gray-700 truncate max-w-[60%]">
                      <span className="text-gray-400 mr-1">#{i + 1}</span>{name}
                    </p>
                    <p className="text-xs font-bold text-emerald-600">{formatCOP(total)}</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                      style={{ width: `${(total / maxClient) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumen servicios */}
      {services.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Catálogo de servicios</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {services.map((s) => (
              <div key={s.id} className={`p-3 rounded-xl border ${s.is_active ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
                <p className="text-sm font-extrabold text-yellow-600 mt-1">{formatCOP(s.default_price)}</p>
                <span className={`text-[10px] font-medium ${s.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {s.is_active ? '● Activo' : '○ Inactivo'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
