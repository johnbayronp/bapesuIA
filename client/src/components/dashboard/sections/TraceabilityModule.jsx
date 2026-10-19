import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { traceabilityApi } from '../../../api';
import { useCompany } from '../../../context/CompanyContext';

const ACTION_LABELS = {
  CONTRACT_CREATED: 'Contrato creado',
  CONTRACT_DELETED: 'Contrato eliminado',
};
const PAGE_SIZE = 100;

const formatDateTime = (value) => new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota',
}).format(new Date(value));

const formatMoney = (value) => Number(value || 0).toLocaleString('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
});

export default function TraceabilityModule() {
  const { company } = useCompany();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const nextOffset = useRef(0);

  const loadEvents = useCallback(async (append = false) => {
    if (!company?.id) {
      setEvents([]);
      setLoading(false);
      return;
    }
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      nextOffset.current = 0;
    }
    setError('');
    const from = append ? nextOffset.current : 0;
    const response = await traceabilityApi.listContractEvents(company.id, from, from + PAGE_SIZE - 1);
    if (response.error) {
      setError(response.error.message || 'No se pudo cargar la trazabilidad.');
      if (!append) setEvents([]);
    } else {
      const rows = response.data || [];
      setEvents((current) => append ? [...current, ...rows] : rows);
      nextOffset.current = from + rows.length;
      setHasMore(rows.length === PAGE_SIZE);
    }
    if (append) setLoadingMore(false);
    else setLoading(false);
  }, [company?.id]);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es-CO');
    if (!query) return events;
    return events.filter((event) => [
      event.actor_email, event.client_name, event.lot, event.reason, event.contract_id,
      ACTION_LABELS[event.action],
    ].some((value) => String(value || '').toLocaleLowerCase('es-CO').includes(query)));
  }, [events, search]);

  return <section className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm text-gray-500">Registro de acciones de contratos</p>
        <h1 className="text-2xl font-extrabold text-gray-900">Trazabilidad</h1>
        <p className="mt-1 text-sm text-gray-500">Consulta quién creó o eliminó contratos, cuándo ocurrió y el motivo registrado.</p>
      </div>
      <button type="button" onClick={() => void loadEvents()} disabled={loading} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50">
        {loading ? 'Actualizando…' : 'Actualizar'}
      </button>
    </header>

    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}. Ejecuta la migración de trazabilidad en Supabase si aún no está aplicada.</p>}

    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
        <div><h2 className="font-bold text-gray-900">Actividad de contratos</h2><p className="mt-1 text-xs text-gray-500">Hora de Colombia · registro ordenado del más reciente al más antiguo</p></div>
        <label className="sr-only" htmlFor="traceability-search">Buscar en trazabilidad</label>
        <input id="traceability-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuario, contrato o motivo…" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 sm:max-w-sm" />
      </div>

      {loading ? <p className="px-5 py-12 text-center text-sm text-gray-500">Cargando registros…</p>
        : filteredEvents.length === 0 ? <div className="px-5 py-14 text-center"><p className="font-semibold text-gray-800">{search ? 'No hay coincidencias' : 'Todavía no hay acciones registradas'}</p><p className="mt-1 text-sm text-gray-500">Los próximos contratos creados o eliminados aparecerán aquí.</p></div>
          : <div className="overflow-x-auto">
            <table className="min-w-[850px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr><th className="px-4 py-3 font-semibold">Acción</th><th className="px-4 py-3 font-semibold">Usuario</th><th className="px-4 py-3 font-semibold">Fecha y hora</th><th className="px-4 py-3 font-semibold">Contrato</th><th className="px-4 py-3 font-semibold">Motivo</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEvents.map((event) => <tr key={event.id} className="align-top hover:bg-gray-50/70">
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${event.action === 'CONTRACT_DELETED' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{ACTION_LABELS[event.action] || event.action}</span></td>
                  <td className="px-4 py-3 text-gray-700">{event.actor_email || event.actor_id || 'Usuario no disponible'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDateTime(event.occurred_at)}</td>
                  <td className="px-4 py-3"><p className="font-medium text-gray-800">{event.client_name || 'Contrato'}</p><p className="mt-0.5 text-xs text-gray-500">Lote {event.lot || '—'} · {formatMoney(event.price)}</p><p className="mt-0.5 font-mono text-[10px] text-gray-400">{event.contract_id}</p></td>
                  <td className="max-w-xs whitespace-pre-wrap px-4 py-3 text-gray-600">{event.reason || <span className="text-gray-400">Sin motivo informado</span>}</td>
                </tr>)}
              </tbody>
            </table>
          </div>}
      {!loading && hasMore && <div className="border-t border-gray-100 p-4 text-center">
        <button type="button" onClick={() => void loadEvents(true)} disabled={loadingMore} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          {loadingMore ? 'Cargando…' : 'Cargar eventos anteriores'}
        </button>
      </div>}
    </div>
  </section>;
}
