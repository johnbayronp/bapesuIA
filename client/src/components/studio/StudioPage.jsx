import React from 'react';
import { Link } from 'react-router-dom';
import AdBanner from '../adsence/AdBanner';

const tools = [
  {
    title: 'Generador de Guión',
    description: 'Crea guiones completos para tus videos con estructura profesional: intro, desarrollo y cierre.',
    to: '/studio/script',
    gradient: 'from-red-500 to-rose-600',
    glow: 'rgba(239,68,68,0.3)',
    iconBg: 'bg-red-500/10 dark:bg-red-500/15',
    iconColor: 'text-red-500 dark:text-red-400',
    border: 'hover:border-red-500/40',
    badge: 'Gratis',
    badgeColor: 'bg-red-500/15 text-red-400 border border-red-500/25',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Hook de Apertura',
    description: 'Genera los primeros 15 segundos irresistibles para enganchar a tu audiencia desde el inicio.',
    to: '/studio/hook',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.3)',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    iconColor: 'text-amber-500 dark:text-amber-400',
    border: 'hover:border-amber-500/40',
    badge: 'Gratis',
    badgeColor: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Títulos Virales',
    description: 'Obtén 10 títulos optimizados para clicks, SEO y engagement en YouTube o redes sociales.',
    to: '/studio/titles',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.3)',
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
    iconColor: 'text-violet-500 dark:text-violet-400',
    border: 'hover:border-violet-500/40',
    badge: 'Gratis',
    badgeColor: 'bg-violet-500/15 text-violet-400 border border-violet-500/25',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    title: 'Descripción YouTube',
    description: 'Genera descripciones completas con keywords, timestamps y llamadas a la acción para YouTube.',
    to: '/studio/description',
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'rgba(6,182,212,0.3)',
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    iconColor: 'text-cyan-500 dark:text-cyan-400',
    border: 'hover:border-cyan-500/40',
    badge: 'Gratis',
    badgeColor: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
  },
];

const stats = [
  ['4', 'Herramientas'],
  ['IA', 'Integrada'],
  ['100%', 'Gratis'],
];

export default function StudioPage() {
  return (
    <div className="space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero ── */}
        <div className="relative text-center py-14 mb-4 overflow-hidden">
          {/* Orbs */}
          <div className="absolute top-0 left-1/4 w-80 h-80 orb bg-red-600/10 dark:bg-red-600/15 float-slow" />
          <div className="absolute top-10 right-1/4 w-60 h-60 orb bg-amber-500/10 dark:bg-amber-500/12 float" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-96 h-32 orb bg-rose-500/8 dark:bg-rose-500/10" />

          <div className="relative z-10">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 text-red-500 dark:text-red-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Bapesu · Studio
            </span>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 leading-tight">
              <span className="text-gray-900 dark:text-white">Bapesu </span>
              <span
                className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent"
              >
                Studio
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
              Herramientas para filmmakers y creadores de contenido. Produce videos mejores, más rápido.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-8">
              {stats.map(([val, label]) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-red-500 to-amber-400 bg-clip-text text-transparent">{val}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Film strip decoration ── */}
        <div className="flex items-center gap-2 mb-8 overflow-hidden opacity-20 dark:opacity-15 select-none pointer-events-none" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-8 h-6 rounded-sm bg-gray-400 dark:bg-gray-600 odd:opacity-60" />
          ))}
        </div>

        {/* ── Tools grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {tools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className={`group relative flex gap-5 rounded-2xl border border-gray-200/60 dark:border-white/6 bg-white/60 dark:bg-white/2 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 ${tool.border}`}
              style={{ '--glow': tool.glow }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 1px var(--glow), 0 8px 40px -8px var(--glow)` }}
              />

              {/* Icon */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${tool.iconBg} ${tool.iconColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mt-0.5`}>
                {tool.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">{tool.title}</h2>
                  <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed mb-4">
                  {tool.description}
                </p>
                <div className={`flex items-center gap-1 text-sm font-semibold bg-gradient-to-r ${tool.gradient} bg-clip-text text-transparent`}>
                  Abrir herramienta
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" style={{ stroke: 'currentColor' }} fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Bottom accent */}
              <div className={`absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r ${tool.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-300`} />
            </Link>
          ))}
        </div>

        {/* ── About studio ── */}
        <div className="mt-12 relative overflow-hidden rounded-2xl border border-rose-500/15">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a0a] via-[#160a1e] to-[#0a0f1a]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600/15 via-transparent to-amber-500/10" />
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="absolute -top-10 -right-10 w-64 h-64 orb bg-red-600/15 float-slow" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 orb bg-amber-500/10 float" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

          <div className="relative z-10 p-10 sm:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                Para Creadores
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-4">
                Crea contenido que <span className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">conecta</span>
              </h2>
              <p className="text-gray-300 text-base leading-relaxed mb-8">
                Bapesu Studio te da las herramientas de escritura y planificación que necesitas para producir videos profesionales, desde el guión hasta la descripción final. Todo con inteligencia artificial.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                {[
                  { icon: '🎬', title: 'Guiones listos', desc: 'Estructura narrativa completa en segundos.' },
                  { icon: '⚡', title: 'Hooks que enganchan', desc: 'Primeros segundos que retienen a la audiencia.' },
                  { icon: '📈', title: 'SEO optimizado', desc: 'Títulos y descripciones que rankean en YouTube.' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="bg-white/5 rounded-xl border border-white/8 p-4">
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="text-sm font-semibold text-white mb-1">{title}</div>
                    <div className="text-xs text-gray-400 leading-relaxed">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <AdBanner />
        </div>
      </div>
    </div>
  );
}
