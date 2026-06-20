import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { superadminApi } from '../../api';
import { PLAN_LABELS } from '../../context/CompanyContext';

const PLAN_ORDER = ['free', 'pro', 'enterprise'];

const MODULE_LABELS = {
  clientes:      'Clientes',
  cobros:        'Cobros',
  cotizaciones:  'Cotizaciones',
  servicios:     'Servicios',
  inventario:    'Inventario',
  reminders:     'Recordatorios',
  analytics:     'Analíticas',
  facturacion:   'Facturación',
};

const formatCOP = (n) =>
  n === 0 ? 'Gratis' :
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) + '/mes';

export default function LockedModule({ moduleName, plan }) {
  const [showModal, setShowModal] = useState(false);
  const navigate  = useNavigate();
  const planInfo  = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  const currentIdx = PLAN_ORDER.indexOf(plan ?? 'free');

  const plansQuery = useQuery({
    queryKey: ['plans', 'upgrade', plan],
    enabled: showModal,
    queryFn: async () => {
      const response = await superadminApi.listPlans();
      if (response.error) throw response.error;
      return (response.data ?? [])
        .filter((p) => p.is_active && PLAN_ORDER.indexOf(p.id) > currentIdx)
        .sort((a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id));
    },
  });
  const plans = plansQuery.data ?? [];
  const loadingP = plansQuery.isLoading;

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">{moduleName} no disponible</h2>
        <p className="text-sm text-gray-500 max-w-xs mb-5">
          Tu plan actual{' '}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${planInfo.color}`}>
            {planInfo.label}
          </span>{' '}
          no incluye este módulo.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-sm font-bold text-gray-900 shadow hover:shadow-md transition active:scale-95"
        >
          ✨ Ver planes y actualizar
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 px-6 py-5 text-gray-900 flex-shrink-0">
              <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Plan actual</p>
              <h2 className="text-2xl font-extrabold">{planInfo.label}</h2>
              <p className="text-xs opacity-80 mt-1">{moduleName} requiere un plan superior</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {loadingP ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="w-6 h-6 animate-spin text-yellow-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              ) : plans.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Ya tienes el plan máximo disponible. Contacta soporte si algo no funciona.
                </p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 text-center">Planes disponibles para actualizar:</p>
                  <div className="space-y-3">
                    {plans.map((p, i) => {
                      const mods = Array.isArray(p.modules) ? p.modules : [];
                      return (
                        <div key={p.id}
                          className={`rounded-xl border-2 p-4 ${i === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-extrabold text-gray-900">{p.name}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-700'}`}>
                              {formatCOP(p.price_cop)}
                            </span>
                          </div>
                          {p.description && (
                            <p className="text-[11px] text-gray-500 mb-2">{p.description}</p>
                          )}
                          <ul className="space-y-1">
                            {mods.map((m) => (
                              <li key={m} className="flex items-center gap-2 text-xs text-gray-700">
                                <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                {MODULE_LABELS[m] ?? m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-500 text-center pt-1">
                    Para actualizar contacta al administrador de la plataforma:
                  </p>

                  <div className="flex flex-col gap-2">
                    <a
                      href="https://wa.me/573184826845?text=Hola%2C%20quiero%20actualizar%20mi%20plan%20en%20Bapesu%20IA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition"
                    >
                      Escribir por WhatsApp
                    </a>
                    <a
                      href="mailto:bayronperezs@outlook.es?subject=Quiero%20actualizar%20mi%20plan%20en%20Bapesu%20IA"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                    >
                      Enviar correo
                    </a>
                    <button
                      onClick={() => { setShowModal(false); navigate('/dashboard/company'); }}
                      className="py-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
                    >
                      Ver mi plan actual →
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-100 px-6 py-3 flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
