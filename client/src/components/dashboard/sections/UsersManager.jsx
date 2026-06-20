import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseAuxAuth } from '../../../lib/supabase';
import { adminApi } from '../../../api';
import { useCompany } from '../../../context/CompanyContext';
import { queryKeys } from '../../../lib/queryKeys';
import { invalidateCompanyData, unwrapSupabaseResponse } from '../../../lib/queryUtils';

const EMPTY = { email: '', password: '', confirmPassword: '', role: 'user' };

const INPUT = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400 transition';
const LABEL = 'block text-xs font-medium text-gray-600 mb-1';

const ROLE_LABELS = {
  superadmin: { label: 'Super Admin',   color: 'text-violet-700', bg: 'bg-violet-100' },
  admin:      { label: 'Administrador', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  user:       { label: 'Usuario',       color: 'text-indigo-700', bg: 'bg-indigo-100' },
};

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function UsersManager() {
  const { company, profile } = useCompany();
  const queryClient = useQueryClient();
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState(EMPTY);
  const [showPwd, setShowPwd] = useState(false);
  const [createdInfo, setCreatedInfo] = useState(null); // muestra credenciales tras crear

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  const usersQuery = useQuery({
    queryKey: queryKeys.company.users(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => adminApi.listCompanyUsers(company.id).then(unwrapSupabaseResponse),
  });

  const users = usersQuery.data ?? [];
  const loading = usersQuery.isLoading;
  const invalidate = () => invalidateCompanyData(queryClient, company?.id);

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await adminApi.updateUser(id, payload);
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const assignUserMutation = useMutation({
    mutationFn: async ({ userId, companyId, role }) => {
      const response = await adminApi.assignUserToCompany(userId, companyId, role);
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openModal = () => {
    setForm({ ...EMPTY, password: generatePassword() });
    setError('');
    setCreatedInfo(null);
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setShowPwd(false);
    setCreatedInfo(null);
  };

  const handleCreate = async () => {
    setError('');
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Ingresa un correo válido'); return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres'); return;
    }
    if (form.confirmPassword && form.confirmPassword !== form.password) {
      setError('Las contraseñas no coinciden'); return;
    }

    if (!company?.id) { setError('No tienes una empresa asociada'); return; }
    if (!isAdmin)     { setError('Solo los administradores pueden crear usuarios'); return; }

    setSaving(true);
    try {
      // Crear usuario con cliente auxiliar (no afecta la sesión del admin)
      const { data, error: signErr } = await supabaseAuxAuth.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });
      if (signErr) throw signErr;
      if (!data.user) throw new Error('No se pudo obtener el usuario creado');

      // Limpieza del aux client antes de la RPC (evita conflictos de sesión)
      await supabaseAuxAuth.auth.signOut();

      // Asignar empresa y rol usando función SECURITY DEFINER (evita bloqueo RLS)
      await assignUserMutation.mutateAsync({ userId: data.user.id, companyId: company.id, role: form.role });

      setCreatedInfo({ email: form.email, password: form.password });
    } catch (e) {
      setError(e.message ?? 'No se pudo crear el usuario');
    }
    setSaving(false);
  };

  const handleToggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`¿Cambiar rol de ${u.email} a "${newRole}"?`)) return;
    await updateUserMutation.mutateAsync({ id: u.id, payload: { role: newRole, updated_at: new Date().toISOString() } });
  };

  const handleToggleActive = async (u) => {
    const next = !u.is_active;
    if (!window.confirm(`¿${next ? 'Activar' : 'Desactivar'} a ${u.email}?`)) return;
    await updateUserMutation.mutateAsync({ id: u.id, payload: { is_active: next, updated_at: new Date().toISOString() } });
  };

  const filtered = useMemo(() => users.filter((u) =>
    [u.email, u.first_name, u.last_name].some((v) =>
      (v ?? '').toLowerCase().includes(search.toLowerCase())
    )
  ), [users, search]);

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} cuenta{users.length !== 1 ? 's' : ''} registrada{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition-all shadow-[0_4px_16px_rgba(245,158,11,0.3)] flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Crear usuario
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
          placeholder="Buscar por correo o nombre..."
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-500 font-medium">
            {search ? 'Sin resultados' : 'Aún no hay usuarios registrados'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
            <div className="col-span-5">Usuario</div>
            <div className="col-span-2">Rol</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-2">Creado</div>
            <div className="col-span-1 text-right">Acciones</div>
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.map((u) => {
              const role = ROLE_LABELS[u.role] || ROLE_LABELS.user;
              return (
                <div key={u.id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-12 md:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 flex items-center justify-center text-yellow-700 font-bold text-sm flex-shrink-0">
                      {u.email?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.email}</p>
                      {(u.first_name || u.last_name) && (
                        <p className="text-[11px] text-gray-500 truncate">
                          {[u.first_name, u.last_name].filter(Boolean).join(' ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${role.bg} ${role.color}`}>
                      {role.label}
                    </span>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="col-span-12 md:col-span-2">
                    <p className="text-xs text-gray-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>

                  <div className="col-span-12 md:col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggleRole(u)}
                      title="Cambiar rol"
                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleActive(u)}
                      title={u.is_active ? 'Desactivar' : 'Activar'}
                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={u.is_active
                          ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728'
                          : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                        } />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-yellow-400 to-amber-500" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900">
                  {createdInfo ? '✓ Usuario creado' : 'Nuevo usuario'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {createdInfo ? (
                /* ── Pantalla de éxito con credenciales ── */
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-sm text-emerald-800 font-semibold mb-1">¡Cuenta creada exitosamente!</p>
                    <p className="text-xs text-emerald-700">
                      Comparte estas credenciales con el usuario. Es posible que necesite verificar su correo.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <CredField label="Correo" value={createdInfo.email} />
                    <CredField label="Contraseña" value={createdInfo.password} mono />
                  </div>

                  <button
                    onClick={closeModal}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 font-semibold text-sm transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                /* ── Formulario de creación ── */
                <div className="space-y-3">
                  <div>
                    <label className={LABEL}>Correo electrónico *</label>
                    <input type="email" className={INPUT} value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="usuario@empresa.com" />
                  </div>

                  <div>
                    <label className={LABEL}>Contraseña *</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        className={INPUT + ' pr-20'}
                        value={form.password}
                        onChange={(e) => setF('password', e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="p-1 text-gray-400 hover:text-gray-700"
                          title={showPwd ? 'Ocultar' : 'Mostrar'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={showPwd
                              ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                              : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                            } />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setF('password', generatePassword())}
                          className="p-1 text-gray-400 hover:text-yellow-600"
                          title="Generar contraseña aleatoria"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Tip: usa el botón ↻ para generar una segura</p>
                  </div>

                  <div>
                    <label className={LABEL}>Rol</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(ROLE_LABELS).map(([key, val]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setF('role', key)}
                          className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition ${
                            form.role === key
                              ? `${val.bg} ${val.color} border-current`
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {val.label}
                        </button>
                      ))}
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

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCreate}
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {saving && (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      Crear cuenta
                    </button>
                    <button
                      onClick={closeModal}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CredField({ label, value, mono }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={value}
          className={`${INPUT} ${mono ? 'font-mono tracking-wide' : ''} cursor-text select-all bg-gray-50`}
        />
        <button
          onClick={handleCopy}
          className={`px-3 py-2.5 rounded-xl border transition flex-shrink-0 ${
            copied
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
          title="Copiar"
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
