import React, { useState } from 'react';
import axios from 'axios';
import useToast from '../../hooks/useToast';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import api from '../../lib/axiosConfig';

export default function VideoIdeas() {
  const { showSuccess, showError } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      showError('Por favor, ingresa una idea para el video');
      return;
    }

    setIsGenerating(true);
    try {

      const response = await api.post(`/tools/generate-things-videos`, {prompt: prompt});

      setGeneratedIdeas(response.data);
      showSuccess('Ideas generadas con éxito');
    } catch (error) {
      showError('Error al generar ideas de videos');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Generador de Ideas para Videos
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Obtén ideas creativas y estructuradas para tus videos usando IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-gray-700 dark:text-gray-300 mb-2">
                ¿Sobre qué quieres hacer un video?
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Tutorial de programación en Python, Review de un producto, Vlog de viajes..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[200px]"
              />
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
              >
                {isGenerating ? 'Generando ideas...' : 'Generar Ideas'}
              </button>
            </div>
          </form>
        </div>

        {/* Resultado */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ideas Generadas
          </h2>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Generando ideas...</p>
            </div>
          ) : generatedIdeas ? (
            <div className="prose dark:prose-invert max-w-none">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg max-h-[500px] overflow-y-auto">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {generatedIdeas.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <p>Las ideas generadas aparecerán aquí</p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
} 