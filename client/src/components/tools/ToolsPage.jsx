import React from 'react';
import { Link } from 'react-router-dom';
import InfoBanner from '../common/InfoBanner';

export default function ToolsPage() {
  return (
    <div className="space-y-8">
     
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Herramientas de IA
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Descubre nuestras herramientas potenciadas por Inteligencia Artificial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Remove Background Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Quitar Fondo de Imagen
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Elimina el fondo de tus imágenes de forma automática usando IA
              </p>
              <Link
                to="/tools/remove-background"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300"
              >
                Usar Herramienta
              </Link>
            </div>
          </div>

          {/* Product Description Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Generador de Descripciones
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Crea descripciones profesionales para tus productos y servicios usando IA
              </p>
              <Link
                to="/tools/product-description"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300"
              >
                Usar Herramienta
              </Link>
            </div>
          </div>

          {/* Video Ideas Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Generador de Ideas para Videos
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Obtén ideas creativas y estructuradas para tus videos usando IA
              </p>
              <Link
                to="/tools/video-ideas"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300"
              >
                Usar Herramienta
              </Link>
            </div>
          </div>

          {/* Whatsapp Link Generator Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Generador de Link para WhatsApp
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Crea enlaces personalizados para enviar mensajes directos por WhatsApp fácilmente
              </p>
              <Link
                to="/tools/whatsapp-link-generator"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300"
              >
                Usar Herramienta
              </Link>
            </div>
          </div>
 {/* QR Generator card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Generador de codigos QR
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Crea y genera codigos Qr profesionales para tus productos o para tu empresa
              </p>
              <Link
                to="/tools/qr-generator"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300"
              >
                Usar Herramienta
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Transforma texto a voz
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                convierte texto escrito en habla sintética, permitiendo que los dispositivos "lean" en voz alta.
              </p>
              <Link
                to="/tools/text-x-voz"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300"
              >
                Usar Herramienta
              </Link>
            </div>
          </div>


        </div>
      </div>
       {/* Banner Informativo */}
       <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-gray-800 dark:via-gray-900 dark:to-gray-950 text-white rounded-xl shadow-2xl p-12 mb-12 transition-colors duration-300">
        <InfoBanner />
      </div>

    </div>
  );
} 