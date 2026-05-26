import { INPUT, LABEL } from '../constants';

export default function SupplierModal({ modal, form, setF, saving, onSave, onClose }) {
  if (!modal) return null;
  const isEdit = modal.mode === 'edit';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Editar' : 'Nuevo'} proveedor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={LABEL}>Nombre <span className="text-red-400">*</span></label>
              <input className={INPUT} placeholder="Nombre del proveedor" value={form.name} onChange={(e) => setF('name', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>NIT / Cédula</label>
              <input className={INPUT} placeholder="900.123.456-7" value={form.nit} onChange={(e) => setF('nit', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Contacto</label>
              <input className={INPUT} placeholder="Nombre de contacto" value={form.contact} onChange={(e) => setF('contact', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Email</label>
              <input type="email" className={INPUT} placeholder="proveedor@email.com" value={form.email} onChange={(e) => setF('email', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Teléfono</label>
              <input className={INPUT} placeholder="310 000 0000" value={form.phone} onChange={(e) => setF('phone', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Dirección</label>
              <input className={INPUT} placeholder="Calle 10 # 20-30, Bogotá" value={form.address} onChange={(e) => setF('address', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Notas</label>
              <input className={INPUT} placeholder="Observaciones..." value={form.notes} onChange={(e) => setF('notes', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.name.trim()} className="px-5 py-2 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-60">
            {saving ? 'Guardando…' : isEdit ? 'Actualizar' : 'Crear proveedor'}
          </button>
        </div>
      </div>
    </div>
  );
}
