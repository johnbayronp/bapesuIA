import React, { useState } from 'react';
import useToast from '../../hooks/useToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export default function YoutubeDescription() {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState({ title: '', topic: '', channel: '', cta: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleCopy = () => { navigator.clipboard.writeText(description); showSuccess('Descripción copiada'); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    const prompt = `Escribe una descripción completa para YouTube para el video titulado: "${form.title}".
Tema: ${form.topic}.
${form.channel ? `Canal: ${form.channel}.` : ''}
${form.cta ? `CTA principal: ${form.cta}.` : ''}

Estructura:
1. Párrafo de introducción SEO (2-3 frases con palabras clave naturales)
2. Lo que aprenderás en este video (lista de 4-5 puntos)
3. Timestamps marcadores (00:00 Intro, 00:30 ..., etc.) - inventar tiempos realistas
4. Llamada a la acción (suscribirse, comentar, compartir)
5. Hashtags relevantes (15-20)

Escribe en español. Que sea profesional y natural.`;

    try {
      const res = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Eres un experto en SEO para YouTube y creación de contenido digital.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDescription(data.choices[0].message.content);
      showSuccess('Descripción generada');
    } catch {
      showError('Error al generar la descripción');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Descripción YouTube</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Descripción completa con SEO, timestamps y hashtags</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título del video</label>
              <input name="title" value={form.title} onChange={handleChange} required
                placeholder="Ej: Cómo Hacer Dinero con IA en 2025 (Método Real)"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-500 transition-colors text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tema / Contenido del video</label>
              <textarea name="topic" value={form.topic} onChange={handleChange} required
                placeholder="Describe brevemente de qué trata el video..."
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-500 transition-colors resize-none h-24 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre del canal</label>
                <input name="channel" value={form.channel} onChange={handleChange}
                  placeholder="Ej: Bapesu Studio"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CTA principal</label>
                <input name="cta" value={form.cta} onChange={handleChange}
                  placeholder="Ej: Suscríbete gratis"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors text-sm" />
              </div>
            </div>
            <button type="submit" disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 shadow-[0_4px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_4px_28px_rgba(6,182,212,0.45)]">
              {isGenerating ? 'Generando...' : 'Generar Descripción'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Descripción Generada</h3>
            {description && (
              <button onClick={handleCopy} className="text-xs text-gray-500 dark:text-gray-400 hover:text-cyan-500 flex items-center gap-1.5 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Copiar
              </button>
            )}
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-white/2 rounded-xl border border-gray-100 dark:border-white/5 p-4 min-h-[360px] max-h-[500px] overflow-y-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                <p className="text-sm text-gray-400">Generando descripción...</p>
              </div>
            ) : description ? (
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{description}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <svg className="w-10 h-10 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                <p className="text-sm text-gray-400 dark:text-gray-600">Tu descripción aparecerá aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
