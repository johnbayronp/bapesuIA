import React, { useState } from 'react';
import useToast from '../../hooks/useToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export default function VideoHook() {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState({ topic: '', platform: 'YouTube', style: 'pregunta' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [hooks, setHooks] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleCopy = () => { navigator.clipboard.writeText(hooks); showSuccess('Hooks copiados'); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    const prompt = `Crea 5 hooks de apertura (primeros 15 segundos) para un video de ${form.platform} sobre: "${form.topic}".
Estilo: ${form.style}.
Cada hook debe:
- Generar curiosidad inmediata o impacto emocional
- Ser máximo 2-3 frases
- Empezar en frío (sin "Hola", "Bienvenidos", etc.)
Numera cada hook. Escribe en español.`;

    try {
      const res = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Eres un experto en retención de audiencia y psicología del entretenimiento para video.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.85,
          max_tokens: 600,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHooks(data.choices[0].message.content);
      showSuccess('Hooks generados');
    } catch {
      showError('Error al generar los hooks');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-500 dark:text-amber-400 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Hook de Apertura</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Primeros 15 segundos que retienen a tu audiencia</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tema del video</label>
              <textarea name="topic" value={form.topic} onChange={handleChange} required
                placeholder="Ej: Los 5 errores que arruinan tu ahorro cada mes"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors resize-none h-28 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plataforma</label>
                <select name="platform" value={form.platform} onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0d1a] text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors text-sm">
                  {['YouTube','TikTok','Instagram Reels','LinkedIn'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Estilo</label>
                <select name="style" value={form.style} onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0d1a] text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors text-sm">
                  {['pregunta','dato impactante','historia','controversia','promesa','miedo'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_28px_rgba(245,158,11,0.45)]">
              {isGenerating ? 'Generando hooks...' : 'Generar 5 Hooks'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Hooks Generados</h3>
            {hooks && (
              <button onClick={handleCopy} className="text-xs text-gray-500 dark:text-gray-400 hover:text-amber-500 flex items-center gap-1.5 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Copiar
              </button>
            )}
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-white/2 rounded-xl border border-gray-100 dark:border-white/5 p-4 min-h-[320px] max-h-[460px] overflow-y-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                <p className="text-sm text-gray-400">Creando hooks irresistibles...</p>
              </div>
            ) : hooks ? (
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{hooks}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <svg className="w-10 h-10 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <p className="text-sm text-gray-400 dark:text-gray-600">Tus hooks aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
