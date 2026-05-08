import React from 'react';
import { Link } from 'react-router-dom';
import InfoBanner from '../common/InfoBanner';
import AdBanner from '../adsence/AdBanner';

const tools = [
  {
    title: 'Quitar Fondo',
    description: 'Elimina el fondo de cualquier imagen con IA directamente en tu navegador. Sin subir datos a ningún servidor.',
    to: '/tools/remove-background',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.3)',
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
    iconColor: 'text-violet-500 dark:text-violet-400',
    border: 'hover:border-violet-500/40',
    badge: 'IA Local',
    badgeColor: 'bg-violet-500/15 text-violet-400 border border-violet-500/25',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Descripciones con IA',
    description: 'Genera descripciones profesionales y persuasivas para tus productos o servicios al instante.',
    to: '/tools/product-description',
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
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: 'Ideas para Videos',
    description: 'Obtén guiones e ideas creativas y estructuradas para tus videos generados por inteligencia artificial.',
    to: '/tools/video-ideas',
    gradient: 'from-rose-500 to-pink-500',
    glow: 'rgba(244,63,94,0.3)',
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/15',
    iconColor: 'text-rose-500 dark:text-rose-400',
    border: 'hover:border-rose-500/40',
    badge: 'Gratis',
    badgeColor: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
  },
  {
    title: 'Link de WhatsApp',
    description: 'Crea enlaces personalizados para iniciar conversaciones de WhatsApp con mensaje predefinido.',
    to: '/tools/whatsapp-link-generator',
    gradient: 'from-emerald-500 to-green-400',
    glow: 'rgba(16,185,129,0.3)',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    border: 'hover:border-emerald-500/40',
    badge: 'Gratis',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.565 4.14 1.543 5.876L.057 23.5l5.773-1.469A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.673-.498-5.21-1.367l-.374-.217-3.426.872.906-3.319-.24-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
    ),
  },
  {
    title: 'Generador de QR',
    description: 'Crea códigos QR personalizados al instante para URLs, redes sociales o productos, sin servidor.',
    to: '/tools/qr-generator',
    popular: true,
    gradient: 'from-amber-500 to-orange-400',
    glow: 'rgba(245,158,11,0.3)',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    iconColor: 'text-amber-500 dark:text-amber-400',
    border: 'hover:border-amber-500/40',
    badge: 'Gratis',
    badgeColor: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    title: 'Agregar Logo',
    description: 'Añade tu marca o watermark a una o varias imágenes. Elige posición, tamaño y opacidad con preview en vivo.',
    to: '/tools/logo-stamper',
    popular: true,
    gradient: 'from-pink-500 to-rose-500',
    glow: 'rgba(236,72,153,0.3)',
    iconBg: 'bg-pink-500/10 dark:bg-pink-500/15',
    iconColor: 'text-pink-500 dark:text-pink-400',
    border: 'hover:border-pink-500/40',
    badge: 'Gratis',
    badgeColor: 'bg-pink-500/15 text-pink-400 border border-pink-500/25',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Cuenta de Cobro',
    description: 'Crea cuentas de cobro profesionales en PDF con datos del cliente, servicios, total automático y conversión a letras.',
    to: '/tools/invoice-generator',
    popular: true,
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.3)',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    border: 'hover:border-emerald-500/40',
    badge: 'Nuevo',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m-7 4h8a2 2 0 002-2V6a2 2 0 00-2-2h-8a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Cotización Rápida',
    description: 'Genera cotizaciones profesionales con vista previa en tiempo real. Logo, ítems, totales automáticos y descarga en PDF.',
    to: '/tools/quotation-generator',
    popular: true,
    gradient: 'from-yellow-400 to-amber-500',
    glow: 'rgba(234,179,8,0.3)',
    iconBg: 'bg-yellow-500/10 dark:bg-yellow-500/15',
    iconColor: 'text-yellow-500 dark:text-yellow-400',
    border: 'hover:border-yellow-500/40',
    badge: 'Nuevo',
    badgeColor: 'bg-yellow-500/15 text-yellow-500 border border-yellow-500/25',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Nómina Colombia 2026',
    description: 'Calcula salario neto, aportes, prestaciones sociales y costo total empresa según la ley colombiana. Descarga la colilla en PDF.',
    to: '/tools/payroll-calculator',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.3)',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    iconColor: 'text-amber-500 dark:text-amber-400',
    border: 'hover:border-amber-500/40',
    badge: 'Nuevo',
    badgeColor: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 7h6m-6 4h6m-6 4h4M5 5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
      </svg>
    ),
  },
];

