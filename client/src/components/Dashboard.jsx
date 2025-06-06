import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const tools = [
    {
      title: 'Remover Fondo',
      description: 'Elimina el fondo de tus imágenes de forma automática',
      path: '/remove-background',
      icon: '🎨'
    },
    {
      title: 'Generar Imágenes',
      description: 'Crea imágenes únicas usando IA',
      path: '/generate-image',
      icon: '🖼️'
    },
    {
      title: 'Ideas para Videos',
      description: 'Genera ideas creativas para tus videos',
      path: '/video-ideas',
      icon: '🎥'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Herramientas de IA
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.path}
            to={tool.path}
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="text-4xl mb-4">{tool.icon}</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {tool.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
} 