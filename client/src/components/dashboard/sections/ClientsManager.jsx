import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../../../api';
import { useCompany } from '../../../context/CompanyContext';
import { queryKeys } from '../../../lib/queryKeys';
import { EMPTY_ARRAY, invalidateCompanyData, unwrapSupabaseResponse } from '../../../lib/queryUtils';

const EMPTY = { name: '', nit: '', email: '', phone: '', city: '', address: '', notes: '' };

const INPUT = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400 transition';
const LABEL = 'block text-xs font-medium text-gray-600 mb-1';

export default function ClientsManager() {
  const { user, company } = useCompany();
  const queryClient = useQueryClient();
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null); // null | { mode: 'add'|'edit', data }
  const [deleting, setDeleting]   = useState(null);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState(EMPTY);

  const clientsQuery = useQuery({
    queryKey: queryKeys.company.clients(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => clientsApi.list(company.id).then(unwrapSupabaseResponse),
  });

  const clients = clientsQuery.data ?? EMPTY_ARRAY;
  const loading = clientsQuery.isLoading;
  const invalidate = () => invalidateCompanyData(queryClient, company?.id);

  const saveMutation = useMutation({
    mutationFn: async ({ mode, id, payload }) => {
      const response = mode === 'add'
        ? await clientsApi.create({ ...payload, company_id: company.id, user_id: user?.id ?? null })
        : await clientsApi.update(id, { ...payload, updated_at: new Date().toISOString() });
      if (response.error) throw response.error;
      return response.data ?? null;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await clientsApi.remove(id);
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const openAdd  = () => { setForm(EMPTY); setError(''); setModal({ mode: 'add' }); };
  const openEdit = (c) => { setForm({ name: c.name, nit: c.nit ?? '', email: c.email ?? '', phone: c.phone ?? '', city: c.city ?? '', address: c.address ?? '', notes: c.notes ?? '' }); setError(''); setModal({ mode: 'edit', id: c.id }); };
  const closeModal = () => setModal(null);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return; }
    if (!company?.id)      { setError('No tienes una empresa asociada'); return; }
    setError('');
    try {
      await saveMutation.mutateAsync({ mode: modal.mode, id: modal.id, payload: form });
      closeModal();
    } catch (e) {
      setError(e.message ?? 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    await deleteMutation.mutateAsync(id);
    setDeleting(null);
  };

  const saving = saveMutation.isPending;

  const filtered = useMemo(() => clients.filter((c) =>
    [c.name, c.nit, c.email, c.phone, c.city].some((v) =>
      (v ?? '').toLowerCase().includes(search.toLowerCase())
    )
  ), [clients, search]);

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} registrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition-all shadow-[0_4px_16px_rgba(245,158,11,0.3)] flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, NIT, email, teléfono o ciudad..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-6 h-6 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">
            {search ? 'Sin resultados para esa búsqueda' : 'Aún no tienes clientes registrados'}
          </p>
          {!search && (
            <button onClick={openAdd} className="mt-4 text-sm text-yellow-600 hover:text-yellow-700 font-medium">
              + Agregar el primero
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
            <div className="col-span-3">Nombre</div>
            <div className="col-span-2">NIT / CC</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Teléfono</div>
            <div className="col-span-1">Ciudad</div>
            <div className="col-span-1 text-right">Acciones</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <div key={c.id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                {/* Avatar + name */}
                <div className="col-span-10 md:col-span-3 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 flex items-center justify-center text-yellow-700 font-bold text-sm flex-shrink-0">
                    {c.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    {c.city && <p className="text-[11px] text-gray-400 md:hidden">{c.city}</p>}
                  </div>
                </div>

                <div className="col-span-2 hidden md:block">
                  <p className="text-sm text-gray-700 truncate">{c.nit || <span className="text-gray-300">—</span>}</p>
                </div>
                <div className="col-span-3 hidden md:block">
                  <p className="text-sm text-gray-700 truncate">{c.email || <span className="text-gray-300">—</span>}</p>
                </div>
                <div className="col-span-2 hidden md:block">
                  <p className="text-sm text-gray-700">{c.phone || <span className="text-gray-300">—</span>}</p>
                </div>
                <div className="col-span-1 hidden md:block">
                  <p className="text-sm text-gray-700 truncate">{c.city || <span className="text-gray-300">—</span>}</p>
                </div>

                {/* Actions */}
                <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    title="Editar"
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    title="Eliminar"
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-40"
                  >
                    {deleting === c.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">

            {/* Top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-yellow-400 to-amber-500" />

            <div className="p-6">
              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900">
                  {modal.mode === 'add' ? 'Nuevo cliente' : 'Editar cliente'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Nombre / Razón social *</label>
                    <input className={INPUT} value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="Empresa S.A.S. o Juan Pérez" />
                  </div>
                  <div>
                    <label className={LABEL}>NIT / CC</label>
                    <input className={INPUT} value={form.nit} onChange={(e) => setF('nit', e.target.value)} placeholder="900.123.456-7" />
                  </div>
                  <div>
                    <label className={LABEL}>Teléfono</label>
                    <input className={INPUT} value={form.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="+57 300 000 0000" />
                  </div>
                  <div>
                    <label className={LABEL}>Email</label>
                    <input type="email" className={INPUT} value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="contacto@empresa.com" />
                  </div>
                  <div>
                    <label className={LABEL}>Ciudad</label>
                    <input className={INPUT} value={form.city} onChange={(e) => setF('city', e.target.value)} placeholder="Bogotá" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Dirección</label>
                    <input className={INPUT} value={form.address} onChange={(e) => setF('address', e.target.value)} placeholder="Cra 1 #2-3" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Notas internas</label>
                    <textarea rows={2} className={INPUT + ' resize-none'} value={form.notes} onChange={(e) => setF('notes', e.target.value)} placeholder="Información adicional del cliente..." />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  )}
                  {modal.mode === 'add' ? 'Guardar cliente' : 'Actualizar'}
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
