import React, { useState } from 'react';
import axios from 'axios';
import useToast from '../../hooks/useToast';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

export default function ProductDescription() {
  const { showSuccess, showError } = useToast();
  const [productInfo, setProductInfo] = useState({
    name: '',
    category: '',
    features: '',
    targetAudience: '',
    tone: 'profesional'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Limitar características a 350 caracteres
    if (name === 'features' && value.length > 350) {
      return;
    }
    
    setProductInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const response = await axios.post('/api/generate-description', productInfo);
      setGeneratedDescription(response.data.description);
      showSuccess('Descripción generada con éxito');
    } catch (error) {
      console.error('Error al generar la descripción:', error);
      showError('Error al generar la descripción');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDescription);
    showSuccess('Descripción copiada al portapapeles');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
        Generador de Descripciones con IA
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Producto/Servicio
              </label>
              <input
                type="text"
                name="name"
                value={productInfo.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: Smartphone XYZ"
                required
                maxLength={60}
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Categoría
              </label>
              <input
                type="text"
                name="category"
                value={productInfo.category}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: Electrónica, Ropa, Servicios, etc."
                required
                maxLength={60}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 dark:text-gray-300">
                  Características Principales
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {productInfo.features.length}/350 caracteres
                </span>
              </div>
              <textarea
                name="features"
                value={productInfo.features}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-32"
                placeholder="Describe las características más importantes de tu producto o servicio"
                required
                maxLength={350}
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Público Objetivo
              </label>
              <input
                type="text"
                name="targetAudience"
                value={productInfo.targetAudience}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: Profesionales, Estudiantes, etc."
                required
                maxLength={60}
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Tono de la Descripción
              </label>
              <select
                name="tone"
                value={productInfo.tone}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="profesional">Profesional</option>
                <option value="amigable">Amigable</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="persuasivo">Persuasivo</option>
              </select>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
              >
                {isGenerating ? 'Generando...' : 'Generar Descripción'}
              </button>
            </div>
          </form>
        </div>

        {/* Descripción Generada */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Descripción Generada
            </h3>
            {generatedDescription && (
              <button
                onClick={handleCopy}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                title="Copiar al portapapeles"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 min-h-[400px]">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Generando descripción...</p>
              </div>
            ) : generatedDescription ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {generatedDescription}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">
                La descripción generada aparecerá aquí
              </p>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
} 