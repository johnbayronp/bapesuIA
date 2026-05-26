import React from 'react';
import { INPUT, LABEL, formatPriceCOP, parsePriceCOP } from './constants';

export default function ServiceModal({ modal, form, setF, onSave, onClose, saving, error }) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-yellow-400 to-amber-500" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">
              {modal.mode === 'add' ? 'Nuevo servicio' : 'Editar servicio'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className={LABEL}>Nombre del servicio *</label>
              <input
                className={INPUT}
                value={form.name}
                onChange={(e) => setF('name', e.target.value)}
                placeholder="Ej: Diseño de logo"
                autoFocus
              />
            </div>

            <div>
              <label className={LABEL}>Descripción</label>
              <textarea
                rows={2}
                className={INPUT + ' resize-none'}
                value={form.description}
                onChange={(e) => setF('description', e.target.value)}
                placeholder="¿Qué incluye este servicio?"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Precio base *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={INPUT}
                  value={formatPriceCOP(form.default_price)}
                  onChange={(e) => setF('default_price', parsePriceCOP(e.target.value))}
                  placeholder="350.000"
                />
              </div>
              <div>
                <label className={LABEL}>Unidad</label>
                <input
                  className={INPUT}
                  value={form.unit}
                  onChange={(e) => setF('unit', e.target.value)}
                  placeholder="hora, mes, pieza..."
                />
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setF('is_active', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
              />
              <span className="text-xs text-gray-600">
                Activo (disponible al crear cotizaciones)
              </span>
            </label>

            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition disabled:opacity-60"
            >
              {saving ? 'Guardando...' : modal.mode === 'add' ? 'Guardar servicio' : 'Actualizar'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
