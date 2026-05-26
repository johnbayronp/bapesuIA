import { INPUT, LABEL } from '../constants';

export default function WarehouseModal({ modal, form, setF, saving, onSave, onClose }) {
  if (!modal) return null;
  const isEdit = modal.mode === 'edit';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Editar' : 'Nueva'} bodega</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={LABEL}>Nombre <span className="text-red-400">*</span></label>
            <input className={INPUT} placeholder="Ej: Bodega principal, Sede norte…" value={form.name} onChange={(e) => setF('name', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Dirección</label>
            <input className={INPUT} placeholder="Calle 10 # 20-30, Bogotá" value={form.address} onChange={(e) => setF('address', e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Descripción</label>
            <input className={INPUT} placeholder="Descripción opcional…" value={form.description} onChange={(e) => setF('description', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.name.trim()} className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-60">
            {saving ? 'Guardando…' : isEdit ? 'Actualizar' : 'Crear bodega'}
          </button>
        </div>
      </div>
    </div>
  );
}
