import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../context/CompanyContext';

const INPUT = 'w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400 transition';
const LABEL = 'block text-xs font-medium text-gray-600 mb-1.5';

const EMPTY = {
  name: '', nit: '', tagline: '',
  phone: '', email: '', instagram: '', website: '',
  address: '', city: '',
  logo_url: '', payment_info: '',
};

export default function CompanySettings() {
  const { company, profile, refresh } = useCompany();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (company) {
      setForm({ ...EMPTY, ...company });
    }
  }, [company]);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!company?.id) return;
    setSaving(true); setError('');

    try {
      const { error: e } = await supabase
        .from('bapesu_companies')
        .update({
          name:         form.name?.trim() || company.name,
          nit:          form.nit?.trim() || null,
          tagline:      form.tagline?.trim() || null,
          phone:        form.phone?.trim() || null,
          email:        form.email?.trim() || null,
          instagram:    form.instagram?.trim() || null,
          website:      form.website?.trim() || null,
          address:      form.address?.trim() || null,
          city:         form.city?.trim() || null,
          logo_url:     form.logo_url?.trim() || null,
          payment_info: form.payment_info?.trim() || null,
        })
        .eq('id', company.id);

      if (e) throw e;

      setSavedAt(new Date());
      await refresh();
    } catch (err) {
      console.error(err);
      setError(err.message ?? 'Error al guardar');
    }
    setSaving(false);
  };

  if (!company) {
    return (
      <div className="text-center text-gray-500 py-20">
        Cargando empresa...
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Tu empresa</h1>
          <p className="text-sm text-gray-500 mt-1">
            Esta información se usa en cotizaciones, cuentas de cobro y todo el dashboard.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
              </svg>
              Guardado
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isAdmin}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition shadow-[0_4px_14px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title={!isAdmin ? 'Solo el admin puede editar' : ''}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          Solo los administradores pueden modificar los datos de la empresa.
        </div>
      )}

      {/* Card: identidad */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5 shadow-sm">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-gray-900 font-extrabold text-xl flex-shrink-0">
            {(form.name?.[0] ?? company.name?.[0] ?? 'E').toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Identidad</h2>
            <p className="text-xs text-gray-500">Cómo se ve tu empresa para los clientes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={LABEL}>Nombre comercial *</label>
            <input className={INPUT} value={form.name} onChange={(e) => setF('name', e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label className={LABEL}>NIT / Identificación</label>
            <input className={INPUT} value={form.nit} onChange={(e) => setF('nit', e.target.value)} disabled={!isAdmin} placeholder="900.123.456-7" />
          </div>
          <div>
            <label className={LABEL}>Slogan / sector</label>
            <input className={INPUT} value={form.tagline} onChange={(e) => setF('tagline', e.target.value)} disabled={!isAdmin} placeholder="Publicidad & Marketing" />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>URL del logo</label>
            <input className={INPUT} value={form.logo_url} onChange={(e) => setF('logo_url', e.target.value)} disabled={!isAdmin} placeholder="https://..." />
            {form.logo_url && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span>Vista previa:</span>
                <img src={form.logo_url} alt="logo" className="h-8 rounded border border-gray-200 bg-white object-contain px-1" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card: contacto */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Contacto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Teléfono</label>
            <input className={INPUT} value={form.phone} onChange={(e) => setF('phone', e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label className={LABEL}>Email</label>
            <input type="email" className={INPUT} value={form.email} onChange={(e) => setF('email', e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label className={LABEL}>Instagram</label>
            <input className={INPUT} value={form.instagram} onChange={(e) => setF('instagram', e.target.value)} disabled={!isAdmin} placeholder="@miempresa" />
          </div>
          <div>
            <label className={LABEL}>Sitio web</label>
            <input className={INPUT} value={form.website} onChange={(e) => setF('website', e.target.value)} disabled={!isAdmin} placeholder="miempresa.com" />
          </div>
          <div>
            <label className={LABEL}>Ciudad</label>
            <input className={INPUT} value={form.city} onChange={(e) => setF('city', e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label className={LABEL}>Dirección</label>
            <input className={INPUT} value={form.address} onChange={(e) => setF('address', e.target.value)} disabled={!isAdmin} />
          </div>
        </div>
      </div>

      {/* Card: pago */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Datos de pago</h2>
        <p className="text-xs text-gray-500 mb-4">Aparece en el pie de las cuentas de cobro y cotizaciones.</p>
        <textarea
          rows={3}
          className={INPUT + ' resize-none'}
          value={form.payment_info}
          onChange={(e) => setF('payment_info', e.target.value)}
          disabled={!isAdmin}
          placeholder="Bancolombia • Ahorros • 123-456-789-00"
        />
      </div>

      {/* Plan */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Plan actual</h2>
            <p className="text-xs text-gray-500 mt-0.5">Suscripción y límites de uso</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 capitalize">
            {company.plan ?? 'free'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
