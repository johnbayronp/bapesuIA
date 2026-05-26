import React from 'react';

export default function CategoriesTab({ categories, products, onAdd, onEdit, onDelete }) {
  const countFor = (catId) => products.filter((p) => p.category_id === catId).length;
  const roots    = categories.filter((c) => !c.parent_id);
  const children = (parentId) => categories.filter((c) => c.parent_id === parentId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{categories.length} categoría{categories.length !== 1 ? 's' : ''} creadas</p>
        <button onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm transition shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nueva categoría
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl">
          <span className="text-4xl mb-3">🗂️</span>
          <p className="text-gray-700 font-semibold">Aún no hay categorías</p>
          <p className="text-xs text-gray-400 mt-1">Organiza tus productos en categorías.</p>
          <button onClick={onAdd} className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            + Crear la primera
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {roots.map((cat) => {
            const subs = children(cat.id);
            const cnt  = countFor(cat.id);
            return (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Categoría raíz */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm"
                    style={{ background: cat.color }}>
                    {cat.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{cat.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">
                        {cnt} producto{cnt !== 1 ? 's' : ''}
                      </span>
                      {subs.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold text-white" style={{ background: cat.color }}>
                          {subs.length} sub
                        </span>
                      )}
                    </div>
                    {cat.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{cat.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => onEdit(cat)}
                      className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center transition">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button onClick={() => onDelete(cat.id)}
                      className="w-8 h-8 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </div>
                </div>

                {/* Subcategorías */}
                {subs.length > 0 && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {subs.map((sub) => {
                      const subCnt = countFor(sub.id);
                      return (
                        <div key={sub.id} className="flex items-center gap-4 px-5 py-3 pl-16 bg-gray-50/50">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sub.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-gray-700">{sub.name}</p>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 font-semibold">
                                {subCnt} prod.
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => onEdit(sub)}
                              className="w-7 h-7 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center transition">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                            <button onClick={() => onDelete(sub.id)}
                              className="w-7 h-7 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Categorías sin padre (huérfanas por si acaso) */}
          {categories.filter((c) => c.parent_id && !categories.find((p) => p.id === c.parent_id)).length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2 px-1">Sin categoría padre</p>
              {categories.filter((c) => c.parent_id && !categories.find((p) => p.id === c.parent_id)).map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                  <p className="text-sm text-gray-700 flex-1">{cat.name}</p>
                  <button onClick={() => onEdit(cat)} className="w-7 h-7 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center transition">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
