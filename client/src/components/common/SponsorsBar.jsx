import React from 'react';
import { Link } from 'react-router-dom';
import logoLight from '@/assets/logo-light.png';
import logoDark from '@/assets/logo-dark.png';

const sponsors = [
  { name: 'BapesuTech', logoLight, logoDark, href: 'https://bapesutech.com' },
];

export default function SponsorsBar() {
  return (
    <div className="relative border-t border-gray-200/60 dark:border-white/6 bg-white/40 dark:bg-white/[0.015] backdrop-blur-sm overflow-hidden">
      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 py-7">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Label */}
          <div className="flex-shrink-0 text-center sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-0.5">
              Patrocinadores
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 hidden sm:block">
              Empresas que hacen posible este proyecto
            </p>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-gray-200 dark:bg-white/8" />

          {/* Sponsors list */}
          {sponsors.length > 0 ? (
            <div className="flex flex-wrap items-center gap-6">
              {sponsors.map(({ name, logoLight, logoDark, logo, href }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity duration-200 grayscale hover:grayscale-0"
                >
                  {(logoLight || logo) ? (
                    <>
                      {logoLight && <img src={logoLight} alt={name} className="h-7 w-auto object-contain block dark:hidden" />}
                      {logoDark  && <img src={logoDark}  alt={name} className="h-7 w-auto object-contain hidden dark:block" />}
                      {!logoLight && logo && <img src={logo} alt={name} className="h-7 w-auto object-contain" />}
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      {name}
                    </span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            /* Empty state - slots available */
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-28 rounded-lg bg-gray-100 dark:bg-white/4 border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center"
                >
                  <span className="text-[10px] text-gray-300 dark:text-gray-700 font-medium">Tu marca</span>
                </div>
              ))}
              <Link
                to="/colabora"
                className="ml-1 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors underline underline-offset-2"
              >
                ¿Quieres aparecer aquí?
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
