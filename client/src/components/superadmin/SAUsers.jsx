import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

const ROLES = ['user', 'admin', 'superadmin'];
const ROLE_COLORS = {
  user:       'bg-gray-100 text-gray-600',
  admin:      'bg-blue-100 text-blue-700',
  superadmin: 'bg-violet-100 text-violet-700',
};

export default function SAUsers() {
  const [users,      setUsers]      = useState([]);
  const [companies,  setCompanies]  = useState({});
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: us }, { data: cos }] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase.from('bapesu_companies').select('id,name,plan'),
    ]);
    const allUsers = us ?? [];
    setUsers(allUsers);
    const map = {};
    (cos ?? []).forEach((c) => { map[c.id] = c; });
    setCompanies(map);
    setLoading(false);
  }, []);

  // El dueño de cada empresa = primer admin creado por company_id
  const ownerIds = useMemo(() => {
    const ids = new Set();
    const firstAdmin = {};
    [...users]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .forEach((u) => {
        if (u.role === 'admin' && u.company_id && !firstAdmin[u.company_id]) {
          firstAdmin[u.company_id] = u.id;
          ids.add(u.id);
        }
      });
    return ids;
  }, [users]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (uid, role) => {
    await supabase.from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', uid);
    load();
  };

  const handleToggle = async (u) => {
    await supabase.from('users').update({ is_active: !u.is_active }).eq('id', u.id);
    load();
  };

  const filtered = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .filter((u) => {
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          u.email?.toLowerCase().includes(q) ||
          u.first_name?.toLowerCase().includes(q) ||
          u.last_name?.toLowerCase().includes(q) ||
          companies[u.company_id]?.name?.toLowerCase().includes(q)
        );
      });
  }, [users, roleFilter, search, companies]);

  const ownerCount = ownerIds.size;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} registrado{users.length !== 1 ? 's' : ''} · {ownerCount} dueño{ownerCount !== 1 ? 's' : ''} de empresa
          </p>
        </div>
        {/* Leyenda */}
        <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
          <span className="text-base leading-none">👑</span>
          Primer admin creado por empresa = dueño
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email, nombre o empresa…"
          className="w-full max-w-xs px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
        <div className="flex gap-1.5">
          {['all', ...ROLES].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${roleFilter === r ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {r === 'all' ? 'Todos' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="w-6 h-6 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-10">Sin resultados</p>}
            {filtered.map((u) => {
              const co      = companies[u.company_id];
              const isOwner = ownerIds.has(u.id);
              const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ');
              const planBadge = {
                free:       'bg-gray-100 text-gray-500',
                pro:        'bg-yellow-100 text-yellow-700',
                enterprise: 'bg-violet-100 text-violet-700',
              }[co?.plan] ?? 'bg-gray-100 text-gray-500';

              return (
                <div key={u.id}
                  className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition flex-wrap group ${isOwner ? 'bg-amber-50/40' : ''}`}>

                  {/* Avatar + corona */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm
                      ${isOwner ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                      {u.email?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    {isOwner && (
                      <span className="absolute -top-1.5 -right-1.5 text-[13px] leading-none" title="Dueño de la empresa">👑</span>
                    )}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.email}</p>
                      {isOwner && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">
                          Dueño
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {fullName && <span className="text-[11px] text-gray-500">{fullName}</span>}
                      {co ? (
                        <>
                          {fullName && <span className="text-gray-300 text-[10px]">·</span>}
                          <span className="text-[11px] text-gray-600 font-medium truncate max-w-[140px]">{co.name}</span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${planBadge}`}>{co.plan}</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Sin empresa</span>
                      )}
                    </div>
                  </div>

                  {/* Role selector */}
                  <select value={u.role ?? 'user'} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-violet-300 ${ROLE_COLORS[u.role ?? 'user']}`}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>

                  {/* Estado */}
                  <button onClick={() => handleToggle(u)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition ${u.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                    {u.is_active ? '● Activo' : '○ Inactivo'}
                  </button>

                  {/* Fecha */}
                  <span className="text-[10px] text-gray-400 hidden lg:block w-20 text-right">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
