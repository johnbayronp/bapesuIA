import { useState } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { superadminApi } from '../../api';
import { useCompany, PLAN_LABELS } from '../../context/CompanyContext';
import CompanyOnboarding from './CompanyOnboarding';
import DashHome from './sections/DashHome';
import ClientsManager from './sections/ClientsManager';
import UsersManager from './sections/UsersManager';
import CompanySettings from './sections/CompanySettings';
import ServicesManager from './sections/services';
import Analytics from './sections/Analytics';
import Reminders from './sections/Reminders';
import InventoryModule from './sections/inventory';
import InventoryTestPanel from './sections/inventory/InventoryTestPanel';
import CobrosModule from './sections/CobrosModule';
import FacturaEditor from './sections/FacturaEditor';
import QuotationsList from './sections/QuotationsList';
import QuotationEditor from './sections/QuotationEditor';
import InvoiceEditor from './sections/InvoiceEditor';

// Orden de jerarquía de planes
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

// Pantalla mostrada cuando el módulo no está en el plan
function LockedModule({ moduleName, plan }) {
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

  const openModal = async () => {
    setShowModal(true);
  };

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
          onClick={openModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-sm font-bold text-gray-900 shadow hover:shadow-md transition active:scale-95"
        >
          ✨ Ver planes y actualizar
        </button>
      </div>

      {/* Modal de upgrade */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
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
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Escribir por WhatsApp
                    </a>
                    <a
                      href="mailto:bayronperezs@outlook.es?subject=Quiero%20actualizar%20mi%20plan%20en%20Bapesu%20IA"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
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

const NAV = [
  {
    id: 'home',
    label: 'Inicio',
    href: '/dashboard',
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'clients',
    label: 'Clientes',
    href: '/dashboard/clients',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'services',
    label: 'Servicios',
    href: '/dashboard/services',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: 'Analíticas',
    href: '/dashboard/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'reminders',
    label: 'Recordatorios',
    href: '/dashboard/reminders',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

const BIZ = [
  {
    id: 'inventory',
    module: 'inventario',
    label: 'Inventario',
    href: '/dashboard/inventory',
    accent: 'text-indigo-600',
    activeBg: 'bg-indigo-50 text-indigo-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'cobros',
    module: 'cobros',
    label: 'Cobros',
    href: '/dashboard/cobros',
    accent: 'text-emerald-600',
    activeBg: 'bg-emerald-50 text-emerald-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m-7 4h8a2 2 0 002-2V6a2 2 0 00-2-2h-8a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'quotations',
    module: 'cotizaciones',
    label: 'Cotizaciones',
    href: '/dashboard/quotations',
    accent: 'text-yellow-600',
    activeBg: 'bg-yellow-50 text-yellow-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

const ADMIN = [
  {
    id: 'users',
    label: 'Usuarios',
    href: '/dashboard/users',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'company',
    label: 'Empresa',
    href: '/dashboard/company',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function BusinessDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, company, loading, canAccess, isSuperAdmin } = useCompany();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Si el usuario no tiene empresa, mostrar onboarding
  if (user && !profile?.company_id) {
    return <CompanyOnboarding />;
  }

  const isActive = (href, exact) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand + Company */}
      <div className="px-4 py-4 border-b border-gray-200">
        <Link to="/dashboard/company" className="block group">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition">
            {company?.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-9 h-9 rounded-lg object-contain bg-white border border-gray-200 shadow-sm flex-shrink-0 p-0.5"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 items-center justify-center text-gray-900 font-extrabold text-sm flex-shrink-0 shadow-sm"
              style={{ display: company?.logo_url ? 'none' : 'flex' }}
            >
              {company?.name?.[0]?.toUpperCase() ?? 'E'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-none truncate">
                {company?.name ?? 'Mi empresa'}
              </p>
              <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Plan {company?.plan ?? 'free'}
              </p>
            </div>
            <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 px-3 mb-2">General</p>
        {NAV.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-yellow-50 text-yellow-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        <p className="text-[10px] uppercase tracking-widest text-gray-400 px-3 mt-5 mb-2">Documentos</p>
        {BIZ.map((item) => {
          const active  = isActive(item.href, item.exact);
          const allowed = canAccess(item.module);
          return (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active ? item.activeBg : allowed ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <span className={active ? '' : allowed ? item.accent : 'text-gray-300'}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {!allowed && (
                <svg className="w-3.5 h-3.5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              )}
            </Link>
          );
        })}

        <p className="text-[10px] uppercase tracking-widest text-gray-400 px-3 mt-5 mb-2">Administración</p>
        {ADMIN.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-yellow-50 text-yellow-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* SuperAdmin link */}
      {isSuperAdmin && (
        <div className="px-3 pb-3">
          <Link
            to="/superadmin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Super Admin
          </Link>
        </div>
      )}

      {/* User footer */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{user?.email ?? '—'}</p>
            <p className="text-[10px] text-gray-500 capitalize">{profile?.role ?? 'Usuario'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 fixed top-0 left-0 h-screen z-20">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar ── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-gray-900/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-screen w-60 bg-white border-r border-gray-200 z-40 flex flex-col md:hidden shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col md:ml-60 min-h-screen">

        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-5 bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
          <button
            className="md:hidden text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 font-medium">
            {[...NAV, ...BIZ, ...ADMIN].find((n) =>
              n.exact ? location.pathname === n.href : location.pathname.startsWith(n.href)
            )?.label ?? 'Dashboard'}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/tools"
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Herramientas IA
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 overflow-auto">
          <Routes>
            <Route path="/" element={<DashHome />} />
            <Route path="/clients" element={<ClientsManager />} />
            <Route path="/services" element={canAccess('servicios') ? <ServicesManager /> : <LockedModule moduleName="Servicios" plan={company?.plan} />} />
            <Route path="/analytics" element={canAccess('analytics') ? <Analytics /> : <LockedModule moduleName="Analíticas" plan={company?.plan} />} />
            <Route path="/reminders" element={canAccess('reminders') ? <Reminders /> : <LockedModule moduleName="Recordatorios" plan={company?.plan} />} />
            <Route path="/inventory" element={canAccess('inventario') ? <InventoryModule /> : <LockedModule moduleName="Inventario" plan={company?.plan} />} />
            <Route path="/inv-test" element={<InventoryTestPanel />} />

            {/* Módulo unificado Cobros */}
            <Route path="/cobros" element={canAccess('cobros') ? <CobrosModule /> : <LockedModule moduleName="Cobros" plan={company?.plan} />} />
            <Route path="/cobros/invoices/new" element={canAccess('cobros') ? <InvoiceEditor /> : <LockedModule moduleName="Cobros" plan={company?.plan} />} />
            <Route path="/cobros/invoices/:id" element={canAccess('cobros') ? <InvoiceEditor /> : <LockedModule moduleName="Cobros" plan={company?.plan} />} />
            <Route path="/cobros/facturas/new" element={canAccess('facturacion') ? <FacturaEditor /> : <LockedModule moduleName="Facturación" plan={company?.plan} />} />
            <Route path="/cobros/facturas/:id" element={canAccess('facturacion') ? <FacturaEditor /> : <LockedModule moduleName="Facturación" plan={company?.plan} />} />

            <Route path="/quotations" element={canAccess('cotizaciones') ? <QuotationsList /> : <LockedModule moduleName="Cotizaciones" plan={company?.plan} />} />
            <Route path="/quotations/new" element={canAccess('cotizaciones') ? <QuotationEditor /> : <LockedModule moduleName="Cotizaciones" plan={company?.plan} />} />
            <Route path="/quotations/:id" element={canAccess('cotizaciones') ? <QuotationEditor /> : <LockedModule moduleName="Cotizaciones" plan={company?.plan} />} />

            <Route path="/users" element={<UsersManager />} />
            <Route path="/company" element={<CompanySettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
