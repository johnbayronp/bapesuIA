import React from 'react';

const donations = [
  { label: '$5.000',   href: 'https://biz.payulatam.com/B0f6f0aC9E25FA1' },
  { label: '$20.000',  href: 'https://biz.payulatam.com/B0f6f0a1C6F7613' },
  { label: '$50.000',  href: 'https://biz.payulatam.com/L0f6f0a9F320F05' },
  { label: '$100.000', href: 'https://biz.payulatam.com/L0f6f0aED99B14C' },
];

function Footer() {
  return (
    <footer className="relative mt-12 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0e0e1a] overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

      {/* Orbs */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 orb bg-indigo-600/15 dark:bg-indigo-600/20" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 orb bg-cyan-500/10 dark:bg-cyan-500/15" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Support section */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">
            Apoya el proyecto
          </p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Invítanos un ☕
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Tu apoyo mantiene las herramientas gratuitas y en constante mejora.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {donations.map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                <button className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/15 hover:border-indigo-400 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:shadow-[0_0_14px_rgba(99,102,241,0.25)] transition-all duration-200 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                  <span className="mr-1.5">☕</span>{label}
                </button>
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent mb-6" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>© {new Date().getFullYear()} <span className="text-indigo-600 dark:text-indigo-400 font-medium">BapesuTech</span>. Todos los derechos reservados.</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Herramientas activas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
