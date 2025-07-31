import React, { useState } from 'react';
import useToast from '../../hooks/useToast';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import api from '../../lib/axiosConfig';

export default function TextXVoZ() {
  const { showSuccess, showError } = useToast();
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('es-ES');
  const [gender, setGender] = useState('FEMALE');
  const [audioUrl, setAudioUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) {
      showError('Por favor, ingresa el texto que deseas convertir a voz');
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const response = await api.post(
        `/tools/text_x_voz`,
        { text, language_code: language, gender },
        {
          responseType: 'blob',
        }
      );

      const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
      const audioObjectUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioObjectUrl);
      showSuccess('Audio generado con éxito');
    } catch (error) {
      console.error('Error al generar audio:', error);
      showError('Ocurrió un error al generar el audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = 'audio-generado.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
        Convertir Texto a Voz
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Ingresa el texto
          </label>
          <textarea
            rows="5"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe algo que quieras escuchar..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">Idioma</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border dark:border-gray-600"
            >
              <option value="es-ES">Español (España)</option>
              <option value="en-US">Inglés (EE.UU.)</option>
              <option value="fr-FR">Francés (Francia)</option>
              <option value="pt-BR">Portugués (Brasil)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">Género</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border dark:border-gray-600"
            >
              <option value="FEMALE">Femenino</option>
              <option value="MALE">Masculino</option>
              <option value="NEUTRAL">Neutral</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
          >
            {isGenerating ? 'Generando...' : 'Convertir a Voz'}
          </button>

          {audioUrl && (
            <button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Audio
            </button>
          )}
        </div>

        {audioUrl && (
          <div className="flex justify-center mt-6">
            <audio controls src={audioUrl} className="w-full max-w-md rounded-lg shadow-md" />
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
