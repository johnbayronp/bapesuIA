import React, { useState, useEffect, useMemo, useRef } from 'react';
import useToast from '../../hooks/useToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const STORAGE_KEY = 'bapesu-cuenta-cobro';

const DEFAULT_ISSUER = {
  name: '', nit: '', address: '', phone: '', email: '', logoUrl: '',
};
const DEFAULT_CLIENT = {
  name: '', nit: '', address: '', phone: '', email: '',
};
const DEFAULT_PAYMENT = {
  bank: '', accountType: 'Ahorros', accountNumber: '', accountHolder: '',
  notes: '',
};

const CURRENCY_META = {
  COP: { code: 'COP', locale: 'es-CO', decimals: 0, symbol: '$' },
  USD: { code: 'USD', locale: 'en-US', decimals: 2, symbol: 'US$' },
};

const formatMoney = (n, currency = 'COP') => {
  const meta = CURRENCY_META[currency] || CURRENCY_META.COP;
  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: meta.code,
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(n || 0);
};

const roundForCurrency = (n, currency = 'COP') =>
  currency === 'USD' ? Math.round((n || 0) * 100) / 100 : Math.round(n || 0);

// ─── Number to words: Spanish ───
const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function seccionMenor1000(n) {
  if (n === 0) return '';
  if (n <= 20) return UNIDADES[n];
  if (n < 30) return `veinti${UNIDADES[n - 20]}`;
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${UNIDADES[u]}`;
  }
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const r = n % 100;
  return r === 0 ? CENTENAS[c] : `${CENTENAS[c]} ${seccionMenor1000(r)}`;
}

function convertirGrupo(n) {
  if (n < 1000) return seccionMenor1000(n);
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  const prefijo = miles === 1 ? 'mil' : `${seccionMenor1000(miles)} mil`;
  return resto > 0 ? `${prefijo} ${seccionMenor1000(resto)}` : prefijo;
}

function aplicarApocope(texto) {
  return texto
    .replace(/\bveintiuno\b(?=\s+(mil|millones|millón|billones|billón|pesos|dólares))/g, 'veintiún')
    .replace(/\buno\b(?=\s+(mil|millones|millón|billones|billón|pesos|dólares))/g, 'un')
    .replace(/\s+/g, ' ')
    .trim();
}

function numeroALetrasES(num, currency = 'COP') {
  const entero = Math.floor(Math.abs(num || 0));
  const centavos = Math.round((Math.abs(num || 0) - entero) * 100);
  const sufijo = currency === 'USD' ? 'dólares' : 'pesos';

  const construir = (n) => {
    if (n === 0) return 'cero';
    const billones  = Math.floor(n / 1_000_000_000_000);
    const restoBill = n % 1_000_000_000_000;
    const millones  = Math.floor(restoBill / 1_000_000);
    const restoMill = restoBill % 1_000_000;
    const miles     = Math.floor(restoMill / 1000);
    const resto     = restoMill % 1000;

    const partes = [];
    if (billones > 0) partes.push(billones === 1 ? 'un billón' : `${convertirGrupo(billones)} billones`);
    if (millones > 0) partes.push(millones === 1 ? 'un millón' : `${convertirGrupo(millones)} millones`);
    if (miles > 0)    partes.push(miles === 1 ? 'mil' : `${convertirGrupo(miles)} mil`);
    if (resto > 0)    partes.push(seccionMenor1000(resto));
    return partes.join(' ');
  };

  let texto = `${construir(entero)} ${sufijo}`;
  if (currency === 'USD' && centavos > 0) {
    texto += ` con ${centavos}/100`;
  } else {
    texto += ' m/cte';
  }
  return aplicarApocope(texto);
}

// ─── Number to words: English ───
const ENG_LESS20 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const ENG_TENS   = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function engUnder1000(n) {
  if (n < 20) return ENG_LESS20[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? ENG_TENS[t] : `${ENG_TENS[t]}-${ENG_LESS20[u]}`;
  }
  const h = Math.floor(n / 100);
  const r = n % 100;
  return r === 0 ? `${ENG_LESS20[h]} hundred` : `${ENG_LESS20[h]} hundred ${engUnder1000(r)}`;
}

function numeroALetrasEN(num, currency = 'COP') {
  const entero = Math.floor(Math.abs(num || 0));
  const centavos = Math.round((Math.abs(num || 0) - entero) * 100);

  const construir = (n) => {
    if (n === 0) return 'zero';
    const billion  = Math.floor(n / 1_000_000_000);
    const restB    = n % 1_000_000_000;
    const million  = Math.floor(restB / 1_000_000);
    const restM    = restB % 1_000_000;
    const thousand = Math.floor(restM / 1000);
    const rest     = restM % 1000;

    const parts = [];
    if (billion > 0)  parts.push(`${engUnder1000(billion)} billion`);
    if (million > 0)  parts.push(`${engUnder1000(million)} million`);
    if (thousand > 0) parts.push(`${engUnder1000(thousand)} thousand`);
    if (rest > 0)     parts.push(engUnder1000(rest));
    return parts.join(' ');
  };

  const word = construir(entero);
  const noun = currency === 'USD' ? 'U.S. dollars' : 'Colombian pesos';
  const cents = String(centavos).padStart(2, '0');
  return `${word} ${noun} and ${cents}/100`;
}

const numeroALetras = (num, currency, lang) =>
  lang === 'en' ? numeroALetrasEN(num, currency) : numeroALetrasES(num, currency);

// ─── Translations for the printed document ───
const T = {
  es: {
    docTitle:        'Cuenta de Cobro',
    number:          'N°',
    debe:            'Debe a',
    suma:            'La suma de',
    porParte:        'Por parte de:',
    concepto:        'Concepto:',
    periodo:         'Período:',
    desc:            'Descripción',
    qty:             'Cant.',
    price:           'Precio',
    total:           'Total',
    subtotal:        'Subtotal',
    iva:             'IVA',
    retefuente:      'Retefuente',
    totalUpper:      'TOTAL',
    paymentTitle:    'Datos de pago',
    paymentSentence: ({ accType, bank, accNumber, holder }) =>
      `Realizar el pago en la cuenta ${accType}${bank ? ` de ${bank}` : ''}${accNumber ? ` N° ${accNumber}` : ''}${holder ? ` a nombre de ${holder}` : ''}.`,
    signIssuer:      'Firma del emisor',
    receivedBy:      'Recibido por',
    accountTypes: {
      Ahorros: 'Ahorros', Corriente: 'Corriente', Nequi: 'Nequi', Daviplata: 'Daviplata', Otro: 'Otro',
    },
  },
  en: {
    docTitle:        'Invoice / Bill of Collection',
    number:          'No.',
    debe:            'Pay to',
    suma:            'Amount of',
    porParte:        'Billed to:',
    concepto:        'Concept:',
    periodo:         'Period:',
    desc:            'Description',
    qty:             'Qty',
    price:           'Unit Price',
    total:           'Total',
    subtotal:        'Subtotal',
    iva:             'VAT',
    retefuente:      'Withholding Tax',
    totalUpper:      'TOTAL',
    paymentTitle:    'Payment Information',
    paymentSentence: ({ accType, bank, accNumber, holder }) =>
      `Please make the payment to the ${accType} account${bank ? ` at ${bank}` : ''}${accNumber ? `, account number ${accNumber}` : ''}${holder ? `, in the name of ${holder}` : ''}.`,
    signIssuer:      'Issuer signature',
    receivedBy:      'Received by',
    accountTypes: {
      Ahorros: 'Savings', Corriente: 'Checking', Nequi: 'Nequi', Daviplata: 'Daviplata', Otro: 'Other',
    },
  },
};

const INPUT_CLS =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

export default function InvoiceGenerator() {
  const { showSuccess, showError } = useToast();

  const [issuer, setIssuer]           = useState(DEFAULT_ISSUER);
  const [client, setClient]           = useState(DEFAULT_CLIENT);
  const [payment, setPayment]         = useState(DEFAULT_PAYMENT);
  const [invoiceNumber, setInvoiceNumber] = useState('001');
  const [city, setCity]               = useState('');
  const [issueDate, setIssueDate]     = useState(() => new Date().toISOString().slice(0, 10));
  const [period, setPeriod]           = useState('');
  const [concept, setConcept]         = useState('');
  const [items, setItems]             = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes]             = useState('');
  const [signatureName, setSignatureName]   = useState('');
  const [signatureDoc, setSignatureDoc]     = useState('');
  const [includeIva, setIncludeIva]         = useState(false);
  const [ivaRate, setIvaRate]               = useState(19);
  const [includeRetefuente, setIncludeRetefuente] = useState(false);
  const [retefuenteRate, setRetefuenteRate]       = useState(11);
  const [currency, setCurrency]             = useState('COP');
  const [language, setLanguage]             = useState('es');

  const t = T[language] || T.es;
  const fmt = (n) => formatMoney(n, currency);

  const logoInputRef = useRef(null);

  // Load persisted issuer + payment
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.issuer)  setIssuer((p) => ({ ...p, ...data.issuer }));
      if (data.payment) setPayment((p) => ({ ...p, ...data.payment }));
      if (data.signatureName) setSignatureName(data.signatureName);
      if (data.signatureDoc)  setSignatureDoc(data.signatureDoc);
      if (data.city) setCity(data.city);
      if (data.currency === 'USD' || data.currency === 'COP') setCurrency(data.currency);
      if (data.language === 'en' || data.language === 'es')   setLanguage(data.language);
    } catch {
      // ignore
    }
  }, []);

  // Persist issuer + payment automatically
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ issuer, payment, signatureName, signatureDoc, city, currency, language })
      );
    } catch {
      // ignore
    }
  }, [issuer, payment, signatureName, signatureDoc, city, currency, language]);

  const subtotal = useMemo(
    () => roundForCurrency(
      items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0),
      currency
    ),
    [items, currency]
  );
  const ivaAmount        = includeIva ? roundForCurrency(subtotal * (ivaRate / 100), currency) : 0;
  const retefuenteAmount = includeRetefuente ? roundForCurrency(subtotal * (retefuenteRate / 100), currency) : 0;
  const total            = roundForCurrency(subtotal + ivaAmount - retefuenteAmount, currency);
  const totalEnLetras    = useMemo(() => numeroALetras(total, currency, language), [total, currency, language]);

  const updateItem = (i, key, value) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setIssuer((p) => ({ ...p, logoUrl: reader.result }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearLogo = () => setIssuer((p) => ({ ...p, logoUrl: '' }));

  const handlePrint = () => {
    if (!client.name.trim()) {
      showError('Agrega al menos el nombre del cliente');
      return;
    }
    if (items.every((it) => !it.description.trim())) {
      showError('Agrega al menos un servicio/producto');
      return;
    }

    const originalTitle = document.title;
    const safeClient = (client.name || (language === 'en' ? 'Client' : 'Cliente')).replace(/[\\/:*?"<>|]/g, '').trim();
    const safeNumber = (invoiceNumber || '').toString().trim() || 's-n';
    document.title = `${t.docTitle} ${safeNumber} - ${safeClient}`;

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
    if (!window.confirm('¿Borrar todos los datos guardados (emisor, pago, cliente, ítems)?')) return;
    setIssuer(DEFAULT_ISSUER);
    setClient(DEFAULT_CLIENT);
    setPayment(DEFAULT_PAYMENT);
    setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setInvoiceNumber('001');
    setConcept('');
    setNotes('');
    setPeriod('');
    setSignatureName('');
    setSignatureDoc('');
    localStorage.removeItem(STORAGE_KEY);
    showSuccess('Datos reiniciados');
  };

  const issueDateFormatted = useMemo(() => {
    if (!issueDate) return '';
    const d = new Date(issueDate + 'T00:00:00');
    const locale = language === 'en' ? 'en-US' : 'es-CO';
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  }, [issueDate, language]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #cuenta-cobro-print, #cuenta-cobro-print * { visibility: visible !important; }
          #cuenta-cobro-print {
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important;
            padding: 24px 32px !important;
            background: white !important;
            color: #111 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 flex items-center gap-3 no-print">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9 12h6m-6 4h6m-7 4h8a2 2 0 002-2V6a2 2 0 00-2-2h-8a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Cuenta de Cobro</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Genera tus cuentas de cobro en PDF con total en letras, IVA y retención opcionales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Form ── */}
        <div className="space-y-5 no-print">

          {/* Moneda e idioma */}
          <section className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Moneda e idioma del documento</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Moneda">
                <div className="grid grid-cols-2 gap-2">
                  {['COP', 'USD'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                        currency === c
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.4)]'
                          : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-emerald-400'
                      }`}
                    >
                      {c === 'COP' ? '🇨🇴 Pesos COP' : '🇺🇸 Dólares USD'}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Idioma del documento">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'es', label: '🇪🇸 Español' },
                    { id: 'en', label: '🇬🇧 English' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLanguage(opt.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                        language === opt.id
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-[0_2px_8px_rgba(99,102,241,0.4)]'
                          : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-indigo-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
              Solo cambia el formato y los textos del documento. Los valores que escribas se interpretan en la moneda elegida.
            </p>
          </section>

          {/* Emisor */}
          <section className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">1 · Emisor (quien cobra)</h2>
              <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Se guarda</span>
            </div>

            <div className="flex items-start gap-3 mb-3">
              <div className="w-16 h-16 shrink-0 rounded-xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                {issuer.logoUrl ? (
                  <img src={issuer.logoUrl} alt="logo" className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 10h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button onClick={() => logoInputRef.current?.click()}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-indigo-400 text-gray-700 dark:text-gray-300">
                  {issuer.logoUrl ? 'Cambiar logo' : 'Subir logo (opcional)'}
                </button>
                {issuer.logoUrl && (
                  <button onClick={clearLogo} className="text-xs text-red-500 hover:text-red-600 font-medium text-left">
                    Quitar logo
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre / Razón social">
                <input className={INPUT_CLS} value={issuer.name}
                  onChange={(e) => setIssuer({ ...issuer, name: e.target.value })} placeholder="Juan Pérez / Mi Empresa S.A.S." />
              </Field>
              <Field label="NIT / CC">
                <input className={INPUT_CLS} value={issuer.nit}
                  onChange={(e) => setIssuer({ ...issuer, nit: e.target.value })} placeholder="900.123.456-7" />
              </Field>
              <Field label="Dirección">
                <input className={INPUT_CLS} value={issuer.address}
                  onChange={(e) => setIssuer({ ...issuer, address: e.target.value })} placeholder="Cra 1 #2-3, Bogotá" />
              </Field>
              <Field label="Teléfono">
                <input className={INPUT_CLS} value={issuer.phone}
                  onChange={(e) => setIssuer({ ...issuer, phone: e.target.value })} placeholder="+57 300 000 0000" />
              </Field>
              <Field label="Email">
                <input className={INPUT_CLS} value={issuer.email}
                  onChange={(e) => setIssuer({ ...issuer, email: e.target.value })} placeholder="correo@dominio.com" />
              </Field>
              <Field label="Ciudad (de expedición)">
                <input className={INPUT_CLS} value={city}
                  onChange={(e) => setCity(e.target.value)} placeholder="Bogotá D.C." />
              </Field>
            </div>
          </section>

          {/* Cliente */}
          <section className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">2 · Cliente (quien paga)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre / Razón social">
                <input className={INPUT_CLS} value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })} placeholder="Cliente S.A.S." />
              </Field>
              <Field label="NIT / CC">
                <input className={INPUT_CLS} value={client.nit}
                  onChange={(e) => setClient({ ...client, nit: e.target.value })} placeholder="900.000.000-0" />
              </Field>
              <Field label="Dirección">
                <input className={INPUT_CLS} value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })} placeholder="Cra 10 #5-20" />
              </Field>
              <Field label="Teléfono">
                <input className={INPUT_CLS} value={client.phone}
                  onChange={(e) => setClient({ ...client, phone: e.target.value })} placeholder="+57 ..." />
              </Field>
              <Field label="Email">
                <input className={INPUT_CLS} value={client.email}
                  onChange={(e) => setClient({ ...client, email: e.target.value })} placeholder="contacto@cliente.com" />
              </Field>
            </div>
          </section>

          {/* Datos del documento */}
          <section className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">3 · Datos del documento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="N° de cuenta de cobro">
                <input className={INPUT_CLS} value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="001" />
              </Field>
              <Field label="Fecha de expedición">
                <input type="date" className={INPUT_CLS} value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)} />
              </Field>
              <Field label="Período de cobro (opcional)">
                <input className={INPUT_CLS} value={period}
                  onChange={(e) => setPeriod(e.target.value)} placeholder="Ej: 01 al 30 de abril de 2026" />
              </Field>
              <Field label="Concepto (opcional)">
                <input className={INPUT_CLS} value={concept}
                  onChange={(e) => setConcept(e.target.value)} placeholder="Ej: Servicios profesionales de…" />
              </Field>
            </div>
          </section>

          {/* Items */}
          <section className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">4 · Servicios / Productos</h2>
              <button onClick={addItem} className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Agregar fila
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, i) => {
                const row = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-12 sm:col-span-6">
                      <input className={INPUT_CLS} value={it.description}
                        onChange={(e) => updateItem(i, 'description', e.target.value)}
                        placeholder="Descripción del servicio" />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <input type="number" min="0" step="1" className={INPUT_CLS} value={it.quantity}
                        onChange={(e) => updateItem(i, 'quantity', e.target.value)} placeholder="Cant." />
                    </div>
                    <div className="col-span-5 sm:col-span-2">
                      <input type="number" min="0" step="1" className={INPUT_CLS} value={it.unitPrice}
                        onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} placeholder="Precio" />
                    </div>
                    <div className="col-span-3 sm:col-span-1 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 pt-2.5">
                      {fmt(row)}
                    </div>
                    <div className="col-span-1 flex justify-end pt-1">
                      {items.length > 1 && (
                        <button onClick={() => removeItem(i)}
                          className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Taxes */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-2.5">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <input type="checkbox" checked={includeIva} onChange={(e) => setIncludeIva(e.target.checked)} className="accent-indigo-500" />
                <span>Aplicar IVA</span>
                {includeIva && (
                  <input type="number" min="0" max="100" value={ivaRate} onChange={(e) => setIvaRate(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-xs rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" />
                )}
                {includeIva && <span>%</span>}
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <input type="checkbox" checked={includeRetefuente} onChange={(e) => setIncludeRetefuente(e.target.checked)} className="accent-indigo-500" />
                <span>Aplicar Retefuente</span>
                {includeRetefuente && (
                  <input type="number" min="0" max="100" value={retefuenteRate} onChange={(e) => setRetefuenteRate(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-xs rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" />
                )}
                {includeRetefuente && <span>%</span>}
              </label>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              {includeIva        && <div className="flex justify-between text-gray-500"><span>IVA ({ivaRate}%)</span><span>{fmt(ivaAmount)}</span></div>}
              {includeRetefuente && <div className="flex justify-between text-gray-500"><span>Retefuente ({retefuenteRate}%)</span><span>− {fmt(retefuenteAmount)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base pt-2 border-t border-gray-200 dark:border-white/10">
                <span>Total a pagar</span><span>{fmt(total)}</span>
              </div>
            </div>
          </section>

          {/* Pago */}
          <section className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">5 · Datos de pago</h2>
              <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Se guarda</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Banco">
                <input className={INPUT_CLS} value={payment.bank}
                  onChange={(e) => setPayment({ ...payment, bank: e.target.value })} placeholder="Ej: Bancolombia" />
              </Field>
              <Field label="Tipo de cuenta">
                <select className={INPUT_CLS} value={payment.accountType}
                  onChange={(e) => setPayment({ ...payment, accountType: e.target.value })}>
                  <option>Ahorros</option>
                  <option>Corriente</option>
                  <option>Nequi</option>
                  <option>Daviplata</option>
                  <option>Otro</option>
                </select>
              </Field>
              <Field label="N° de cuenta">
                <input className={INPUT_CLS} value={payment.accountNumber}
                  onChange={(e) => setPayment({ ...payment, accountNumber: e.target.value })} placeholder="000-000000-00" />
              </Field>
              <Field label="Titular de la cuenta">
                <input className={INPUT_CLS} value={payment.accountHolder}
                  onChange={(e) => setPayment({ ...payment, accountHolder: e.target.value })} placeholder="Nombre del titular" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notas de pago (opcional)">
                  <textarea rows={2} className={INPUT_CLS} value={payment.notes}
                    onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
                    placeholder="Ej: Realizar el pago dentro de los 5 días posteriores…" />
                </Field>
              </div>
            </div>
          </section>

          {/* Firma y notas */}
          <section className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">6 · Firma y notas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre para la firma">
                <input className={INPUT_CLS} value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)} placeholder="Ej: Juan Pérez" />
              </Field>
              <Field label="CC / NIT del firmante">
                <input className={INPUT_CLS} value={signatureDoc}
                  onChange={(e) => setSignatureDoc(e.target.value)} placeholder="C.C. 1.000.000.000" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notas adicionales (opcional)">
                  <textarea rows={3} className={INPUT_CLS} value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Cualquier información adicional que deba aparecer en la cuenta de cobro" />
                </Field>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handlePrint}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm transition-all duration-200 shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Descargar PDF
            </button>
            <button onClick={resetAll}
              className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-all duration-200">
              Reiniciar
            </button>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 no-print">Vista previa</div>
          <div id="cuenta-cobro-print"
            className="bg-white text-gray-900 border border-gray-200 rounded-2xl p-8 shadow-sm text-[13px] leading-relaxed">

            {/* Header of document */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-gray-900">
              <div className="flex items-start gap-4">
                {issuer.logoUrl && (
                  <img src={issuer.logoUrl} alt="logo" className="w-20 h-20 object-contain" />
                )}
                <div>
                  <div className="font-bold text-lg">{issuer.name || 'Nombre / Razón Social'}</div>
                  {issuer.nit     && <div>NIT: {issuer.nit}</div>}
                  {issuer.address && <div>{issuer.address}</div>}
                  <div className="flex gap-3 flex-wrap">
                    {issuer.phone && <span>Tel: {issuer.phone}</span>}
                    {issuer.email && <span>{issuer.email}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs tracking-widest uppercase text-gray-500">{t.docTitle}</div>
                <div className="text-2xl font-extrabold">{t.number} {invoiceNumber || '—'}</div>
                {city && <div className="text-xs mt-1">{city}, {issueDateFormatted}</div>}
                {!city && <div className="text-xs mt-1">{issueDateFormatted}</div>}
              </div>
            </div>

            {/* Title block */}
            <div className="text-center py-5">
              <div className="uppercase text-xs tracking-widest text-gray-500">{t.debe}</div>
              <div className="font-bold text-lg">{issuer.name || '—'}</div>
              {issuer.nit && <div className="text-xs text-gray-600">{language === 'en' ? 'Tax ID' : 'NIT/CC'}: {issuer.nit}</div>}
              <div className="uppercase text-xs tracking-widest text-gray-500 mt-4">{t.suma}</div>
              <div className="font-bold text-base uppercase">{totalEnLetras}</div>
              <div className="font-extrabold text-xl mt-1">{fmt(total)}</div>
            </div>

            {/* Cliente */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">{t.porParte}</div>
              <div className="font-bold">{client.name || '—'}</div>
              {client.nit     && <div>{language === 'en' ? 'Tax ID' : 'NIT/CC'}: {client.nit}</div>}
              {client.address && <div>{client.address}</div>}
              <div className="flex gap-3 flex-wrap text-xs text-gray-600">
                {client.phone && <span>{language === 'en' ? 'Phone' : 'Tel'}: {client.phone}</span>}
                {client.email && <span>{client.email}</span>}
              </div>
            </div>

            {/* Concepto / período */}
            {(concept || period) && (
              <div className="mb-4">
                {concept && (
                  <p><span className="font-semibold">{t.concepto} </span>{concept}</p>
                )}
                {period && (
                  <p><span className="font-semibold">{t.periodo} </span>{period}</p>
                )}
              </div>
            )}

            {/* Items table */}
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left p-2 text-xs font-semibold">{t.desc}</th>
                  <th className="text-center p-2 text-xs font-semibold w-16">{t.qty}</th>
                  <th className="text-right p-2 text-xs font-semibold w-28">{t.price}</th>
                  <th className="text-right p-2 text-xs font-semibold w-28">{t.total}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const row = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
                  return (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="p-2 align-top">{it.description || <span className="text-gray-400">—</span>}</td>
                      <td className="p-2 text-center">{it.quantity || 0}</td>
                      <td className="p-2 text-right">{fmt(Number(it.unitPrice) || 0)}</td>
                      <td className="p-2 text-right font-semibold">{fmt(row)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <table className="text-[13px]">
                <tbody>
                  <tr>
                    <td className="pr-6 text-gray-600">{t.subtotal}</td>
                    <td className="text-right font-semibold">{fmt(subtotal)}</td>
                  </tr>
                  {includeIva && (
                    <tr>
                      <td className="pr-6 text-gray-600">{t.iva} ({ivaRate}%)</td>
                      <td className="text-right font-semibold">{fmt(ivaAmount)}</td>
                    </tr>
                  )}
                  {includeRetefuente && (
                    <tr>
                      <td className="pr-6 text-gray-600">{t.retefuente} ({retefuenteRate}%)</td>
                      <td className="text-right font-semibold">− {fmt(retefuenteAmount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="pr-6 pt-2 border-t-2 border-gray-900 font-bold uppercase">{t.totalUpper}</td>
                    <td className="text-right pt-2 border-t-2 border-gray-900 font-extrabold text-base">{fmt(total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment info */}
            {(payment.bank || payment.accountNumber || payment.notes) && (
              <div className="mt-6 p-4 border border-gray-300 rounded-lg">
                <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">{t.paymentTitle}</div>
                {(payment.bank || payment.accountType || payment.accountNumber) && (
                  <p>
                    {t.paymentSentence({
                      accType:   t.accountTypes[payment.accountType] || payment.accountType,
                      bank:      payment.bank,
                      accNumber: payment.accountNumber,
                      holder:    payment.accountHolder,
                    })}
                  </p>
                )}
                {payment.notes && <p className="mt-1 text-gray-700">{payment.notes}</p>}
              </div>
            )}

            {/* Notes */}
            {notes && (
              <div className="mt-4 text-xs text-gray-600 whitespace-pre-wrap">
                {notes}
              </div>
            )}

            {/* Signature */}
            <div className="mt-14 grid grid-cols-2 gap-8 text-xs">
              <div>
                <div className="border-t border-gray-400 pt-1 text-center">
                  <div className="font-semibold">{signatureName || issuer.name || '—'}</div>
                  {signatureDoc ? <div className="text-gray-600">{signatureDoc}</div> :
                    issuer.nit && <div className="text-gray-600">{language === 'en' ? 'Tax ID' : 'NIT/CC'}: {issuer.nit}</div>}
                  <div className="text-gray-500 mt-1">{t.signIssuer}</div>
                </div>
              </div>
              <div>
                <div className="border-t border-gray-400 pt-1 text-center">
                  <div className="text-gray-500">{t.receivedBy}</div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-[10px] text-gray-400 text-center">
              {issuer.name || 'Emisor'} · {issueDateFormatted}
            </div>
          </div>
        </div>

      </div>
      <ToastContainer />
    </div>
  );
}
