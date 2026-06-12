import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superadminApi } from '../../api';
import { queryKeys } from '../../lib/queryKeys';
import { unwrapSupabaseResponse } from '../../lib/queryUtils';

const ALL_MODULES = [
  { id: 'clientes',    label: 'Clientes' },
  { id: 'cobros',      label: 'Cobros' },
  { id: 'cotizaciones',label: 'Cotizaciones' },
  { id: 'servicios',   label: 'Servicios' },
  { id: 'inventario',  label: 'Inventario' },
  { id: 'reminders',   label: 'Recordatorios' },
  { id: 'analytics',   label: 'Analíticas' },
  { id: 'facturacion', label: 'Facturación' },
];

const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

export default function SAPlans() {
  const queryClient = useQueryClient();
  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);

  const plansQuery = useQuery({
    queryKey: queryKeys.superadmin.plans,
    queryFn: () => superadminApi.listPlans().then(unwrapSupabaseResponse),
  });

  const plans = plansQuery.data ?? [];
  const loading = plansQuery.isLoading;

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await superadminApi.updatePlan(id, payload);
      if (response.error) throw response.error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.superadmin.plans }),
  });

  const openEdit = (plan) => {
    setForm({ ...plan, modules: [...(plan.modules ?? [])] });
    setModal(plan);
  };

  const toggleModule = (modId) => {
    setForm((f) => {
      const mods = [...(f.modules ?? [])];
      const idx  = mods.indexOf(modId);
      if (idx >= 0) mods.splice(idx, 1); else mods.push(modId);
      return { ...f, modules: mods };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await updatePlanMutation.mutateAsync({ id: modal.id, payload: {
      name:         form.name,
      description:  form.description,
      price_cop:    Number(form.price_cop ?? 0),
      max_users:    Number(form.max_users ?? 1),
      max_clients:  Number(form.max_clients ?? 50),
      max_products: Number(form.max_products ?? 0),
      modules:      form.modules,
      updated_at:   new Date().toISOString(),
    }});
    setSaving(false);
    setModal(null);
  };

  const PLAN_COLORS = {
    free:       { bg: 'bg-gray-50',      border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-600' },
    pro:        { bg: 'bg-yellow-50',    border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
    enterprise: { bg: 'bg-violet-50',   border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
  };

  if (loading) return <div className="flex items-center justify-center h-40"><svg className="w-6 h-6 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Planes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configura precios, límites y módulos por plan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const c = PLAN_COLORS[plan.id] ?? PLAN_COLORS.free;
          return (
            <div key={plan.id} className={`${c.bg} border ${c.border} rounded-2xl p-5 shadow-sm space-y-4`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>{plan.name}</span>
                <button onClick={() => openEdit(plan)}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-violet-700 hover:border-violet-200 flex items-center justify-center transition shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{plan.price_cop > 0 ? formatCOP(plan.price_cop) : 'Gratis'}</p>
                {plan.price_cop > 0 && <p className="text-xs text-gray-400">/ mes</p>}
              </div>
              {plan.description && <p className="text-xs text-gray-500">{plan.description}</p>}
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {plan.max_users >= 999 ? 'Usuarios ilimitados' : `${plan.max_users} usuario${plan.max_users !== 1 ? 's' : ''}`}
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {plan.max_clients >= 9999 ? 'Clientes ilimitados' : `Hasta ${plan.max_clients} clientes`}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Módulos incluidos</p>
                <div className="flex flex-wrap gap-1">
                  {ALL_MODULES.map((m) => {
                    const inc = (plan.modules ?? []).includes(m.id);
                    return (
                      <span key={m.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${inc ? 'bg-white border border-emerald-200 text-emerald-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
                        {m.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal editar plan */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-extrabold text-gray-900">Editar plan — {modal.name}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'name',         label: 'Nombre del plan' },
                  { key: 'price_cop',    label: 'Precio COP/mes',  type: 'number' },
                  { key: 'max_users',    label: 'Máx. usuarios',   type: 'number' },
                  { key: 'max_clients',  label: 'Máx. clientes',   type: 'number' },
                  { key: 'max_products', label: 'Máx. productos',  type: 'number' },
                ].map(({ key, label, type = 'text' }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <input type={type} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                  <input value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Módulos incluidos</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MODULES.map((m) => {
                    const checked = (form.modules ?? []).includes(m.id);
                    return (
                      <label key={m.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition ${checked ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleModule(m.id)} className="rounded text-emerald-500" />
                        <span className="text-sm text-gray-700">{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-50">
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
