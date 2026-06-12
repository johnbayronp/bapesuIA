import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quotationsApi } from '../../../api';
import { useCompany } from '../../../context/CompanyContext';
import { queryKeys } from '../../../lib/queryKeys';
import { invalidateCompanyData, unwrapSupabaseResponse } from '../../../lib/queryUtils';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0,
}).format(n || 0);

const STATUS = {
  draft:    { label: 'Borrador',  bg: 'bg-gray-100',     text: 'text-gray-600' },
  sent:     { label: 'Enviada',   bg: 'bg-indigo-100',   text: 'text-indigo-700' },
  accepted: { label: 'Aceptada',  bg: 'bg-emerald-100',  text: 'text-emerald-700' },
  rejected: { label: 'Rechazada', bg: 'bg-red-100',      text: 'text-red-700' },
};

export default function QuotationsList() {
  const { company } = useCompany();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  const quotationsQuery = useQuery({
    queryKey: queryKeys.company.quotations(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => quotationsApi.list(company.id).then(unwrapSupabaseResponse),
  });

  const list = quotationsQuery.data ?? [];
  const loading = quotationsQuery.isLoading;
  const invalidate = () => invalidateCompanyData(queryClient, company?.id);

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await quotationsApi.remove(id);
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const duplicateMutation = useMutation({
    mutationFn: async (quotation) => {
      const itemsResponse = await quotationsApi.getItems(quotation.id);
      if (itemsResponse.error) throw itemsResponse.error;
      const quotationResponse = await quotationsApi.create({
        ...quotation,
        id: undefined,
        number: quotation.number ? `${quotation.number}-COPY` : null,
        status: 'draft',
        created_at: undefined,
        updated_at: undefined,
      });
      if (quotationResponse.error) throw quotationResponse.error;
      const items = itemsResponse.data ?? [];
      if (items.length) {
        const insertResponse = await quotationsApi.addItems(
          items.map((item) => ({
            ...item,
            id: undefined,
            quotation_id: quotationResponse.data.id,
            created_at: undefined,
          }))
        );
        if (insertResponse.error) throw insertResponse.error;
      }
      return quotationResponse.data;
    },
    onSuccess: invalidate,
  });

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    await deleteMutation.mutateAsync(id);
    setDeleting(null);
  };

  const handleDuplicate = async (q, e) => {
    e.stopPropagation();
    const newQ = await duplicateMutation.mutateAsync(q);
    navigate(`/dashboard/quotations/${newQ.id}`);
  };

  const filtered = useMemo(() => list
    .filter((q) => filter === 'all' || q.status === filter)
    .filter((q) =>
      [q.number, q.client_name, q.project_type].some((v) =>
        (v ?? '').toLowerCase().includes(search.toLowerCase())
      )
    ), [list, filter, search]);

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Cotizaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">{list.length} cotización{list.length !== 1 ? 'es' : ''} en total</p>
        </div>
        <Link
          to="/dashboard/quotations/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition shadow-[0_4px_16px_rgba(245,158,11,0.3)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nueva cotización
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['all', 'draft', 'sent', 'accepted', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === f
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Todas' : STATUS[f].label}
          </button>
        ))}

        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, cliente o proyecto..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400"
          />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-6 h-6 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">{list.length === 0 ? 'Aún no has creado cotizaciones' : 'Sin resultados con esos filtros'}</p>
          {list.length === 0 && (
            <Link to="/dashboard/quotations/new" className="mt-4 text-sm text-yellow-600 hover:text-yellow-700 font-medium">
              + Crear la primera
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
            <div className="col-span-1">N°</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-3">Proyecto</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-1 text-right">Fecha</div>
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.map((q) => {
              const st = STATUS[q.status] || STATUS.draft;
              return (
                <div
                  key={q.id}
                  onClick={() => navigate(`/dashboard/quotations/${q.id}`)}
                  className="group grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-sm font-extrabold text-gray-900">#{q.number || '—'}</p>
                  </div>
                  <div className="col-span-10 md:col-span-3 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{q.client_name || '— Sin cliente —'}</p>
                    {q.client_nit && <p className="text-[11px] text-gray-400 truncate">{q.client_nit}</p>}
                  </div>
                  <div className="hidden md:block col-span-3 text-sm text-gray-600 truncate">{q.project_type || '—'}</div>
                  <div className="col-span-6 md:col-span-2">
                    <p className="text-sm font-bold text-yellow-600">{formatCOP(q.total)}</p>
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-1 flex items-center justify-end gap-1">
                    <p className="text-[11px] text-gray-400 mr-1 hidden md:block">
                      {q.created_at ? new Date(q.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : ''}
                    </p>
                    <button onClick={(e) => handleDuplicate(q, e)} title="Duplicar" className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button onClick={(e) => handleDelete(q.id, e)} disabled={deleting === q.id} title="Eliminar" className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition disabled:opacity-40">
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
