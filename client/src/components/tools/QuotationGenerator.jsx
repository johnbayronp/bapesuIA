import React, { useState, useEffect, useMemo, useRef } from 'react';
import useToast from '../../hooks/useToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../../lib/supabase';

const STORAGE_KEY    = 'bapesu-cotizacion';
const SESSION_KEY    = 'cotizacion-unlocked';
const ACCESS_KEY     = 'bapesu2026'; // ← cambia esta clave cuando quieras

const DEFAULT_COMPANY = {
  name: 'BAPESU',
  tagline: 'PUBLICIDAD & MARKETING',
  nit: '',
  phone: '318 482 68 45',
  email: 'Bapesutechco@gmail.com',
  instagram: '@bapesutech',
  website: 'www.bapesu.com',
  paymentInfo: 'Cualquier metodo de pago\n· Se aceptan pagos con TC, Debito, Nequi,\nDaviplata, PSE.',
  logoUrl: '',
};

const DEFAULT_QUOTE = {
  number: '001',
  issueDate: new Date().toISOString().slice(0, 10),
  validDays: 4,
  clientName: '',
  projectType: '',
  objective: '',
  signatureName: 'JHON PEREZ',
  terms: '',
  currency: 'COP',
};

const DEFAULT_ITEM = () => ({ description: '', price: '' });

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);

const INPUT_CLS =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500 transition';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

