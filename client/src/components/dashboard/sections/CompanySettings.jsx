import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { uploadToS3 } from '../../../lib/s3Upload';
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
  const [saving, setSaving]       = useState(false);
  const [savedAt, setSavedAt]     = useState(null);
  const [error, setError]         = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [dragOver, setDragOver]   = useState(false);
  const fileInputRef              = useRef(null);

  useEffect(() => {
    if (company) {
      setForm({ ...EMPTY, ...company });
    }
  }, [company]);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleLogoUpload = async (file) => {
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setUploadErr('Formato no válido. Usa PNG, JPG, WEBP o SVG.'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr('El archivo no puede superar 5 MB.'); return;
    }
    setUploading(true); setUploadErr('');
    try {
      const url = await uploadToS3(file, company?.id ?? 'logo');
      setF('logo_url', url);
    } catch (e) {
      setUploadErr(e.message ?? 'Error al subir la imagen');
    }
    setUploading(false);
  };

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
            <label className={LABEL}>Logo de la empresa</label>

            {/* Drop zone */}
            <div
              onClick={() => isAdmin && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); if (isAdmin) setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                if (isAdmin) handleLogoUpload(e.dataTransfer.files[0]);
              }}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 px-4 transition cursor-pointer
                ${dragOver ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50 hover:border-yellow-300 hover:bg-yellow-50/50'}
                ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {uploading ? (
                <>
                  <svg className="w-6 h-6 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-xs text-yellow-600 font-medium">Subiendo a S3...</p>
                </>
              ) : form.logo_url ? (
                <div className="flex items-center gap-4">
                  <img
                    src={form.logo_url}
                    alt="logo"
                    className="h-16 w-16 rounded-xl border border-gray-200 bg-white object-contain p-1 shadow-sm"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-700">Logo cargado</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Haz clic o arrastra para reemplazar</p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setF('logo_url', ''); }}
                        className="mt-1.5 text-[11px] text-red-500 hover:text-red-700 font-medium"
                      >
                        Quitar logo
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-700">Arrastra tu logo aquí</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">o haz clic para seleccionar · PNG, JPG, WEBP, SVG · máx. 5 MB</p>
                  </div>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                disabled={!isAdmin}
                onChange={(e) => handleLogoUpload(e.target.files[0])}
              />
            </div>

            {uploadErr && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {uploadErr}
              </p>
            )}

            {/* URL manual como respaldo */}
            <details className="mt-2">
              <summary className="text-[11px] text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                O pega una URL manualmente
              </summary>
              <input
                className={INPUT + ' mt-1.5 text-xs'}
                value={form.logo_url}
                onChange={(e) => setF('logo_url', e.target.value)}
                disabled={!isAdmin}
                placeholder="https://..."
              />
            </details>
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
