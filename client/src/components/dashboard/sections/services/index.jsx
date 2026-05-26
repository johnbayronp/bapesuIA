import React from 'react';
import { useServices } from './useServices';
import ServiceCard from './ServiceCard';
import ServiceModal from './ServiceModal';

export default function ServicesManager() {
  const {
    services, filtered, loading, saving, deleting, error,
    search, setSearch,
    modal, form, setF, openAdd, openEdit, closeModal,
    handleSave, handleDelete, handleToggleActive,
  } = useServices();

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Catálogo de servicios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {services.length} servicio{services.length !== 1 ? 's' : ''} guardado{services.length !== 1 ? 's' : ''}.
            Aparecen al crear cotizaciones y cuentas de cobro.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition shadow-[0_4px_16px_rgba(245,158,11,0.3)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo servicio
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar servicios..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-6 h-6 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-gray-200 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">
            {search ? 'Sin resultados' : 'Aún no hay servicios en tu catálogo'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Empieza agregando los servicios que ofreces a tus clientes.
          </p>
          {!search && (
            <button onClick={openAdd} className="mt-4 text-sm text-yellow-600 hover:text-yellow-700 font-medium">
              + Agregar el primero
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              deleting={deleting}
            />
          ))}
        </div>
      )}

      {/* Modal crear / editar */}
      <ServiceModal
        modal={modal}
        form={form}
        setF={setF}
        onSave={handleSave}
        onClose={closeModal}
        saving={saving}
        error={error}
      />
    </div>
  );
}
