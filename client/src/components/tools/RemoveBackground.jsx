import React, { useState } from 'react';
import { removeBackground } from '@imgly/background-removal';
import useToast from '../../hooks/useToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RemoveBackground() {
  const { showSuccess, showError } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProcessedImage(null);
      setProgress(0);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const blob = await removeBackground(selectedFile, {
        progress: (key, current, total) => {
          if (total > 0) setProgress(Math.round((current / total) * 100));
        },
      });

      const imageUrl = URL.createObjectURL(blob);
      setProcessedImage(imageUrl);
      showSuccess('Imagen procesada con éxito');
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      showError('Error al procesar la imagen');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'imagen-sin-fondo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
        Quitar Fondo de Imagen
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Selecciona una imagen
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Procesamiento 100% en tu navegador. Tu imagen no se sube a ningún servidor.
          </p>
        </div>

        {selectedFile && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Imagen Original</h3>
                <img src={previewUrl} alt="Original" className="w-full h-auto rounded-lg shadow-md" />
              </div>

              {processedImage && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Sin Fondo</h3>
                  <div
                    className="w-full rounded-lg shadow-md overflow-hidden"
                    style={{
                      background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 20px 20px',
                    }}
                  >
                    <img src={processedImage} alt="Sin fondo" className="w-full h-auto" />
                  </div>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Procesando modelo IA en tu navegador...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4 mt-6">
              {!processedImage && (
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
                >
                  {isProcessing ? 'Procesando...' : 'Quitar Fondo'}
                </button>
              )}

              {processedImage && (
                <>
                  <button
                    onClick={() => { setProcessedImage(null); setSelectedFile(null); setPreviewUrl(null); }}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300"
                  >
                    Nueva imagen
                  </button>
                  <button
                    onClick={handleDownload}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar PNG
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
