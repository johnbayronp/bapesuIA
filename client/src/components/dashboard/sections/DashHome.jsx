import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../context/CompanyContext';

const TOOLS = [
  {
    title: 'Nueva cotización',
    desc: 'Genera una cotización vinculada a un cliente y servicios del catálogo.',
    href: '/dashboard/quotations/new',
    gradient: 'from-yellow-400 to-amber-500',
    iconBg: 'bg-yellow-100',
    icon: (
      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Nueva cuenta de cobro',
    desc: 'Cuenta de cobro con IVA, retefuente y datos del cliente registrado.',
    href: '/dashboard/cobros/invoices/new',
    gradient: 'from-emerald-400 to-teal-500',
    iconBg: 'bg-emerald-100',
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m-7 4h8a2 2 0 002-2V6a2 2 0 00-2-2h-8a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function DashHome() {
  const { user, company } = useCompany();
  const [stats, setStats] = useState({ clients: 0, members: 0, loading: true });
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Buenos días');
    else if (h < 18) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  useEffect(() => {
    if (!company?.id) return;
    Promise.all([
      supabase.from('bapesu_clients').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
    ]).then(([c, u]) => {
      setStats({ clients: c.count ?? 0, members: u.count ?? 0, loading: false });
    });
  }, [company]);

  const name = user?.email?.split('@')[0] ?? 'usuario';

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Welcome */}
      <div>
        <p className="text-sm text-gray-500 mb-1">{greeting}</p>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Hola, <span className="bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent capitalize">{name}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Estás viendo el panel de <span className="font-semibold text-gray-700">{company?.name ?? 'tu empresa'}</span>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Clientes registrados"
          value={stats.loading ? '…' : stats.clients}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="text-yellow-600"
          bg="bg-yellow-100"
          link="/dashboard/clients"
          linkLabel="Ver clientes"
        />
        <StatCard
          label="Miembros del equipo"
          value={stats.loading ? '…' : stats.members}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          color="text-indigo-600"
          bg="bg-indigo-100"
          link="/dashboard/users"
          linkLabel="Ver equipo"
        />
        <StatCard
          label={`Plan ${company?.plan ?? 'free'}`}
          value="Activo"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="text-emerald-600"
          bg="bg-emerald-100"
          link="/dashboard/company"
          linkLabel="Mi empresa"
        />
      </div>

      {/* Quick action */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Acceso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              to={t.href}
              className="group relative flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl ${t.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm mb-1">{t.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className={`absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r ${t.gradient} opacity-0 group-hover:opacity-70 transition-opacity duration-200`} />
            </Link>
          ))}

          {/* Add service shortcut */}
          <Link
            to="/dashboard/services"
            className="group flex items-start gap-4 p-5 rounded-2xl bg-white border-2 border-dashed border-gray-200 hover:border-yellow-400 hover:bg-yellow-50/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-11 h-11 rounded-xl bg-gray-100 group-hover:bg-yellow-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-200">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-500 group-hover:text-gray-900 text-sm mb-1 transition-colors">Catálogo de servicios</p>
              <p className="text-xs text-gray-400">Define los servicios que reutilizarás en cotizaciones.</p>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}

function StatCard({ label, value, icon, color, bg, link, linkLabel }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center`}>
          {icon}
        </div>
        {link && (
          <Link to={link} className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors font-medium">
            {linkLabel} →
          </Link>
        )}
      </div>
      <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
