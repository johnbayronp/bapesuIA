import React from 'react';

export default function InfoBanner() {
  return (
    <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <img
                src="https://avatars.githubusercontent.com/u/24235962?v=4"
                alt="Desarrollador de Software"
                className="h-24 w-24 mr-6 rounded-full object-cover border-2 border-blue-200 dark:border-blue-300"
              />
              <div>
                <h2 className="text-4xl font-bold mb-2">Jhon B. Perez</h2>
                <p className="text-blue-100 dark:text-blue-200 text-lg">Desarrollador de Software - Creado con IA</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-blue-100 dark:text-blue-200">¿Qué Hacemos?</h3>
                <p className="text-lg leading-relaxed text-blue-50 dark:text-blue-100 text-justify">
                  Desarrollamos herramientas de Inteligencia Artificial diseñadas específicamente para emprendedores. Nuestro objetivo es simplificar tu trabajo diario y potenciar tu creatividad con tecnología de vanguardia.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 text-blue-100 dark:text-blue-200">¿Por Qué Lo Hacemos?</h3>
                <p className="text-lg leading-relaxed text-blue-50 dark:text-blue-100 text-justify">
                  Creemos en democratizar la tecnología. Cada herramienta está creada pensando en tus necesidades específicas, permitiéndote enfocarte en lo que realmente importa: hacer crecer tu negocio.
                </p>
              </div>
            </div>
            <div className="bg-white/10 dark:bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
              <h3 className="text-2xl font-bold mb-6 text-center text-blue-100 dark:text-blue-200">Nuestro Compromiso</h3>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-200 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg text-blue-50 dark:text-blue-100">Tecnología accesible para todos</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-200 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg text-blue-50 dark:text-blue-100">Herramientas intuitivas y fáciles de usar</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-200 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg text-blue-50 dark:text-blue-100">Soporte continuo y actualizaciones</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-200 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg text-blue-50 dark:text-blue-100">Innovación constante</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
  );
} 