import React, { useState } from 'react';
import useToast from '../../hooks/useToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export default function ViralTitles() {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState({ topic: '', platform: 'YouTube', niche: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [titles, setTitles] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleCopy = () => { navigator.clipboard.writeText(titles); showSuccess('Títulos copiados'); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    const prompt = `Genera 10 títulos virales para un video de ${form.platform}${form.niche ? ` en el nicho de ${form.niche}` : ''} sobre: "${form.topic}".
Requisitos:
- Optimizados para CTR y SEO
- Usa números, emojis o palabras de poder cuando aplique
- Variedad: algunos con curiosidad, algunos con beneficio directo, algunos con urgencia
- Máximo 60 caracteres cada uno
Numera del 1 al 10. Escribe en español.`;

    try {
      const res = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Eres un experto en SEO para YouTube y copywriting viral con más de 10 años de experiencia.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.85,
          max_tokens: 500,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTitles(data.choices[0].message.content);
      showSuccess('Títulos generados');
    } catch {
      showError('Error al generar los títulos');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-violet-500/15 text-violet-500 dark:text-violet-400 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Títulos Virales</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">10 títulos optimizados para máximo CTR y alcance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tema del video</label>
              <textarea name="topic" value={form.topic} onChange={handleChange} required
                placeholder="Ej: Cómo ganar dinero con IA sin experiencia"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors resize-none h-24 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plataforma</label>
                <select name="platform" value={form.platform} onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0d1a] text-gray-900 dark:text-white focus:outline-none focus:border-violet-400 transition-colors text-sm">
                  {['YouTube','TikTok','Instagram','LinkedIn','X (Twitter)'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nicho (opcional)</label>
                <input name="niche" value={form.niche} onChange={handleChange}
                  placeholder="Ej: finanzas, fitness..."
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-violet-400 transition-colors text-sm" />
              </div>
            </div>
            <button type="submit" disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_28px_rgba(139,92,246,0.45)]">
              {isGenerating ? 'Generando títulos...' : 'Generar 10 Títulos'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Títulos Generados</h3>
            {titles && (
              <button onClick={handleCopy} className="text-xs text-gray-500 dark:text-gray-400 hover:text-violet-500 flex items-center gap-1.5 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Copiar
              </button>
            )}
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-white/2 rounded-xl border border-gray-100 dark:border-white/5 p-4 min-h-[320px] max-h-[460px] overflow-y-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                <p className="text-sm text-gray-400">Generando títulos virales...</p>
              </div>
            ) : titles ? (
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{titles}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <svg className="w-10 h-10 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                <p className="text-sm text-gray-400 dark:text-gray-600">Tus títulos aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
