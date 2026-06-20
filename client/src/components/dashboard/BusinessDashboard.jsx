import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../context/CompanyContext';
import CompanyOnboarding from './CompanyOnboarding';
import DashboardRouteCache from './DashboardRouteCache';
import { renderDashboardPage } from './dashboardRoutes';

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

        {/* Page content — secciones visitadas permanecen montadas (keep-alive) */}
        <main className="flex-1 p-5 overflow-auto">
          <DashboardRouteCache
            renderPage={(pathname) => renderDashboardPage(pathname, { canAccess, company })}
          />
        </main>
      </div>
    </div>
  );
}
