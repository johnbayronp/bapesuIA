import React from 'react';
import { INPUT, LABEL, CATEGORY_COLORS } from '../constants';

export default function CategoryModal({ modal, form, setF, categories, onSave, onClose, saving, error }) {
  if (!modal) return null;

  const parents = categories.filter((c) => c.id !== modal.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full" style={{ background: form.color }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">
              {modal.mode === 'add' ? 'Nueva categoría' : 'Editar categoría'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className={LABEL}>Nombre *</label>
              <input className={INPUT} value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="Ej: Ropa, Electrónica..." autoFocus />
            </div>
            <div>
              <label className={LABEL}>Descripción</label>
              <input className={INPUT} value={form.description} onChange={(e) => setF('description', e.target.value)} placeholder="Descripción opcional" />
            </div>
            {parents.length > 0 && (
              <div>
                <label className={LABEL}>Categoría padre (opcional)</label>
                <select className={INPUT} value={form.parent_id} onChange={(e) => setF('parent_id', e.target.value)}>
                  <option value="">— Ninguna (categoría raíz) —</option>
                  {parents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={LABEL}>Color</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {CATEGORY_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setF('color', c)}
                    className={`w-7 h-7 rounded-lg transition ${form.color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={onSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition disabled:opacity-60"
              style={{ background: form.color }}>
              {saving ? 'Guardando...' : modal.mode === 'add' ? 'Crear categoría' : 'Actualizar'}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
