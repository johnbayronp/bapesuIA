import React, { useState } from 'react';
import useToast from '../../hooks/useToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export default function VideoIdeas() {
  const { showSuccess, showError } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      showError('Por favor, ingresa una idea para el video');
      return;
    }

    setIsGenerating(true);

    const systemPrompt = `Eres un filmmaker profesional y eres el mejor creativo del mundo, orientado a emprendedores y creativos, creame un video corto de 1 minuto para la siguiente idea: ${prompt}`;

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Eres un experto en marketing y filmmaking.' },
            { role: 'user', content: systemPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setGeneratedIdeas(data.choices[0].message.content);
      showSuccess('Ideas generadas con éxito');
    } catch (error) {
      console.error('Error al generar ideas:', error);
      showError('Error al generar ideas de videos');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedIdeas);
    showSuccess('Ideas copiadas al portapapeles');
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ideas Generadas</h2>
            {generatedIdeas && (
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

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Generando ideas...</p>
            </div>
          ) : generatedIdeas ? (
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg max-h-[500px] overflow-y-auto">
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{generatedIdeas}</p>
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
