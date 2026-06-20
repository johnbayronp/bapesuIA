import { useState, useEffect } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { superadminApi } from '../../api';
import { useCompany } from '../../context/CompanyContext';
import { queryKeys } from '../../lib/queryKeys';
import SACompanies from './SACompanies';
import SAPlans from './SAPlans';
import SAUsers from './SAUsers';

const NAV = [
  {
    id: 'overview', label: 'Resumen', href: '/superadmin',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    id: 'companies', label: 'Empresas', href: '/superadmin/companies',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    id: 'plans', label: 'Planes', href: '/superadmin/plans',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    id: 'users', label: 'Usuarios', href: '/superadmin/users',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

function SAOverview() {
  const overviewQuery = useQuery({
    queryKey: queryKeys.superadmin.dashboard,
    queryFn: superadminApi.dashboard,
  });

  const companies = overviewQuery.data?.companies ?? [];
  const users = overviewQuery.data?.users ?? [];
  const byPlan = companies.reduce((acc, c) => {
    acc[c.plan ?? 'free'] = (acc[c.plan ?? 'free'] || 0) + 1;
    return acc;
  }, {});
  const stats = { companies: companies.length, users: users.length, byPlan };
  const loading = overviewQuery.isLoading;

  const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

  const PLAN_PRICES = { free: 0, pro: 79000, enterprise: 0 };
  const mrr = Object.entries(stats.byPlan).reduce((s, [p, c]) => s + (PLAN_PRICES[p] ?? 0) * c, 0);

  const cards = [
    { label: 'Empresas activas', value: stats.companies, icon: '🏢', color: 'from-violet-400 to-purple-500' },
    { label: 'Usuarios totales',  value: stats.users,     icon: '👥', color: 'from-blue-400 to-indigo-500' },
    { label: 'MRR estimado',      value: formatCOP(mrr),  icon: '💰', color: 'from-emerald-400 to-teal-500' },
    { label: 'Planes Pro',        value: stats.byPlan.pro ?? 0, icon: '⭐', color: 'from-yellow-400 to-amber-500' },
  ];

  if (loading) return <div className="flex items-center justify-center h-40"><svg className="w-6 h-6 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Resumen de plataforma</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vista global de todas las empresas y usuarios</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-xl flex-shrink-0`}>{c.icon}</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{c.label}</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{c.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 mb-4">Distribución por plan</h2>
        <div className="space-y-3">
          {[['free','Gratis','bg-gray-200'],['pro','Pro','bg-yellow-400'],['enterprise','Enterprise','bg-violet-400']].map(([id,name,color]) => {
            const count = stats.byPlan[id] ?? 0;
            const pct = stats.companies > 0 ? Math.round((count / stats.companies) * 100) : 0;
            return (
              <div key={id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">{name}</span>
                  <span className="text-xs text-gray-400">{count} empresa{count !== 1 ? 's' : ''} · {pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperAdmin, loading } = useCompany();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isSuperAdmin) navigate('/dashboard', { replace: true });
  }, [loading, isSuperAdmin, navigate]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <svg className="w-8 h-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  const isActive = (href) => href === '/superadmin' ? location.pathname === href : location.pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-violet-100">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div>
            <p className="text-sm font-extrabold text-violet-700">Super Admin</p>
            <p className="text-[10px] text-violet-400">Bapesu Platform</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.id} to={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              {item.icon}{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-200 space-y-1">
        <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Volver al dashboard
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{user?.email?.[0]?.toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{user?.email}</p>
            <p className="text-[10px] text-violet-500 font-semibold">superadmin</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 fixed top-0 left-0 h-screen z-20">
        <SidebarContent />
      </aside>
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 h-screen w-60 bg-white border-r border-gray-200 z-40 flex flex-col md:hidden shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}
      <div className="flex-1 flex flex-col md:ml-60 min-h-screen">
        <header className="h-14 flex items-center justify-between px-5 bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
          <button className="md:hidden text-gray-500 hover:text-gray-900" onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">⚡ Super Admin</span>
          </div>
          <div />
        </header>
        <main className="flex-1 p-5 overflow-auto">
          <Routes>
            <Route path="/" element={<SAOverview />} />
            <Route path="/companies" element={<SACompanies />} />
            <Route path="/plans" element={<SAPlans />} />
            <Route path="/users" element={<SAUsers />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
