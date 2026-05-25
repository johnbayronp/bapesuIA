import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../context/CompanyContext';

const EMPTY = { name: '', description: '', default_price: '', unit: '', is_active: true };

const formatPriceCOP = (raw) => {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('es-CO');
};

const parsePriceCOP = (formatted) => String(formatted).replace(/\./g, '').replace(/,/g, '');

const INPUT = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400 transition';
const LABEL = 'block text-xs font-medium text-gray-600 mb-1';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0,
}).format(n || 0);

export default function ServicesManager() {
  const { user, company } = useCompany();
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState(EMPTY);

  const load = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('bapesu_services')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });
    setServices(data ?? []);
    setLoading(false);
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openAdd  = () => { setForm(EMPTY); setError(''); setModal({ mode: 'add' }); };
  const openEdit = (s) => {
    setForm({
      name: s.name, description: s.description ?? '',
      default_price: String(s.default_price ?? 0),
      unit: s.unit ?? '',
      is_active: s.is_active ?? true,
    });
    setError(''); setModal({ mode: 'edit', id: s.id });
  };
  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return; }
    if (!company?.id)      { setError('No tienes empresa asociada');  return; }
    setSaving(true); setError('');

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        default_price: parseFloat(form.default_price) || 0,
        unit: form.unit.trim() || null,
        is_active: form.is_active,
      };
      if (modal.mode === 'add') {
        const { error: e } = await supabase
          .from('bapesu_services')
          .insert({ ...payload, company_id: company.id, created_by: user?.id ?? null });
        if (e) throw e;
      } else {
        const { error: e } = await supabase
          .from('bapesu_services')
          .update(payload)
          .eq('id', modal.id);
        if (e) throw e;
      }
      await load();
      closeModal();
    } catch (e) {
      setError(e.message ?? 'Error al guardar');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este servicio del catálogo? Las cotizaciones existentes no se ven afectadas.')) return;
    setDeleting(id);
    await supabase.from('bapesu_services').delete().eq('id', id);
    await load();
    setDeleting(null);
  };

  const handleToggleActive = async (s) => {
    await supabase.from('bapesu_services').update({ is_active: !s.is_active }).eq('id', s.id);
    await load();
  };

  const filtered = services.filter((s) =>
    [s.name, s.description, s.unit].some((v) => (v ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Catálogo de servicios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {services.length} servicio{services.length !== 1 ? 's' : ''} guardado{services.length !== 1 ? 's' : ''}. Aparecen al crear cotizaciones y cuentas de cobro.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition shadow-[0_4px_16px_rgba(245,158,11,0.3)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo servicio
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
          placeholder="Buscar servicios..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-6 h-6 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-gray-200 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">{search ? 'Sin resultados' : 'Aún no hay servicios en tu catálogo'}</p>
          <p className="text-xs text-gray-400 mt-1">Empieza agregando los servicios que ofreces a tus clientes.</p>
          {!search && (
            <button onClick={openAdd} className="mt-4 text-sm text-yellow-600 hover:text-yellow-700 font-medium">
              + Agregar el primero
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className={`group relative bg-white border rounded-2xl p-5 shadow-sm transition hover:shadow-md ${
              s.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{s.name}</h3>
                    {!s.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold">INACTIVO</span>
                    )}
                  </div>
                  {s.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-base font-extrabold text-yellow-600">{formatCOP(s.default_price)}</span>
                    {s.unit && <span className="text-[11px] text-gray-400">/ {s.unit}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 flex items-center justify-center transition" title="Editar">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleToggleActive(s)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition" title={s.is_active ? 'Desactivar' : 'Activar'}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.is_active ? 'M18.364 18.364A9 9 0 005.636 5.636' : 'M9 12l2 2 4-4'} />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition disabled:opacity-40" title="Eliminar">
                    {deleting === s.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-yellow-400 to-amber-500" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900">
                  {modal.mode === 'add' ? 'Nuevo servicio' : 'Editar servicio'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={LABEL}>Nombre del servicio *</label>
                  <input className={INPUT} value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="Ej: Diseño de logo" autoFocus />
                </div>
                <div>
                  <label className={LABEL}>Descripción</label>
                  <textarea rows={2} className={INPUT + ' resize-none'} value={form.description} onChange={(e) => setF('description', e.target.value)} placeholder="¿Qué incluye este servicio?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Precio base *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={INPUT}
                      value={formatPriceCOP(form.default_price)}
                      onChange={(e) => setF('default_price', parsePriceCOP(e.target.value))}
                      placeholder="350.000"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Unidad</label>
                    <input className={INPUT} value={form.unit} onChange={(e) => setF('unit', e.target.value)} placeholder="hora, mes, pieza..." />
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-1 select-none cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setF('is_active', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400" />
                  <span className="text-xs text-gray-600">Activo (disponible al crear cotizaciones)</span>
                </label>

                {error && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition disabled:opacity-60">
                  {saving ? 'Guardando...' : (modal.mode === 'add' ? 'Guardar servicio' : 'Actualizar')}
                </button>
                <button onClick={closeModal} className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition">
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
