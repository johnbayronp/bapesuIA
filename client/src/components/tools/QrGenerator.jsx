import React, { useState } from 'react';
import useToast from '../../hooks/useToast';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import api from '../../lib/axiosConfig';

export default function QrGenerator() {
  const { showSuccess, showError } = useToast();
  const [text, setText] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) {
      showError('Por favor, ingresa el contenido para generar el código QR');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await api.post(
        `/tools/qr_generator`,
        { content: text },
        {
          responseType: 'blob', // <-- importante para recibir la imagen QR
        }
      );

      const qrBlob = new Blob([response.data], { type: 'image/png' });
      const imageUrl = URL.createObjectURL(qrBlob);
      setQrImageUrl(imageUrl);
      showSuccess('Código QR generado con éxito');
    } catch (error) {
      console.error('Error al generar el QR:', error);
      showError('Error al generar el código QR');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (qrImageUrl) {
      const link = document.createElement('a');
      link.href = qrImageUrl;
      link.download = 'codigo-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
        Generador de Códigos QR
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Ingresa el texto o URL
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ej: https://tusitio.com"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
          >
            {isGenerating ? 'Generando...' : 'Generar Código QR'}
          </button>

          {qrImageUrl && (
            <button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar QR
            </button>
          )}
        </div>

        {qrImageUrl && (
          <div className="flex justify-center mt-6">
            <img
              src={qrImageUrl}
              alt="QR generado"
              className="rounded-lg shadow-md max-w-xs"
            />
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
