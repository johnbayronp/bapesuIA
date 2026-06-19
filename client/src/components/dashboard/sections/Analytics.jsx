import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '../../../api/db';
import { useCompany } from '../../../context/CompanyContext';
import { queryKeys } from '../../../lib/queryKeys';

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

function StatCard({ label, value, sub, icon, color = 'yellow', info }) {
  const [showInfo, setShowInfo] = React.useState(false);
  const colors = {
    yellow:  'from-yellow-400 to-amber-500',
    emerald: 'from-emerald-400 to-teal-500',
    indigo:  'from-indigo-400 to-violet-500',
    rose:    'from-rose-400 to-pink-500',
    red:     'from-red-500 to-rose-600',
    gray:    'from-gray-300 to-gray-400',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start gap-3 sm:gap-4 relative min-w-0">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <span className="text-white">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-0.5 leading-tight break-words">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1 leading-snug break-words">{sub}</p>}
      </div>
      {info && (
        <div className="relative flex-shrink-0">
          <button
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            onClick={() => setShowInfo((v) => !v)}
            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition"
            aria-label="Más información"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
          {showInfo && (
            <div className="absolute right-0 top-7 z-50 w-52 sm:w-56 max-w-[calc(100vw-2rem)] bg-gray-900 text-white text-[11px] leading-relaxed rounded-xl px-3 py-2.5 shadow-xl pointer-events-none">
              {info}
              <div className="absolute -top-1.5 right-2 w-3 h-3 bg-gray-900 rotate-45 rounded-sm" />
            </div>
          )}
        </div>
      )}
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
  const analyticsQuery = useQuery({
    queryKey: queryKeys.company.analytics(company?.id),
    enabled: Boolean(company?.id),
    queryFn: async () => {
    const thisMonthStart = new Date().toISOString().slice(0, 7) + '-01';
    const [inv, fac, quo, cli, svc, prod, mov] = await Promise.all([
      db.from('bapesu_invoices').select('id,total,status,issue_date,due_date,updated_at,client_name').eq('company_id', company.id),
      db.from('bapesu_facturas').select('id,total,status,issue_date,due_date,updated_at,client_name').eq('company_id', company.id),
      db.from('bapesu_quotations').select('id,total,status,issue_date,client_name').eq('company_id', company.id),
      db.from('bapesu_clients').select('id,name,created_at').eq('company_id', company.id),
      db.from('bapesu_services').select('id,name,default_price,is_active').eq('company_id', company.id),
      db.from('bapesu_products').select('id,name,stock_available,stock_min,purchase_price,sale_price,is_active').eq('company_id', company.id),
      db.from('bapesu_stock_movements')
        .select('quantity,type,bapesu_products!product_id(purchase_price)')
        .eq('company_id', company.id)
        .eq('type', 'salida')
        .gte('created_at', thisMonthStart),
    ]);
      const error = [inv, fac, quo, cli, svc, prod, mov].find((res) => res.error)?.error;
      if (error) throw error;
      return {
        invoices: inv.data ?? [],
        facturas: fac.data ?? [],
        quotations: quo.data ?? [],
        clients: cli.data ?? [],
        services: svc.data ?? [],
        products: prod.data ?? [],
        movements: mov.data ?? [],
      };
    },
  });

  const {
    invoices = [],
    facturas = [],
    quotations = [],
    clients = [],
    services = [],
    products = [],
    movements = [],
  } = analyticsQuery.data ?? {};
  const loading = analyticsQuery.isLoading;

  // ── Métricas ──────────────────────────────────────────────────
  const today      = new Date().toISOString().slice(0, 10);
  const thisMonth  = today.slice(0, 7);
  const in7days    = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const allDocs        = [...invoices, ...facturas];
  const paidDocs       = allDocs.filter((d) => d.status === 'paid');
  const paidInvoices   = invoices.filter((i) => i.status === 'paid');
  const totalRevenue   = paidDocs.reduce((a, d) => a + Number(d.total), 0);

  const pendingRevenue = allDocs.filter((d) => d.status === 'sent' && (!d.due_date || d.due_date >= today))
    .reduce((a, d) => a + Number(d.total), 0);
  const overdueRevenue = allDocs.filter((d) => d.status === 'sent' && d.due_date && d.due_date < today)
    .reduce((a, d) => a + Number(d.total), 0);
  const overdueCount   = allDocs.filter((d) => d.status === 'sent' && d.due_date && d.due_date < today).length;
  const draftRevenue   = allDocs.filter((d) => d.status === 'draft').reduce((a, d) => a + Number(d.total), 0);

  // Ticket promedio (solo significativo con 3+ pagos)
  const ticketAvg      = paidDocs.length > 0 ? totalRevenue / paidDocs.length : 0;
  const ticketSub      = paidDocs.length === 0
    ? 'Sin pagos aún'
    : paidDocs.length < 3
    ? `Basado en ${paidDocs.length} pago${paidDocs.length > 1 ? 's' : ''} — poco representativo`
    : `Basado en ${paidDocs.length} pagos`;

  // Ingresos este mes — usa issue_date para evitar que updated_at (ediciones) distorsione el período
  const revenueThisMonth = paidDocs
    .filter((d) => d.issue_date?.slice(0, 7) === thisMonth)
    .reduce((a, d) => a + Number(d.total), 0);

  // Costo de insumos: salidas de inventario confirmadas este mes con precio de costo del producto
  const costThisMonth = movements.reduce((acc, mv) => {
    const price = Number(mv.bapesu_products?.purchase_price ?? 0);
    const qty   = Math.abs(Number(mv.quantity ?? 0));
    return acc + qty * price;
  }, 0);
  const profitThisMonth = revenueThisMonth - costThisMonth;

  // Días promedio de pago: diferencia en días entre issue_date y updated_at en docs pagados.
  // updated_at es la mejor aproximación disponible a "fecha de cobro" (se actualiza al cambiar status a paid).
  // Se excluyen docs con updated_at == issue_date (sin actualizar desde creación) para evitar 0s falsos.
  const payDays = paidDocs
    .filter((d) => d.issue_date && d.updated_at && d.updated_at.slice(0, 10) !== d.issue_date)
    .map((d) => Math.max(0, Math.floor((new Date(d.updated_at) - new Date(d.issue_date + 'T12:00:00')) / 86400000)));
  const avgPayDays = payDays.length > 0 ? Math.round(payDays.reduce((a, v) => a + v, 0) / payDays.length) : null;

  // Próximas por vencer (7 días)
  const soonDue = allDocs
    .filter((d) => d.status === 'sent' && d.due_date && d.due_date >= today && d.due_date <= in7days)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  // Clientes nuevos
  const newClientsThisMonth = clients.filter((c) => c.created_at?.slice(0, 7) === thisMonth).length;

  // Cotizaciones
  const acceptedQuotes = quotations.filter((q) => q.status === 'accepted');
  const conversionRate = quotations.length > 0 ? Math.round((acceptedQuotes.length / quotations.length) * 100) : 0;

  // Inventario
  const activeProducts     = products.filter((p) => p.is_active);
  const lowStockProducts   = products.filter((p) => Number(p.stock_available) <= Number(p.stock_min) && Number(p.stock_min) > 0);
  const inventoryValueCost = products.reduce((a, p) => a + (Number(p.stock_available) * Number(p.purchase_price || 0)), 0);
  const inventoryValueSale = products.reduce((a, p) => a + (Number(p.stock_available) * Number(p.sale_price || 0)), 0);
  const hasInventory       = products.length > 0 && inventoryValueCost > 0;

  // Gráfica de cartera apilada — últimos 6 meses
  const now   = new Date();
  const last6months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: MONTHS[d.getMonth()], month: d.getMonth(), year: d.getFullYear(), paid: 0, pending: 0, overdue: 0 };
  });
  allDocs.forEach((doc) => {
    const base = doc.issue_date;
    if (!base) return;
    const d    = new Date(base);
    const slot = last6months.find((s) => s.month === d.getMonth() && s.year === d.getFullYear());
    if (!slot) return;
    const val  = Number(doc.total || 0);
    if (doc.status === 'paid') slot.paid += val;
    else if (doc.status === 'sent' && doc.due_date && doc.due_date < today) slot.overdue += val;
    else if (doc.status === 'sent') slot.pending += val;
  });
  const maxCartera = Math.max(...last6months.map((s) => s.paid + s.pending + s.overdue), 1);

  // ── Ingresos por mes (últimos 6 meses) ───────────────────────
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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-1 sm:px-0">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-gray-900">Analíticas</h1>
          <p className="text-sm text-gray-500 mt-0.5 break-words">Resumen de actividad de {company?.name}</p>
        </div>
        <button
          onClick={() => analyticsQuery.refetch()}
          disabled={loading}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 active:scale-95 transition disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {/* KPIs — fila 1: cobros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Ingresos cobrados" value={formatCOP(totalRevenue)}
          sub={`${paidDocs.length} documento${paidDocs.length !== 1 ? 's' : ''} pagado${paidDocs.length !== 1 ? 's' : ''}`}
          color="emerald"
          info="Suma total de todas las cuentas de cobro y facturas con estado Pagada. Representa el dinero que ya entró a tu caja."
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Por cobrar (vigente)" value={formatCOP(pendingRevenue)}
          sub="Enviadas, sin vencer"
          color="yellow"
          info="Documentos enviados al cliente cuya fecha de vencimiento aún no ha llegado. Es el dinero que esperas recibir próximamente."
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Cartera vencida" value={formatCOP(overdueRevenue)}
          sub={overdueCount > 0 ? `${overdueCount} documento${overdueCount > 1 ? 's' : ''} sin pagar` : 'Sin vencimientos'}
          color={overdueRevenue > 0 ? 'rose' : 'indigo'}
          info="Documentos enviados cuya fecha de vencimiento ya pasó y aún no han sido pagados. Si crece mes a mes, hay un problema de flujo de caja."
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>}
        />
        <StatCard label="Tasa de conversión" value={`${conversionRate}%`}
          sub={`${acceptedQuotes.length} de ${quotations.length} cotizaciones`}
          color="indigo"
          info="Porcentaje de cotizaciones que terminaron siendo aceptadas por el cliente. Una tasa alta indica que tus propuestas están bien ajustadas al mercado."
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
      </div>

      {/* KPIs — fila 2: operaciones rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Ticket promedio" value={paidDocs.length > 0 ? formatCOP(ticketAvg) : '—'}
          sub={ticketSub} color="indigo"
          info="Valor promedio de cada cobro pagado. Útil para entender el tamaño típico de tus trabajos. Se vuelve representativo a partir de 3 pagos."
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          label="Días promedio de pago"
          value={avgPayDays !== null ? `${avgPayDays} días` : '—'}
          sub={avgPayDays !== null ? `Desde emisión hasta cobro · ${payDays.length} docs` : 'Sin pagos registrados'}
          color={avgPayDays !== null && avgPayDays > 30 ? 'rose' : 'emerald'}
          info="Promedio de días que tarda un cliente en pagarte desde que emites el documento. Menos de 15 días es excelente. Más de 30 días puede afectar tu flujo de caja."
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Clientes" value={clients.length}
          sub={`+${newClientsThisMonth} este mes · ${services.filter((s) => s.is_active).length} servicios activos`}
          color="rose"
          info="Total de clientes registrados en tu empresa. El número entre paréntesis muestra los nuevos clientes agregados este mes."
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard label="Borradores" value={formatCOP(draftRevenue)}
          sub={`${allDocs.filter((d) => d.status === 'draft').length} sin enviar`}
          color="yellow"
          info="Valor total de documentos creados pero aún no enviados al cliente. Son ingresos pendientes de gestionar — recuerda enviarlos."
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
      </div>

      {/* Inventario — solo si tiene valor */}
      {hasInventory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Productos activos" value={activeProducts.length} sub={`${products.length} en total`} color="indigo"
            info="Cantidad de productos marcados como activos en tu inventario. Los inactivos no aparecen en operaciones ni cotizaciones."
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /></svg>}
          />
          <StatCard label="Stock bajo" value={lowStockProducts.length}
            sub={lowStockProducts.length > 0 ? lowStockProducts.slice(0,2).map(p=>p.name).join(', ') : 'Todo en orden'}
            color={lowStockProducts.length > 0 ? 'rose' : 'emerald'}
            info="Productos cuyo stock disponible es igual o menor al stock mínimo configurado. Necesitan reabastecimiento pronto."
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>}
          />
          <StatCard label="Valor a costo" value={formatCOP(inventoryValueCost)} sub="Precio compra × stock" color="yellow"
            info="Cuánto te costó comprar el inventario que tienes actualmente. Es el capital invertido en mercancía o insumos."
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          />
          <StatCard label="Valor a venta" value={formatCOP(inventoryValueSale)} sub="Precio venta × stock" color="emerald"
            info="Cuánto valdría tu inventario actual si vendieras todo al precio de venta. La diferencia con el valor a costo es tu margen bruto potencial."
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          />
        </div>
      )}

      {/* Bloque: Ganancia estimada del mes + Próximas por vencer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

        {/* Ganancia estimada */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm min-w-0">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Resumen del mes</h2>
          <p className="text-xs text-gray-400 mb-4">{new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' })}</p>
          <div className="space-y-3">
            <div className="flex flex-col min-[420px]:flex-row min-[420px]:justify-between min-[420px]:items-center gap-1 py-2 border-b border-gray-100">
              <span className="text-xs text-gray-600">💰 Ingresos cobrados</span>
              <span className="text-sm font-bold text-emerald-600 break-words">{formatCOP(revenueThisMonth)}</span>
            </div>
            <div className="flex flex-col min-[420px]:flex-row min-[420px]:justify-between min-[420px]:items-center gap-1 py-2 border-b border-gray-100">
              <span className="text-xs text-gray-600">📦 Costo de insumos (salidas)</span>
              <span className="text-sm font-bold text-red-500 break-words">− {formatCOP(costThisMonth)}</span>
            </div>
            <div className="flex flex-col min-[420px]:flex-row min-[420px]:justify-between min-[420px]:items-center gap-1 py-2 bg-gray-50 rounded-xl px-3">
              <span className="text-xs font-semibold text-gray-700">✨ Ganancia estimada</span>
              <span className={`text-base font-extrabold break-words ${profitThisMonth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCOP(profitThisMonth)}
              </span>
            </div>
            {costThisMonth === 0 && (
              <p className="text-[10px] text-gray-400">* Registra salidas en Inventario para ver el costo de insumos</p>
            )}
          </div>
        </div>

        {/* Próximas por vencer */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm min-w-0">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Próximas por vencer</h2>
          <p className="text-xs text-gray-400 mb-4">Cuentas enviadas que vencen en los próximos 7 días</p>
          {soonDue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <span className="text-3xl mb-2">✅</span>
              <p className="text-xs text-gray-500">Sin vencimientos próximos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {soonDue.map((doc) => {
                const daysLeft = Math.ceil((new Date(doc.due_date + 'T12:00:00') - new Date(today + 'T12:00:00')) / 86400000);
                return (
                  <div key={doc.id} className={`flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between gap-2 p-2.5 rounded-xl border ${daysLeft <= 2 ? 'border-red-100 bg-red-50/40' : 'border-amber-100 bg-amber-50/30'}`}>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{doc.client_name ?? '—'}</p>
                      <p className="text-[10px] text-gray-400">{new Date(doc.due_date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</p>
                    </div>
                    <div className="min-[420px]:text-right flex-shrink-0">
                      <p className="text-xs font-bold text-gray-900 break-words">{formatCOP(doc.total)}</p>
                      <span className={`text-[10px] font-bold ${daysLeft <= 2 ? 'text-red-600' : 'text-amber-600'}`}>
                        {daysLeft === 0 ? 'Vence hoy' : `${daysLeft}d restantes`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

        {/* Gráfica cartera apilada */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm min-w-0 overflow-hidden">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Cartera por mes</h2>
          <p className="text-xs text-gray-400 mb-3">Pagado · Por cobrar · Vencido</p>
          <div className="flex items-end gap-1.5" style={{ height: BAR_H }}>
            {last6months.map((m, i) => {
              const total = m.paid + m.pending + m.overdue;
              const paidH   = total > 0 ? Math.max((m.paid    / maxCartera) * BAR_H, m.paid    > 0 ? 4 : 0) : 0;
              const pendH   = total > 0 ? Math.max((m.pending / maxCartera) * BAR_H, m.pending > 0 ? 4 : 0) : 0;
              const overdH  = total > 0 ? Math.max((m.overdue / maxCartera) * BAR_H, m.overdue > 0 ? 4 : 0) : 0;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end gap-px group relative">
                  {total > 0 && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                      {formatCOP(total)}
                    </div>
                  )}
                  {overdH > 0  && <div className="w-full rounded-t-sm" style={{ height: overdH,  background: '#ef4444' }} />}
                  {pendH  > 0  && <div className="w-full"             style={{ height: pendH,   background: '#f59e0b' }} />}
                  {paidH  > 0  && <div className="w-full"             style={{ height: paidH,   background: '#10b981' }} />}
                  {total === 0 && <div className="w-full rounded-t-sm" style={{ height: 3, background: '#e5e7eb' }} />}
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {last6months.map((m, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-[9px] text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-2 mt-3">
            {[['#10b981','Pagado'],['#f59e0b','Por cobrar'],['#ef4444','Vencido']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                <span className="text-[10px] text-gray-500">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cotizaciones por mes */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm min-w-0 overflow-hidden">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Cotizaciones — últimos 6 meses</h2>
          <p className="text-xs text-gray-400 mb-4">Total generadas por mes</p>
          <MiniBar data={last6q} maxVal={maxQuotes} color="#f59e0b" />
        </div>
      </div>

      {/* Estados + Top clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Estado cuentas de cobro */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm min-w-0">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Estado cuentas de cobro</h2>
          {invByStatus.length === 0 ? (
            <p className="text-xs text-gray-400">Sin datos aún</p>
          ) : (
            <div className="space-y-2.5">
              {invByStatus.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-2 min-w-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{s.count}</p>
                    <p className="text-[10px] text-gray-400 break-words">{formatCOP(s.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estado cotizaciones */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm min-w-0">
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
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm min-w-0">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Top clientes por ingreso</h2>
          {topClients.length === 0 ? (
            <p className="text-xs text-gray-400">Sin cuentas pagadas aún</p>
          ) : (
            <div className="space-y-3">
              {topClients.map(([name, total], i) => (
                <div key={name}>
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-gray-700 truncate max-w-[60%]">
                      <span className="text-gray-400 mr-1">#{i + 1}</span>{name}
                    </p>
                    <p className="text-xs font-bold text-emerald-600 text-right break-words">{formatCOP(total)}</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                      style={{ width: `${(total / maxClient) * 100}%` }} />
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
