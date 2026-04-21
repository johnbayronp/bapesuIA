import React, { useState } from 'react';
import useToast from '../../hooks/useToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export default function ScriptGenerator() {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState({ topic: '', duration: '3', platform: 'YouTube', tone: 'educativo' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleCopy = () => { navigator.clipboard.writeText(script); showSuccess('Guión copiado'); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    const prompt = `Crea un guión completo de video de ${form.duration} minutos para ${form.platform} sobre el tema: "${form.topic}".
Tono: ${form.tone}.
Estructura:
- INTRO (gancho + presentación)
- DESARROLLO (puntos principales con transiciones)
- CIERRE (resumen + llamada a la acción)
Incluye indicaciones de cámara básicas entre corchetes. Escribe en español.`;

    try {
      const res = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Eres un guionista profesional especialista en contenido para redes sociales y YouTube.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1200,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setScript(data.choices[0].message.content);
      showSuccess('Guión generado con éxito');
    } catch {
      showError('Error al generar el guión');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/15 text-red-500 dark:text-red-400 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Generador de Guión</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Guiones profesionales con estructura narrativa completa</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tema del video</label>
              <textarea name="topic" value={form.topic} onChange={handleChange} required
                placeholder="Ej: Cómo iniciar un negocio online con $0 en 2025"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors resize-none h-28 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duración</label>
                <select name="duration" value={form.duration} onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0d1a] text-gray-900 dark:text-white focus:outline-none focus:border-red-400 transition-colors text-sm">
                  {['1','2','3','5','10'].map(v => <option key={v} value={v}>{v} min</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plataforma</label>
                <select name="platform" value={form.platform} onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0d1a] text-gray-900 dark:text-white focus:outline-none focus:border-red-400 transition-colors text-sm">
                  {['YouTube','TikTok','Instagram Reels','Podcast'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tono</label>
              <select name="tone" value={form.tone} onChange={handleChange}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0d1a] text-gray-900 dark:text-white focus:outline-none focus:border-red-400 transition-colors text-sm">
                {['educativo','entretenido','motivacional','informativo','conversacional','dramático'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <button type="submit" disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_28px_rgba(239,68,68,0.45)]">
              {isGenerating ? 'Escribiendo guión...' : 'Generar Guión'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Guión Generado</h3>
            {script && (
              <button onClick={handleCopy} className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Copiar
              </button>
            )}
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-white/2 rounded-xl border border-gray-100 dark:border-white/5 p-4 min-h-[360px] max-h-[500px] overflow-y-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                <p className="text-sm text-gray-400">Escribiendo guión...</p>
              </div>
            ) : script ? (
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{script}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <svg className="w-10 h-10 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-sm text-gray-400 dark:text-gray-600">Tu guión aparecerá aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
