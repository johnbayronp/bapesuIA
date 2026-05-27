import React, { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAuxAuth } from '../../lib/supabase';

const PLANS = ['free', 'pro', 'enterprise'];
const PLAN_META = {
  free:       { label: 'Gratis',     badge: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
  pro:        { label: 'Pro',        badge: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-400' },
  enterprise: { label: 'Enterprise', badge: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500' },
};
const EMPTY      = { name: '', email: '', nit: '', phone: '', city: '', plan: 'free', is_active: true };
const EMPTY_USER = { email: '', password: '', role: 'admin' };
const PAGE_SIZE  = 15;

function genPassword(len = 12) {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function SACompanies() {
  const [companies,    setCompanies]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [planFilter,   setPlanFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy,       setSortBy]       = useState('created_at');
  const [page,         setPage]         = useState(0);
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [saving,       setSaving]       = useState(false);
  const [userCounts,   setUserCounts]   = useState({});
  // Modal crear usuario
  const [userModal,    setUserModal]    = useState(null); // company object
  const [userForm,     setUserForm]     = useState(EMPTY_USER);
  const [userSaving,   setUserSaving]   = useState(false);
  const [userError,    setUserError]    = useState('');
  const [userCreated,  setUserCreated]  = useState(null); // { email, password }
  const [showPwd,      setShowPwd]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: users }] = await Promise.all([
      supabase.from('bapesu_companies').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('company_id'),
    ]);
    setCompanies(data ?? []);
    const counts = (users ?? []).reduce((acc, u) => {
      if (u.company_id) acc[u.company_id] = (acc[u.company_id] || 0) + 1;
      return acc;
    }, {});
    setUserCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtros + sort ───────────────────────────────────────────────
  const filtered = companies
    .filter((c) => {
      if (planFilter !== 'all'   && (c.plan ?? 'free') !== planFilter) return false;
      if (statusFilter === 'active'   && !c.is_active)  return false;
      if (statusFilter === 'inactive' &&  c.is_active)  return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.nit?.includes(q) || c.city?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'name')    return (a.name ?? '').localeCompare(b.name ?? '');
      if (sortBy === 'users')   return (userCounts[b.id] ?? 0) - (userCounts[a.id] ?? 0);
      if (sortBy === 'plan')    return (a.plan ?? '').localeCompare(b.plan ?? '');
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Resset page on filter change
  useEffect(() => { setPage(0); }, [search, planFilter, statusFilter, sortBy]);

  // ── Stats resumen ────────────────────────────────────────────────
  const stats = {
    total:    companies.length,
    active:   companies.filter((c) => c.is_active).length,
    pro:      companies.filter((c) => c.plan === 'pro').length,
    enterprise: companies.filter((c) => c.plan === 'enterprise').length,
  };

  // ── Acciones ─────────────────────────────────────────────────────
  const openNew  = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (c) => { setForm({ ...c }); setModal(c); };

  const handleSave = async () => {
    setSaving(true);
    if (modal === 'new') {
      await supabase.from('bapesu_companies').insert({ ...form });
    } else {
      await supabase.from('bapesu_companies').update({ ...form, updated_at: new Date().toISOString() }).eq('id', modal.id);
    }
    setSaving(false);
    setModal(null);
    load();
  };

  const handleToggle = async (c) => {
    await supabase.from('bapesu_companies').update({ is_active: !c.is_active }).eq('id', c.id);
    load();
  };

  const handleChangePlan = async (id, plan) => {
    await supabase.from('bapesu_companies').update({ plan, updated_at: new Date().toISOString() }).eq('id', id);
    load();
  };

  const openUserModal = (company) => {
    setUserForm({ ...EMPTY_USER, password: genPassword() });
    setUserError('');
    setUserCreated(null);
    setShowPwd(false);
    setUserModal(company);
  };

  const handleCreateUser = async () => {
    setUserError('');
    if (!userForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
      setUserError('Ingresa un correo válido'); return;
    }
    if (userForm.password.length < 6) {
      setUserError('La contraseña debe tener al menos 6 caracteres'); return;
    }
    setUserSaving(true);
    try {
      const { data, error: signErr } = await supabaseAuxAuth.auth.signUp({
        email: userForm.email.trim(),
        password: userForm.password,
      });
      if (signErr) throw signErr;
      if (!data.user) throw new Error('No se pudo obtener el usuario creado');

      await supabaseAuxAuth.auth.signOut();

      const { error: rpcErr } = await supabase.rpc('superadmin_assign_user_to_company', {
        p_user_id:    data.user.id,
        p_company_id: userModal.id,
        p_role:       userForm.role,
      });
      if (rpcErr) throw rpcErr;

      setUserCreated({ email: userForm.email.trim(), password: userForm.password });
      load();
    } catch (e) {
      setUserError(e.message ?? 'Error al crear el usuario');
    }
    setUserSaving(false);
  };

  const SortBtn = ({ id, label }) => (
    <button onClick={() => setSortBy(id)}
      className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition ${sortBy === id ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:text-gray-600'}`}>
      {label} {sortBy === id && '↓'}
    </button>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Empresas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión centralizada de todos los clientes de la plataforma</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Nueva empresa
        </button>
      </div>

      {/* ── KPIs resumen ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',       value: stats.total,       color: 'from-violet-400 to-purple-500', icon: '🏢' },
          { label: 'Activas',     value: stats.active,      color: 'from-emerald-400 to-teal-500',  icon: '✅' },
          { label: 'Plan Pro',    value: stats.pro,         color: 'from-yellow-400 to-amber-500',  icon: '⭐' },
          { label: 'Enterprise',  value: stats.enterprise,  color: 'from-indigo-400 to-violet-500', icon: '🚀' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-base flex-shrink-0`}>{k.icon}</div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{k.label}</p>
              <p className="text-xl font-extrabold text-gray-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nombre, email, NIT…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* Plan */}
        <div className="flex gap-1">
          {[['all','Todos'], ['free','Gratis'], ['pro','Pro'], ['enterprise','Enterprise']].map(([v, l]) => (
            <button key={v} onClick={() => setPlanFilter(v)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition ${planFilter === v ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Estado */}
        <div className="flex gap-1">
          {[['all','Estado'], ['active','Activas'], ['inactive','Inactivas']].map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition ${statusFilter === v ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {l}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-400 ml-auto">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Cabecera tabla */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-2.5 border-b border-gray-100 bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
          <div className="col-span-4 flex items-center gap-1">Empresa <SortBtn id="name" label="A-Z" /></div>
          <div className="col-span-2">Contacto</div>
          <div className="col-span-2 flex items-center gap-1">Plan <SortBtn id="plan" label="↕" /></div>
          <div className="col-span-1 flex items-center gap-1">Usuarios <SortBtn id="users" label="↕" /></div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-2 text-right flex items-center justify-end gap-1">
            Registro <SortBtn id="created_at" label="↕" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="w-6 h-6 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm text-gray-400">Sin resultados para los filtros aplicados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paginated.map((c) => {
              const plan = PLAN_META[c.plan ?? 'free'];
              const uc   = userCounts[c.id] ?? 0;
              return (
                <div key={c.id} className={`grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-gray-50/60 transition group ${!c.is_active ? 'opacity-50' : ''}`}>

                  {/* Empresa */}
                  <div className="col-span-10 md:col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
                      {c.name?.[0]?.toUpperCase() ?? 'E'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{c.name}</p>
                      {c.city && <p className="text-[10px] text-gray-400">{c.city}</p>}
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="hidden md:block col-span-2 min-w-0">
                    <p className="text-xs text-gray-500 truncate">{c.email ?? '—'}</p>
                    {c.nit && <p className="text-[10px] text-gray-400">NIT {c.nit}</p>}
                  </div>

                  {/* Plan */}
                  <div className="hidden md:block col-span-2">
                    <select value={c.plan ?? 'free'} onChange={(e) => handleChangePlan(c.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-violet-300 ${plan.badge}`}>
                      {PLANS.map((p) => <option key={p} value={p}>{PLAN_META[p].label}</option>)}
                    </select>
                  </div>

                  {/* Usuarios */}
                  <div className="hidden md:flex col-span-1 items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    <span className="text-xs font-semibold text-gray-700">{uc}</span>
                  </div>

                  {/* Estado */}
                  <div className="hidden md:block col-span-1">
                    <button onClick={() => handleToggle(c)}
                      className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      {c.is_active ? 'Activa' : 'Inactiva'}
                    </button>
                  </div>

                  {/* Fecha + acciones */}
                  <div className="hidden md:flex col-span-2 items-center justify-end gap-1.5">
                    <span className="text-[10px] text-gray-400 mr-1">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    </span>
                    {/* Crear acceso */}
                    <button onClick={() => openUserModal(c)} title="Crear usuario para esta empresa"
                      className="w-7 h-7 rounded-lg bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center transition opacity-0 group-hover:opacity-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                    </button>
                    {/* Editar empresa */}
                    <button onClick={() => openEdit(c)} title="Editar empresa"
                      className="w-7 h-7 rounded-lg bg-gray-100 text-gray-400 hover:bg-violet-100 hover:text-violet-700 flex items-center justify-center transition opacity-0 group-hover:opacity-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                  </div>

                  {/* Mobile: acciones */}
                  <div className="col-span-2 md:hidden flex justify-end">
                    <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Paginación ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-400">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white disabled:opacity-30 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = totalPages <= 7 ? i : (page < 4 ? i : (page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i));
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold border transition ${pg === page ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 hover:bg-white'}`}>
                    {pg + 1}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white disabled:opacity-30 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal crear usuario para empresa ── */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Crear acceso de usuario</h2>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-gradient-to-br from-violet-400 to-purple-500 text-white text-[10px] flex items-center justify-center font-bold">{userModal.name?.[0]}</span>
                  {userModal.name}
                </p>
              </div>
              <button onClick={() => setUserModal(null)} className="text-gray-400 hover:text-gray-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {userCreated ? (
              /* ── Credenciales generadas ── */
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <svg className="w-6 h-6 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Usuario creado exitosamente</p>
                    <p className="text-xs text-emerald-600">Comparte estas credenciales con el dueño de la empresa</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[['Correo', userCreated.email], ['Contraseña', userCreated.password]].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-sm font-mono text-gray-900 flex-1 break-all">{val}</p>
                        <button onClick={() => navigator.clipboard.writeText(val)}
                          className="text-gray-400 hover:text-violet-600 transition flex-shrink-0" title="Copiar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  ⚠️ Guarda esta contraseña ahora. No podrás verla de nuevo.
                </p>
                <button onClick={() => setUserModal(null)}
                  className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition">
                  Listo, cerrar
                </button>
              </div>
            ) : (
              /* ── Formulario ── */
              <div className="p-6 space-y-4">
                {userError && (
                  <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{userError}</div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Correo electrónico *</label>
                  <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="dueño@empresa.com"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Contraseña temporal *</label>
                    <button onClick={() => setUserForm({ ...userForm, password: genPassword() })}
                      className="text-[10px] text-violet-600 hover:text-violet-800 font-semibold">↻ Generar</button>
                  </div>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50 pr-10 font-mono" />
                    <button onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPwd
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                          : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
                        }
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rol en la empresa</label>
                  <div className="flex gap-2">
                    {[['admin','Administrador','bg-yellow-50 border-yellow-300 text-yellow-700'],['user','Usuario','bg-indigo-50 border-indigo-300 text-indigo-700']].map(([val, lbl, cls]) => (
                      <button key={val} onClick={() => setUserForm({ ...userForm, role: val })}
                        className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition ${userForm.role === val ? cls : 'border-gray-200 text-gray-400 bg-white hover:bg-gray-50'}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setUserModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                  <button onClick={handleCreateUser} disabled={userSaving || !userForm.email || !userForm.password}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition disabled:opacity-50">
                    {userSaving ? 'Creando…' : 'Crear acceso'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal crear/editar ── */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">{modal === 'new' ? 'Nueva empresa' : `Editar empresa`}</h2>
                {modal !== 'new' && <p className="text-xs text-gray-400 mt-0.5">{modal.name}</p>}
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { key: 'name',  label: 'Nombre comercial *', type: 'text',  full: true },
                { key: 'email', label: 'Email',              type: 'email' },
                { key: 'nit',   label: 'NIT / Identificación', type: 'text' },
                { key: 'phone', label: 'Teléfono',           type: 'text' },
                { key: 'city',  label: 'Ciudad',             type: 'text' },
              ].map(({ key, label, type, full }) => (
                <div key={key} className={full ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input type={type} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Plan</label>
                <select value={form.plan ?? 'free'} onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50">
                  {PLANS.map((p) => <option key={p} value={p}>{PLAN_META[p].label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 self-end pb-1">
                <input type="checkbox" id="is_active" checked={form.is_active ?? true}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded accent-violet-600" />
                <label htmlFor="is_active" className="text-sm text-gray-600">Empresa activa</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="px-4 py-2 text-sm font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-50">
                {saving ? 'Guardando…' : modal === 'new' ? 'Crear empresa' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
