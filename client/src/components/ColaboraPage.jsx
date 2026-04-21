import React, { useState } from 'react';

const tiers = [
  {
    label: '$5.000',
    href: 'https://biz.payulatam.com/B0f6f0aC9E25FA1',
    title: 'Café ☕',
    description: 'Un pequeño gesto que ayuda a mantener los servidores encendidos.',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.35)',
    border: 'border-emerald-500/25 hover:border-emerald-400/60',
    bg: 'bg-emerald-500/8 dark:bg-emerald-500/10',
    icon: '☕',
    popular: false,
  },
  {
    label: '$20.000',
    href: 'https://biz.payulatam.com/B0f6f0a1C6F7613',
    title: 'Supporter 🚀',
    description: 'Apoya el desarrollo de nuevas herramientas y mejoras continuas.',
    gradient: 'from-indigo-500 to-blue-500',
    glow: 'rgba(99,102,241,0.4)',
    border: 'border-indigo-500/40 hover:border-indigo-400/80',
    bg: 'bg-indigo-500/8 dark:bg-indigo-500/12',
    icon: '🚀',
    popular: true,
  },
  {
    label: '$50.000',
    href: 'https://biz.payulatam.com/L0f6f0a9F320F05',
    title: 'Colaborador 💡',
    description: 'Contribuye al crecimiento de la plataforma y nuevas funciones.',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.35)',
    border: 'border-violet-500/25 hover:border-violet-400/60',
    bg: 'bg-violet-500/8 dark:bg-violet-500/10',
    icon: '💡',
    popular: false,
  },
  {
    label: '$100.000',
    href: 'https://biz.payulatam.com/L0f6f0aED99B14C',
    title: 'Fundador 🌟',
    description: 'Sé parte de la historia de Bapesu IA y ayuda a democratizar la tecnología.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.35)',
    border: 'border-amber-500/25 hover:border-amber-400/60',
    bg: 'bg-amber-500/8 dark:bg-amber-500/10',
    icon: '🌟',
    popular: false,
  },
];

const perks = [
  { icon: '🛠️', title: 'Nuevas herramientas', desc: 'Tu apoyo financia el desarrollo de más herramientas gratuitas de IA.' },
  { icon: '⚡', title: 'Mejor rendimiento', desc: 'Mejores servidores y APIs para respuestas más rápidas y precisas.' },
  { icon: '🔓', title: 'Acceso libre', desc: 'Gracias a tu apoyo podemos mantener todo gratuito para todos.' },
  { icon: '🌍', title: 'Impacto real', desc: 'Ayudas a emprendedores a acceder a tecnología de vanguardia.' },
];

export default function ColaboraPage() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero ── */}
        <div className="relative text-center py-14 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-80 h-80 orb bg-indigo-600/10 dark:bg-indigo-600/18 float-slow" />
          <div className="absolute top-8 right-1/4 w-60 h-60 orb bg-amber-500/8 dark:bg-amber-500/12 float" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-96 h-28 orb bg-emerald-500/8" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 text-indigo-500 dark:text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Apoya el proyecto
            </span>
            <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 leading-tight">
              <span className="text-gray-900 dark:text-white">Haz que </span>
              <span className="bg-gradient-to-r from-indigo-500 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Bapesu IA
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">siga creciendo</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
              Somos un proyecto independiente que ofrece herramientas de IA completamente gratis.
              Cada donación nos ayuda a seguir mejorando y creando nuevas funciones.
            </p>
          </div>
        </div>

        {/* ── Perks ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {perks.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white/60 dark:bg-white/2 border border-gray-200/60 dark:border-white/6 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">{title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>

        {/* ── Donation tiers ── */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Elige tu contribución</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Todos los montos son en pesos colombianos (COP)</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.label}
              className={`relative rounded-2xl border ${tier.border} ${tier.bg} p-6 transition-all duration-300 cursor-pointer hover:-translate-y-1`}
              style={{ boxShadow: selected === tier.label ? `0 0 0 1px var(--g), 0 8px 40px -8px var(--g)`.replace(/var\(--g\)/g, tier.glow) : undefined }}
              onClick={() => setSelected(tier.label)}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg tracking-wide uppercase">
                  Más popular
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className="text-3xl mt-0.5">{tier.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{tier.title}</h3>
                    <span className={`text-lg font-extrabold bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>
                      {tier.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                    {tier.description}
                  </p>
                  <a href={tier.href} target="_blank" rel="noopener noreferrer">
                    <button
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${tier.gradient} hover:opacity-90 transition-all duration-200`}
                      style={{ boxShadow: `0 4px 20px -4px ${tier.glow}` }}
                    >
                      Donar {tier.label}
                    </button>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── About section ── */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/15">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c0a1e] via-[#0f0c2e] to-[#090f1e]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/15 via-transparent to-cyan-500/10" />
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="absolute -top-10 -left-10 w-64 h-64 orb bg-indigo-500/20 float-slow" />
          <div className="absolute bottom-0 right-0 w-48 h-48 orb bg-cyan-500/15 float" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

          <div className="relative z-10 p-10 sm:p-12">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full mb-5 tracking-widest uppercase">
                  Quiénes somos
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
                  Un proyecto hecho<br />
                  <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">con pasión</span>
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  Bapesu IA es un proyecto independiente creado por un solo desarrollador con la visión de democratizar el acceso a la inteligencia artificial para emprendedores y creadores.
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  No tenemos inversores ni grandes patrocinadores. Cada herramienta que ves aquí fue construida con tiempo, dedicación y el apoyo de personas como tú.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Herramientas activas', value: '9', color: 'text-indigo-400' },
                  { label: 'Herramientas gratis', value: '100%', color: 'text-emerald-400' },
                  { label: 'Desarrolladores', value: '1', color: 'text-amber-400' },
                  { label: 'Tecnología de IA', value: 'DeepSeek + ONNX', color: 'text-cyan-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between bg-white/5 rounded-xl border border-white/8 px-4 py-3">
                    <span className="text-sm text-gray-300">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Thank you note ── */}
        <div className="mt-10 text-center py-8">
          <div className="text-3xl mb-3">🙏</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Gracias por tu apoyo</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Cada contribución, sin importar el monto, tiene un impacto real. Gracias por creer en este proyecto y en la democratización de la tecnología.
          </p>
        </div>

      </div>
    </div>
  );
}
