import React, { useState } from 'react';
import axios from 'axios';
import useToast from '../../hooks/useToast';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import api from '../../lib/axiosConfig';

export default function RemoveBackground() {
  const { showSuccess, showError } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProcessedImage(null); // Resetear la imagen procesada al seleccionar una nueva
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      
      const response = await api.post(`/tools/remove-background`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob' // Importante: especificar que esperamos un blob
      });

      // Crear URL para la imagen procesada
      const imageUrl = URL.createObjectURL(new Blob([response.data], { type: 'image/png' }));
      setProcessedImage(imageUrl);
      showSuccess('Imagen procesada con éxito');
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      showError('Error al procesar la imagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = 'imagen-sin-fondo.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
        </div>

        {selectedFile && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Imagen Original</h3>
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              </div>

              {processedImage && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Imagen Procesada</h3>
                  <div className="flex justify-center">
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              {!processedImage && (
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
                >
                  {isProcessing ? 'Procesando...' : 'Procesar Imagen'}
                </button>
              )}

              {processedImage && (
                <button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar Imagen
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
} 