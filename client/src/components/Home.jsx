import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdBanner from './adsence/anuncios';

const Home = () => {
  const navigate = useNavigate();

  const tools = [
    {
      title: 'Generador de Descripciones',
      description: 'Crea descripciones profesionales para tus productos',
      path: '/tools/product-description',
      icon: '📝'
    },
    {
      title: 'Removedor de Fondo',
      description: 'Elimina el fondo de tus imágenes automáticamente',
      path: '/remove-background',
      icon: '🖼️'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Herramientas de IA
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Potencia tu productividad con nuestras herramientas impulsadas por IA
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool) => (
          <div
            key={tool.path}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="text-4xl mb-4">{tool.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {tool.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {tool.description}
              </p>
              <button
                onClick={() => navigate(tool.path)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300"
              >
                Probar Ahora
              </button>
            </div>
          </div>
        ))}
      </div>
      <AdBanner /> 
    </div>
  );
};

export default Home; 