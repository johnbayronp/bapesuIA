import { useState } from 'react';
import { db } from '../../api/db';
import { useCompany } from '../../context/CompanyContext';

const INPUT = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400 transition';
const LABEL = 'block text-xs font-medium text-gray-600 mb-1';

export default function CompanyOnboarding() {
  const { user, refresh } = useCompany();
  const [form, setForm] = useState({
    name: '',
    nit: '',
    tagline: '',
    phone: '',
    email: user?.email ?? '',
    city: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    setError('');
    if (!form.name.trim()) { setError('El nombre de la empresa es obligatorio'); return; }
    if (!user)             { setError('Sesión inválida, recarga la página'); return; }

    setSaving(true);
    try {
      const { data: company, error: insertErr } = await db
        .from('bapesu_companies')
        .insert({
          name:      form.name.trim(),
          nit:       form.nit.trim() || null,
          tagline:   form.tagline.trim() || null,
          phone:     form.phone.trim() || null,
          email:     form.email.trim() || null,
          city:      form.city.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Vincular el usuario a la empresa recién creada como admin
      await db
        .from('users')
        .update({
          company_id: company.id,
          role: 'admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      await refresh();
    } catch (e) {
      console.error(e);
      setError(e.message ?? 'No se pudo crear la empresa');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-lg">

        {/* Glow background */}
        <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400" />

          <div className="p-7">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-100 mb-4">
                <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">¡Bienvenido!</h1>
              <p className="text-sm text-gray-500 mt-2">
                Para empezar, crea el espacio de tu empresa.
                <br />
                Podrás invitar a tu equipo después.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Nombre de la empresa *</label>
                <input className={INPUT} value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="Mi Empresa S.A.S." autoFocus />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>NIT</label>
                  <input className={INPUT} value={form.nit} onChange={(e) => setF('nit', e.target.value)} placeholder="900.123.456-7" />
                </div>
                <div>
                  <label className={LABEL}>Slogan / sector</label>
                  <input className={INPUT} value={form.tagline} onChange={(e) => setF('tagline', e.target.value)} placeholder="Publicidad & Marketing" />
                </div>
                <div>
                  <label className={LABEL}>Teléfono</label>
                  <input className={INPUT} value={form.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="318 482 68 45" />
                </div>
                <div>
                  <label className={LABEL}>Ciudad</label>
                  <input className={INPUT} value={form.city} onChange={(e) => setF('city', e.target.value)} placeholder="Bogotá" />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL}>Email de contacto</label>
                  <input type="email" className={INPUT} value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="contacto@empresa.com" />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}

              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-bold text-sm transition-all duration-200 shadow-[0_4px_16px_rgba(245,158,11,0.35)] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creando empresa...
                  </>
                ) : (
                  <>
                    Crear empresa
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-[11px] text-gray-400 text-center mt-3">
                Podrás editar todos estos datos más tarde en <span className="font-semibold text-gray-500">Empresa</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
