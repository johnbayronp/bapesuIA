import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { facturasApi } from '../../../api';
import { useCompany } from '../../../context/CompanyContext';
import { queryKeys } from '../../../lib/queryKeys';
import { EMPTY_ARRAY, invalidateCompanyData, unwrapSupabaseResponse } from '../../../lib/queryUtils';

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

const STATUS = {
  draft:     { label: 'Borrador',  bg: 'bg-gray-100',     text: 'text-gray-600',    dot: 'bg-gray-400' },
  sent:      { label: 'Enviada',   bg: 'bg-blue-100',     text: 'text-blue-700',    dot: 'bg-blue-500' },
  paid:      { label: 'Pagada',    bg: 'bg-emerald-100',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Anulada',   bg: 'bg-red-100',      text: 'text-red-600',     dot: 'bg-red-400' },
};

export default function FacturacionList() {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatus] = useState('all');

  const facturasQuery = useQuery({
    queryKey: queryKeys.company.facturas(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => facturasApi.list(company.id).then(unwrapSupabaseResponse),
  });

  const facturas = facturasQuery.data ?? EMPTY_ARRAY;
  const loading = facturasQuery.isLoading;
  const invalidate = () => invalidateCompanyData(queryClient, company?.id);

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await facturasApi.remove(id);
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await facturasApi.update(id, { status, updated_at: new Date().toISOString() });
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta factura?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleStatus = async (id, status) => {
    await statusMutation.mutateAsync({ id, status });
  };

  // KPIs
  const paid     = facturas.filter((f) => f.status === 'paid');
  const pending  = facturas.filter((f) => f.status === 'sent');
  const totalRev = paid.reduce((a, f) => a + Number(f.total), 0);
  const totalPend = pending.reduce((a, f) => a + Number(f.total), 0);

  const filtered = useMemo(() => facturas.filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (f.client_name ?? '').toLowerCase().includes(q) ||
        (f.number ?? '').toLowerCase().includes(q) ||
        (f.client_nit ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  }), [facturas, search, statusFilter]);

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Facturación</h1>
          <p className="text-sm text-gray-500 mt-0.5">{facturas.length} factura{facturas.length !== 1 ? 's' : ''} registrada{facturas.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/dashboard/facturacion/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold text-sm transition shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nueva factura
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total facturas', value: facturas.length, sub: 'registradas', icon: '🧾', color: 'from-violet-400 to-indigo-500' },
          { label: 'Cobrado', value: formatCOP(totalRev), sub: `${paid.length} pagadas`, icon: '✅', color: 'from-emerald-400 to-teal-500' },
          { label: 'Por cobrar', value: formatCOP(totalPend), sub: `${pending.length} enviadas`, icon: '⏳', color: 'from-yellow-400 to-amber-500' },
          { label: 'Borradores', value: facturas.filter((f) => f.status === 'draft').length, sub: 'sin enviar', icon: '📝', color: 'from-gray-300 to-gray-400' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-lg flex-shrink-0`}>
              {k.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{k.label}</p>
              <p className="text-base font-extrabold text-gray-900 truncate">{k.value}</p>
              <p className="text-[10px] text-gray-400">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, NIT o número..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition"
          />
        </div>
        <div className="flex gap-1.5">
          {[['all', 'Todas'], ['draft', 'Borrador'], ['sent', 'Enviada'], ['paid', 'Pagada'], ['cancelled', 'Anulada']].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setStatus(k)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                statusFilter === k
                  ? 'bg-violet-100 text-violet-700 border border-violet-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-6 h-6 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl text-center">
          <span className="text-4xl mb-3">🧾</span>
          <p className="text-gray-700 font-semibold">{search || statusFilter !== 'all' ? 'Sin resultados' : 'Aún no hay facturas'}</p>
          <p className="text-xs text-gray-400 mt-1">Crea tu primera factura de venta.</p>
          {!search && statusFilter === 'all' && (
            <Link to="/dashboard/facturacion/new" className="mt-4 text-sm text-violet-600 hover:text-violet-700 font-medium">
              + Crear la primera
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
            <div className="col-span-2">Número</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Vence</div>
            <div className="col-span-1">Estado</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1 text-right">Acc.</div>
          </div>
          <div className="divide-y divide-gray-100">
            {filtered.map((f) => {
              const st = STATUS[f.status] ?? STATUS.draft;
              const overdue = f.status === 'sent' && f.due_date && f.due_date < new Date().toISOString().slice(0, 10);
              return (
                <div key={f.id} className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50/40' : ''}`}>
                  <div className="col-span-6 md:col-span-2">
                    <Link to={`/dashboard/facturacion/${f.id}`} className="text-sm font-bold text-violet-600 hover:text-violet-800 transition">
                      {f.prefix ?? 'FAC'}-{f.number ?? '—'}
                    </Link>
                  </div>
                  <div className="col-span-6 md:col-span-3 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{f.client_name ?? 'Sin cliente'}</p>
                    {f.client_nit && <p className="text-[11px] text-gray-400">NIT: {f.client_nit}</p>}
                  </div>
                  <div className="col-span-6 md:col-span-2 text-xs text-gray-500">
                    {f.issue_date ? new Date(f.issue_date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                  <div className={`col-span-6 md:col-span-2 text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {f.due_date ? new Date(f.due_date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    {overdue && <span className="ml-1 text-[10px]">⚠ Vencida</span>}
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.bg} ${st.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                  <div className="col-span-4 md:col-span-1 text-right">
                    <p className="text-sm font-extrabold text-gray-900">{formatCOP(f.total)}</p>
                  </div>
                  <div className="col-span-4 md:col-span-1 flex items-center justify-end gap-1">
                    <Link to={`/dashboard/facturacion/${f.id}`} title="Editar" className="w-7 h-7 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 flex items-center justify-center transition">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    {f.status === 'draft' && (
                      <button onClick={() => handleStatus(f.id, 'sent')} title="Marcar enviada" className="w-7 h-7 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    )}
                    {f.status === 'sent' && (
                      <button onClick={() => handleStatus(f.id, 'paid')} title="Marcar pagada" className="w-7 h-7 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button onClick={() => handleDelete(f.id)} title="Eliminar" className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
