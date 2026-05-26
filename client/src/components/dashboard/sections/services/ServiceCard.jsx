import React from 'react';
import { formatCOP } from './constants';

export default function ServiceCard({ service: s, onEdit, onDelete, onToggleActive, deleting }) {
  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm transition hover:shadow-md ${
      s.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-3">

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{s.name}</h3>
            {!s.is_active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-semibold">
                INACTIVO
              </span>
            )}
          </div>
          {s.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-base font-extrabold text-yellow-600">{formatCOP(s.default_price)}</span>
            {s.unit && <span className="text-[11px] text-gray-400">/ {s.unit}</span>}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">

          {/* Editar */}
          <button
            onClick={() => onEdit(s)}
            title="Editar"
            className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>

          {/* Activar / Desactivar */}
          <button
            onClick={() => onToggleActive(s)}
            title={s.is_active ? 'Desactivar' : 'Activar'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
              s.is_active
                ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {s.is_active ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
            )}
          </button>

          {/* Eliminar */}
          <button
            onClick={() => onDelete(s.id)}
            disabled={deleting === s.id}
            title="Eliminar"
            className="w-8 h-8 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition disabled:opacity-40"
          >
            {deleting === s.id ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
