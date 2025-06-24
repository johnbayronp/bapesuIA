import React, { useState } from 'react';
import codigosPais from '../../utils/countryCodes';

export default function WhatsappLinkGenerator() {
  const [codigoPais, setCodigoPais] = useState('57');
  const [numero, setNumero] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Buscar el país seleccionado
  const paisSeleccionado = codigosPais.find(p => p.codigo === codigoPais) || { digitoMax: 15 };

  const link = numero && mensaje
    ? `https://api.whatsapp.com/send?phone=${codigoPais}${encodeURIComponent(numero)}&text=${encodeURIComponent(mensaje)}`
    : '';

  const handleCopy = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    }
  };

  // Limitar a digitoMax según el país
  const handleNumeroChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.slice(0, paisSeleccionado.digitoMax);
    setNumero(value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
        Generador de Link para WhatsApp
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Código de país:</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white mb-2"
              value={codigoPais}
              onChange={e => { setCodigoPais(e.target.value); setNumero(''); }}
            >
              {codigosPais.map(pais => (
                <option key={pais.codigo} value={pais.codigo}>
                  {pais.nombre} (+{pais.codigo})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Número (sin código de país):</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
              value={numero}
              onChange={handleNumeroChange}
              placeholder="Ej: 3001234567"
              maxLength={paisSeleccionado.digitoMax}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {`Debe tener ${paisSeleccionado.digitoMax} dígitos`}
            </span>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Mensaje:</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-700 dark:text-white"
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="Escribe tu mensaje aquí"
            />
          </div>
        </div>
        {/* Vista del Link Generado */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Link Generado
              </h3>
              {link && (
                <button
                  onClick={handleCopy}
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  title="Copiar al portapapeles"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 min-h-[120px] flex items-center justify-center">
              {link ? (
                <div className="w-full break-all text-center">
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 underline break-all">{link}</a>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center">Completa los campos para generar el enlace</p>
              )}
            </div>
            {copiado && (
              <div className="mt-4 text-green-600 dark:text-green-400 text-center font-semibold">¡Link copiado!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 