export default function ToolsPage() {
  // Los "Más usados" siempre primero, manteniendo el orden original entre ellos
  const sortedTools = [...tools].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));

  return (
    <div className="space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero section ── */}
        <div className="relative text-center py-14 mb-4 overflow-hidden">
          {/* Background orbs */}
          <div className="absolute top-0 left-1/4 w-80 h-80 orb bg-indigo-600/10 dark:bg-indigo-600/20 float-slow" />
          <div className="absolute top-10 right-1/4 w-60 h-60 orb bg-cyan-500/10 dark:bg-cyan-500/15 float" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-96 h-32 orb bg-violet-500/10 dark:bg-violet-500/10" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 text-indigo-500 dark:text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Bapesu IA · Suite
            </span>

            <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 leading-tight">
              <span className="text-gray-900 dark:text-white">Herramientas </span>
              <span className="gradient-text-vivid">de IA</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
              Potencia tu trabajo con tecnología de vanguardia, gratis y sin necesidad de cuenta.
            </p>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-8 mt-8">
              {[[String(tools.length), 'Herramientas'], ['100%', 'Gratis'], ['IA', 'Integrada']].map(([val, label]) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-bold gradient-text">{val}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tools grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedTools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className={`group relative flex flex-col rounded-2xl border bg-white/60 dark:bg-white/2 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1.5 ${
                tool.popular
                  ? 'border-amber-400/60 dark:border-amber-500/40 shadow-[0_0_20px_-8px_rgba(245,158,11,0.4)]'
                  : 'border-gray-200/60 dark:border-white/6'
              } ${tool.border}`}
              style={{ '--glow': tool.glow }}
            >
              {/* Hover glow overlay */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 1px var(--glow), 0 8px 40px -8px var(--glow)` }}
              />

              {/* Popular badge (top-left) */}
              {tool.popular && (
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md tracking-wider uppercase z-10">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
                  </svg>
                  Más usado
                </span>
              )}

              {/* Badge */}
              <span className={`absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full ${tool.badgeColor}`}>
                {tool.badge}
              </span>

              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl ${tool.iconBg} ${tool.iconColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {tool.icon}
              </div>

              {/* Content */}
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 pr-12">
                {tool.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed flex-grow">
                {tool.description}
              </p>

              {/* CTA */}
              <div className={`mt-5 flex items-center gap-1 text-sm font-semibold bg-gradient-to-r ${tool.gradient} bg-clip-text text-transparent`}>
                Usar ahora
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" style={{ stroke: 'currentColor' }} fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Bottom accent */}
              <div className={`absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r ${tool.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-300`} />
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <AdBanner />
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="relative overflow-hidden rounded-2xl mx-4 sm:mx-6 lg:mx-8 border border-indigo-500/20">
        {/* Base gradient - rich deep navy to violet to teal */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#1a1060] to-[#0d2137]" />
        {/* Overlay shimmer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 via-transparent to-cyan-500/15" />
        {/* Grid */}
        <div className="absolute inset-0 bg-grid opacity-15" />
        {/* Orbs */}
        <div className="absolute -top-16 -left-16 w-72 h-72 orb bg-violet-600/25 float-slow" />
        <div className="absolute top-0 right-0 w-80 h-80 orb bg-indigo-500/20 float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-0 left-1/3 w-56 h-56 orb bg-cyan-500/20 float-slow" style={{ animationDelay: '3s' }} />
        {/* Top border glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        <div className="relative z-10 p-10 sm:p-14">
          <InfoBanner />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-4">
        <p className="text-xs text-gray-400 dark:text-gray-700 mb-3">Publicidad</p>
        <AdBanner />
      </div>
    </div>
  );
}