export default function QuotationGenerator() {
  const { showSuccess, showError } = useToast();

  // ── Access lock ──
  const [isLocked, setIsLocked]         = useState(() => sessionStorage.getItem(SESSION_KEY) !== '1');
  const [keyInput, setKeyInput]         = useState('');
  const [keyError, setKeyError]         = useState(false);
  const [reqEmail, setReqEmail]         = useState('');
  const [reqLoading, setReqLoading]     = useState('idle'); // 'idle' | 'loading' | 'done'

  const handleUnlock = () => {
    if (keyInput.trim() === ACCESS_KEY) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setIsLocked(false);
      setKeyError(false);
    } else {
      setKeyError(true);
    }
  };

  const handleRequestAccess = async () => {
    const email = reqEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Ingresa un correo válido');
      return;
    }
    setReqLoading('loading');
    try {
      await supabase.from('cotizacion_access_requests').insert({ email, requested_at: new Date().toISOString() });
    } catch { /* tabla puede no existir aún, ignorar */ }
    setReqLoading('done');
  };

  // ── Tool data ──
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [quote, setQuote] = useState(DEFAULT_QUOTE);
  const [items, setItems] = useState([DEFAULT_ITEM()]);
  const logoInputRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.company) setCompany((p) => ({ ...p, ...data.company }));
      if (data.quote)   setQuote((p)   => ({ ...p, ...data.quote }));
    } catch { /* ignore */ }
  }, []);

  // Si el usuario tiene sesión + empresa, precargar sus datos (multi-tenant)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data: profile } = await supabase
          .from('users').select('company_id').eq('id', user.id).maybeSingle();
        if (!profile?.company_id || cancelled) return;

        const { data: comp } = await supabase
          .from('bapesu_companies').select('*').eq('id', profile.company_id).maybeSingle();
        if (!comp || cancelled) return;

        // Solo sobrescribimos si los campos están vacíos en localStorage / defaults
        setCompany((p) => ({
          ...p,
          name:        comp.name      || p.name,
          tagline:     comp.tagline   || p.tagline,
          nit:         comp.nit       || p.nit,
          phone:       comp.phone     || p.phone,
          email:       comp.email     || p.email,
          instagram:   comp.instagram || p.instagram,
          website:     comp.website   || p.website,
          paymentInfo: comp.payment_info || p.paymentInfo,
          logoUrl:     comp.logo_url  || p.logoUrl,
        }));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ company, quote }));
    } catch { /* ignore */ }
  }, [company, quote]);

  const setQ = (key, val) => setQuote((p) => ({ ...p, [key]: val }));
  const setCo = (key, val) => setCompany((p) => ({ ...p, [key]: val }));

  const [includeIva, setIncludeIva] = useState(false);
  const [ivaRate, setIvaRate]       = useState(19);

  const updateItem = (i, key, val) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));
  const addItem    = () => setItems((p) => [...p, DEFAULT_ITEM()]);
  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + (Number(String(it.price).replace(/[^0-9.-]/g, '')) || 0), 0),
    [items]
  );
  const ivaAmount = includeIva ? Math.round(subtotal * (ivaRate / 100)) : 0;
  const total     = subtotal + ivaAmount;

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCo('logoUrl', reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const issueDateFormatted = useMemo(() => {
    if (!quote.issueDate) return '';
    const [y, m, d] = quote.issueDate.split('-');
    return `${d} / ${m} / ${y}`;
  }, [quote.issueDate]);

  const validUntil = useMemo(() => {
    if (!quote.issueDate) return '';
    const d = new Date(quote.issueDate + 'T00:00:00');
    d.setDate(d.getDate() + Number(quote.validDays || 0));
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [quote.issueDate, quote.validDays]);

  const handlePrint = () => {
    if (!quote.clientName.trim()) {
      showError('Agrega el nombre del cliente antes de generar el PDF');
      return;
    }
    if (items.every((it) => !it.description.trim())) {
      showError('Agrega al menos un servicio en la tabla');
      return;
    }
    const originalTitle = document.title;
    const safe = (quote.clientName || 'Cliente').replace(/[\\/:*?"<>|]/g, '').trim();
    document.title = `Cotización ${quote.number} - ${safe}`;
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
    setTimeout(restore, 1500);
    showSuccess('Abriendo diálogo de impresión — elige "Guardar como PDF"');
  };

  const resetAll = () => {
    if (!window.confirm('¿Reiniciar todos los datos de la cotización?')) return;
    setCompany(DEFAULT_COMPANY);
    setQuote(DEFAULT_QUOTE);
    setItems([DEFAULT_ITEM()]);
    localStorage.removeItem(STORAGE_KEY);
    showSuccess('Datos reiniciados');
  };

  return (
    <div id="cotizacion-outer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <style>{`
        @media print {
          /* Ocultar TODO el contenido de la página */
          body * { visibility: hidden !important; }

          /* Mostrar SOLO el bloque de la cotización */
          #cotizacion-print,
          #cotizacion-print * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Posicionar el bloque para llenar toda la hoja */
          #cotizacion-print {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            overflow: visible !important;
            background: white !important;
          }

          @page { size: A4; margin: 0mm; }
        }
      `}</style>

      {/* ── ACCESS LOCK MODAL ── */}
      {isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blur backdrop */}
          <div className="absolute inset-0 backdrop-blur-md bg-gray-900/60" />

          {/* Modal card */}
          <div className="relative w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">

            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-yellow-400 to-amber-500" />

            <div className="p-6">
              {/* Icon + title */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 dark:bg-yellow-400/15 flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Acceso restringido</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Esta herramienta requiere una clave de acceso.
                </p>
              </div>

              {/* Password field */}
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => { setKeyInput(e.target.value); setKeyError(false); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    placeholder="Ingresa la clave de acceso"
                    className={`w-full px-4 py-3 pr-12 rounded-xl text-sm border bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                      keyError
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-gray-200 dark:border-white/10 focus:ring-yellow-400'
                    }`}
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>

                {keyError && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Clave incorrecta. Intenta de nuevo.
                  </p>
                )}

                <button
                  onClick={handleUnlock}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-bold text-sm transition-all duration-200 shadow-[0_4px_16px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Desbloquear
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                <span className="text-[11px] text-gray-400 font-medium">¿No tienes acceso?</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
              </div>

              {/* Request access */}
              {reqLoading === 'done' ? (
                <div className="flex flex-col items-center gap-2 py-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">¡Solicitud enviada!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Te enviaremos la clave de acceso a <span className="font-medium text-gray-700 dark:text-gray-300">{reqEmail}</span> a la brevedad.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                    Escribe tu correo y solicita acceso. Te enviaremos la clave.
                  </p>
                  <input
                    type="email"
                    value={reqEmail}
                    onChange={(e) => setReqEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRequestAccess()}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  />
                  <button
                    onClick={handleRequestAccess}
                    disabled={reqLoading === 'loading'}
                    className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-700 dark:text-gray-300 font-semibold text-sm border border-gray-200 dark:border-white/10 transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {reqLoading === 'loading' ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    Solicitar acceso
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className={`mb-8 flex items-center gap-3 no-print transition-all duration-300 ${isLocked ? 'blur-sm select-none pointer-events-none' : ''}`}>
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 dark:bg-yellow-500/15 text-yellow-500 dark:text-yellow-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Cotización Rápida</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Genera cotizaciones profesionales en PDF con vista previa en tiempo real</p>
        </div>
      </div>

      <div id="cotizacion-grid" className={`grid grid-cols-1 xl:grid-cols-2 gap-6 transition-all duration-300 ${isLocked ? 'blur-sm select-none pointer-events-none' : ''}`}>

        {/* ── FORM ── */}
        <div className="space-y-5 no-print">

          {/* Empresa */}
          <section className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">1 · Tu empresa</h2>
              <span className="text-[10px] font-medium text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">Se guarda</span>
            </div>

            {/* Logo upload */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-20 h-14 shrink-0 rounded-xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt="logo" className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 10h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button onClick={() => logoInputRef.current?.click()}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-yellow-400 text-gray-700 dark:text-gray-300">
                  {company.logoUrl ? 'Cambiar logo' : 'Subir logo (opcional)'}
                </button>
                {company.logoUrl && (
                  <button onClick={() => setCo('logoUrl', '')} className="text-xs text-red-500 hover:text-red-600 font-medium text-left">
                    Quitar logo
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre de empresa">
                <input className={INPUT_CLS} value={company.name} onChange={(e) => setCo('name', e.target.value)} placeholder="BAPESU" />
              </Field>
              <Field label="Slogan / sector">
                <input className={INPUT_CLS} value={company.tagline} onChange={(e) => setCo('tagline', e.target.value)} placeholder="PUBLICIDAD & MARKETING" />
              </Field>
              <Field label="Teléfono">
                <input className={INPUT_CLS} value={company.phone} onChange={(e) => setCo('phone', e.target.value)} placeholder="318 482 68 45" />
              </Field>
              <Field label="Email">
                <input className={INPUT_CLS} value={company.email} onChange={(e) => setCo('email', e.target.value)} placeholder="correo@empresa.com" />
              </Field>
              <Field label="Instagram / red social">
                <input className={INPUT_CLS} value={company.instagram} onChange={(e) => setCo('instagram', e.target.value)} placeholder="@usuario" />
              </Field>
              <Field label="Sitio web">
                <input className={INPUT_CLS} value={company.website} onChange={(e) => setCo('website', e.target.value)} placeholder="www.empresa.com" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Información de pago (pie de página)">
                  <textarea rows={3} className={INPUT_CLS} value={company.paymentInfo}
                    onChange={(e) => setCo('paymentInfo', e.target.value)}
                    placeholder="Cualquier metodo de pago&#10;· TC, Débito, Nequi, Daviplata, PSE" />
                </Field>
              </div>
            </div>
          </section>

          {/* Cotización */}
          <section className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">2 · Datos de la cotización</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="N° de cotización">
                <input className={INPUT_CLS} value={quote.number} onChange={(e) => setQ('number', e.target.value)} placeholder="001" />
              </Field>
              <Field label="Fecha">
                <input type="date" className={INPUT_CLS} value={quote.issueDate} onChange={(e) => setQ('issueDate', e.target.value)} />
              </Field>
              <Field label="Cliente">
                <input className={INPUT_CLS} value={quote.clientName} onChange={(e) => setQ('clientName', e.target.value)} placeholder="Grupo ambiental Casanare" />
              </Field>
              <Field label="NIT / CC del cliente">
                <input className={INPUT_CLS} value={quote.clientNit || ''} onChange={(e) => setQ('clientNit', e.target.value)} placeholder="900.123.456-7" />
              </Field>
              <Field label="Tipo de proyecto / asunto">
                <input className={INPUT_CLS} value={quote.projectType} onChange={(e) => setQ('projectType', e.target.value)} placeholder="Avisos informativos HSEQ" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Objetivo del proyecto (opcional)">
                  <input className={INPUT_CLS} value={quote.objective} onChange={(e) => setQ('objective', e.target.value)} placeholder="Describe brevemente el objetivo..." />
                </Field>
              </div>
            </div>
          </section>

          {/* Ítems */}
          <section className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">3 · Servicios / Productos</h2>
              <button onClick={addItem} className="text-xs font-semibold text-yellow-500 hover:text-yellow-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Agregar ítem
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-12 sm:col-span-8">
                    <textarea rows={2} className={INPUT_CLS + ' resize-none'} value={it.description}
                      onChange={(e) => updateItem(i, 'description', e.target.value)}
                      placeholder="Descripción del servicio o producto..." />
                  </div>
                  <div className="col-span-10 sm:col-span-3">
                    <input type="number" min="0" step="1000" className={INPUT_CLS} value={it.price}
                      onChange={(e) => updateItem(i, 'price', e.target.value)} placeholder="Precio" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex items-center justify-end pt-1">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)}
                        className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* IVA toggle */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setIncludeIva(!includeIva)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    includeIva ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-white/10'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    includeIva ? 'translate-x-4' : ''
                  }`} />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">Aplicar IVA</span>
                {includeIva && (
                  <div className="flex items-center gap-1 ml-1">
                    <input
                      type="number" min="0" max="100" value={ivaRate}
                      onChange={(e) => setIvaRate(Number(e.target.value))}
                      className="w-14 px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                )}
              </label>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCOP(subtotal)}</span>
                </div>
                {includeIva && (
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>IVA ({ivaRate}%)</span>
                    <span>{formatCOP(ivaAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-gray-900 dark:text-white text-base pt-2 border-t border-gray-200 dark:border-white/10">
                  <span>TOTAL</span>
                  <span>{formatCOP(total)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Términos y firma */}
          <section className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">4 · Términos y firma</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Válida por (días)">
                <input type="number" min="1" className={INPUT_CLS} value={quote.validDays}
                  onChange={(e) => setQ('validDays', e.target.value)} placeholder="4" />
              </Field>
              <Field label="Nombre en la firma">
                <input className={INPUT_CLS} value={quote.signatureName}
                  onChange={(e) => setQ('signatureName', e.target.value)} placeholder="JHON PEREZ" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Términos y condiciones (opcional)">
                  <textarea rows={2} className={INPUT_CLS} value={quote.terms}
                    onChange={(e) => setQ('terms', e.target.value)}
                    placeholder="Ej: válido hasta el 12 de mayo de 2026, después de esta fecha puede estar sujeto a cambios." />
                </Field>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handlePrint}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition-all duration-200 shadow-[0_4px_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Descargar PDF
            </button>
            <button onClick={resetAll}
              className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-all duration-200">
              Reiniciar
            </button>
          </div>
        </div>

        {/* ── PREVIEW ── */}
        <div id="cotizacion-preview-col" className="xl:sticky xl:top-4 xl:self-start">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 no-print">Vista previa</div>

          <div id="cotizacion-print" className="text-gray-900 shadow-sm text-[12px] leading-relaxed overflow-hidden" style={{ fontFamily: 'Arial, sans-serif', minHeight: '297mm', backgroundColor: 'white' }}>

            {/* ── Top dark header ── */}
            <div style={{ backgroundColor: '#0f1923', color: 'white', padding: '20px 28px 14px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              {/* Tagline */}
              <div style={{ textAlign: 'center', fontSize: '10px', letterSpacing: '3px', color: '#aaaaaa', marginBottom: '14px', textTransform: 'uppercase' }}>
                {company.tagline || 'PUBLICIDAD & MARKETING'}
              </div>

              {/* Logo + COTIZACIÓN badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Logo / Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt="logo" style={{ height: '50px', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', color: 'white' }}>
                      {company.name || 'EMPRESA'}
                      <span style={{ color: '#c8f400' }}>.</span>
                    </span>
                  )}
                </div>

                {/* Badge + date */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ border: '2px solid #c8f400', color: '#c8f400', padding: '4px 14px', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', display: 'inline-block' }}>
                    COTIZACIÓN
                  </div>
                  <div style={{ color: '#cccccc', fontSize: '10px', marginTop: '8px', letterSpacing: '2px' }}>
                    FECHA: {issueDateFormatted || '— / — / ——'}
                  </div>
                </div>
              </div>
            </div>

            {/* ── White body ── */}
            <div style={{ backgroundColor: 'white', padding: '20px 28px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>

              {/* Client + Project row */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div style={{ border: '1px solid #cccccc', padding: '5px 10px', fontSize: '11px', flex: 1 }}>
                  <span style={{ color: '#666666' }}>Cliente: </span>
                  <span style={{ fontWeight: '600' }}>{quote.clientName || 'Nombre del cliente'}</span>
                  {quote.clientNit && (
                    <span style={{ color: '#888888', marginLeft: '6px', fontSize: '10px' }}>NIT: {quote.clientNit}</span>
                  )}
                </div>
                {quote.projectType && (
                  <div style={{ border: '1px solid #cccccc', padding: '5px 10px', fontSize: '11px', flex: 1 }}>
                    <span style={{ fontWeight: '600' }}>{quote.projectType}</span>
                  </div>
                )}
              </div>

              {/* Objective */}
              <div style={{ border: '1px solid #dddddd', padding: '5px 10px', fontSize: '11px', marginBottom: '14px', color: quote.objective ? '#111111' : '#bbbbbb' }}>
                {quote.objective ? (
                  <><span style={{ color: '#666666' }}>Objetivo del proyecto: </span><span>{quote.objective}</span></>
                ) : 'Objetivo del proyecto:'}
              </div>

              {/* Services table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700', backgroundColor: '#1a5fc8', color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      DESCRIPCIÓN DEL SERVICIO
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700', width: '120px', backgroundColor: '#0f1923', color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      PRECIO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...items, ...Array(Math.max(0, 3 - items.length)).fill({ description: '', price: '' })].map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #dddddd' }}>
                      <td style={{ padding: '14px 12px', fontSize: '11px', verticalAlign: 'top', height: '52px' }}>
                        {it.description ? (
                          <div style={{ whiteSpace: 'pre-wrap' }}>{it.description}</div>
                        ) : (
                          <div />
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: '600', verticalAlign: 'top' }}>
                        {it.price && Number(it.price) > 0 ? (
                          <div style={{ border: '1px solid #cccccc', padding: '2px 8px', display: 'inline-block', fontSize: '11px' }}>
                            {formatCOP(Number(it.price))}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}

                  {/* Subtotal row (only if IVA active) */}
                  {includeIva && (
                    <tr style={{ borderTop: '1px solid #dddddd' }}>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: '#555555' }}>
                        Subtotal
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: '#555555' }}>
                        {formatCOP(subtotal)}
                      </td>
                    </tr>
                  )}

                  {/* IVA row */}
                  {includeIva && (
                    <tr>
                      <td style={{ padding: '4px 12px', textAlign: 'right', fontSize: '11px', color: '#555555' }}>
                        IVA ({ivaRate}%)
                      </td>
                      <td style={{ padding: '4px 12px', textAlign: 'right', fontSize: '11px', color: '#555555' }}>
                        {formatCOP(ivaAmount)}
                      </td>
                    </tr>
                  )}

                  {/* Total row */}
                  <tr style={{ borderTop: '2px solid #333333' }}>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', fontSize: '12px' }}>
                      TOTAL
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ border: '1px solid #cccccc', padding: '2px 8px', display: 'inline-block', fontWeight: '700', fontSize: '12px' }}>
                        {formatCOP(total)}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Terms + Signature */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ border: '1px solid #ccc', padding: '4px 8px', fontSize: '10px', fontWeight: '600', marginBottom: '6px', display: 'inline-block' }}>
                    TÉRMINOS Y CONDICIONES
                  </div>
                  <div style={{ border: '1px solid #ddd', padding: '6px 10px', fontSize: '10px', color: '#555', minHeight: '36px' }}>
                    {quote.terms ||
                      (validUntil ? `Válido hasta el ${validUntil}, después de esta fecha puede estar sujeto a cambios.` : 'Agrega tus términos y condiciones...')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', paddingTop: '28px' }}>
                  <div style={{ border: '1px solid #ccc', padding: '4px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '1px' }}>
                    ATTE. {quote.signatureName ? quote.signatureName.toUpperCase() : 'NOMBRE'}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Dark footer ── */}
            <div style={{ backgroundColor: '#0f1923', color: 'white', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              {/* Payment info */}
              <div style={{ flex: 1 }}>
                <div style={{ border: '1px solid #555555', padding: '6px 14px', fontSize: '10px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '10px', color: 'white' }}>
                  INFORMACIÓN DE PAGO
                </div>
                <div style={{ fontSize: '10px', color: '#bbbbbb', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {company.paymentInfo}
                </div>
              </div>

              {/* Contact */}
              <div style={{ minWidth: '160px' }}>
                <div style={{ border: '1px solid #555555', padding: '4px 12px', fontSize: '10px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '10px', color: 'white' }}>
                  CONTACTO
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '10px', color: '#cccccc' }}>
                  {company.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>&#128222;</span>
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>&#9993;</span>
                      <span>{company.email}</span>
                    </div>
                  )}
                  {company.instagram && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>&#128077;</span>
                      <span>{company.instagram}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Website bar */}
            <div style={{ backgroundColor: '#0a1118', color: '#aaaaaa', textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '2px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              {company.website || 'www.empresa.com'}
            </div>
          </div>
        </div>

      </div>
      <ToastContainer />
    </div>
  );
}
