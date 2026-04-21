import React from 'react';

const commitments = [
  'Tecnología accesible para todos',
  'Herramientas intuitivas y fáciles de usar',
  'Soporte continuo y actualizaciones',
  'Innovación constante',
];

export default function InfoBanner() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Author */}
      <div className="flex items-center gap-4 mb-10">
        <div className="relative">
          <img
            src="https://avatars.githubusercontent.com/u/24235962?v=4"
            alt="Jhon B. Perez"
            className="h-16 w-16 rounded-full object-cover ring-2 ring-white/30 shadow-lg"
          />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#1a1a3e] shadow" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Jhon B. Perez</h2>
          <p className="text-indigo-200 text-sm mt-0.5">Desarrollador de Software · Sitio Creado con IA</p>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left - text */}
        <div className="space-y-7">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-500/30 flex items-center justify-center text-indigo-300">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM6.293 6.707a1 1 0 011.414-1.414l.707.707A1 1 0 116.293 7.414l-.707-.707zM3 10a1 1 0 100 2h1a1 1 0 100-2H3zM15 10a1 1 0 100 2h1a1 1 0 100-2h-1zM12.293 6.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM10 14a4 4 0 110-8 4 4 0 010 8z"/>
                </svg>
              </span>
              ¿Qué Hacemos?
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              Desarrollamos herramientas de Inteligencia Artificial diseñadas específicamente para emprendedores. Nuestro objetivo es simplificar tu trabajo diario y potenciar tu creatividad con tecnología de vanguardia.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-cyan-500/30 flex items-center justify-center text-cyan-300">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                </svg>
              </span>
              ¿Por Qué Lo Hacemos?
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              Creemos en democratizar la tecnología. Cada herramienta está creada pensando en tus necesidades específicas, permitiéndote enfocarte en lo que realmente importa: hacer crecer tu negocio.
            </p>
          </div>
        </div>

        {/* Right - commitment card */}
        <div className="bg-white/10 rounded-2xl border border-white/20 p-6 backdrop-blur-sm">
          <h3 className="text-base font-bold text-white mb-5 text-center tracking-wide">
            Nuestro Compromiso
          </h3>
          <ul className="space-y-3">
            {commitments.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center">
                  <svg className="w-3 h-3 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm text-gray-100">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
