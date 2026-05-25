import React, { useState, useMemo, useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';

// === Parámetros legales Colombia 2026 ===
const SMMLV_2026     = 1_750_905; // Salario mínimo mensual legal vigente 2026
const AUX_2026       = 249_095;   // Auxilio de transporte / conectividad 2026
const TOPE_AUX       = 2 * SMMLV_2026;     // Aplica si salario <= 2 SMMLV
const TOPE_EXONER    = 10 * SMMLV_2026;    // Ley 1819: exoneración si IBC < 10 SMMLV

// Tasas ARL Decreto 1295/1994
const ARL = {
  I:   { tasa: 0.522,  label: 'Riesgo I (mínimo)' },
  II:  { tasa: 1.044,  label: 'Riesgo II (bajo)' },
  III: { tasa: 2.436,  label: 'Riesgo III (medio)' },
  IV:  { tasa: 4.350,  label: 'Riesgo IV (alto)' },
  V:   { tasa: 6.960,  label: 'Riesgo V (máximo)' },
};

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(n || 0));

// Fondo Solidaridad Pensional progresivo (Ley 100)
function tasaSolidaridad(salario) {
  const r = salario / SMMLV_2026;
  if (r < 4)  return 0;
  if (r < 16) return 1.0;
  if (r < 17) return 1.2;
  if (r < 18) return 1.4;
  if (r < 19) return 1.6;
  if (r < 20) return 1.8;
  return 2.0;
}

const INPUT_CLS =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/10 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition';

function NumInput({ value, onChange, ...rest }) {
  return (
    <input
      type="number" min="0" inputMode="numeric"
      value={value || ''}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className={INPUT_CLS}
      placeholder="0"
      {...rest}
    />
  );
}

// Input para valores monetarios: muestra con separadores de miles (1.750.905) mientras escribes
function MoneyInput({ value, onChange, className, ...rest }) {
  const formatted = value ? new Intl.NumberFormat('es-CO').format(value) : '';
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw ? Number(raw) : 0);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatted}
      onChange={handleChange}
      className={className || INPUT_CLS}
      placeholder="0"
      {...rest}
    />
  );
}

function Toggle({ label, checked, onChange, color = 'indigo', hint }) {
  const colors = {
    indigo:  'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber:   'bg-amber-500',
  };
  return (
    <button
      onClick={() => onChange(!checked)}
      type="button"
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all text-left"
    >
      <span className={`w-9 h-5 rounded-full relative transition-colors ${checked ? colors[color] : 'bg-gray-300 dark:bg-white/15'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      <span className="flex-1">
        <span className="block text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</span>
        {hint && <span className="block text-[10px] text-gray-400 dark:text-gray-400 mt-0.5">{hint}</span>}
      </span>v
      <span className={`text-[10px] font-bold uppercase tracking-wider ${checked ? `text-${color === 'amber' ? 'amber' : color}-500` : 'text-gray-400 dark:text-gray-500'}`}>
        {checked ? 'Sí' : 'No'}
      </span>
    </button>
  );
}

export default function PayrollCalculator() {
  // ── Estado base ──
  const [salario,        setSalario]        = useState(SMMLV_2026);
  const [riesgoArl,      setRiesgoArl]      = useState('I');
  const [exonerado,      setExonerado]      = useState(true);  // Ley 1819
  const [trabajoRemoto,  setTrabajoRemoto]  = useState(false);

  // ── Ajustes avanzados ──
  const [showModal,         setShowModal]         = useState(false);
  const [dias,              setDias]              = useState(30);
  const [comisiones,        setComisiones]        = useState(0);
  const [bonosNoSal,        setBonosNoSal]        = useState(0);
  const [otrasDeducciones,  setOtrasDeducciones]  = useState(0);
  const [hExtraDiur,        setHExtraDiur]        = useState(0);
  const [hExtraNoct,        setHExtraNoct]        = useState(0);
  const [hRecNoct,          setHRecNoct]          = useState(0);
  const [hExtraDomDiur,     setHExtraDomDiur]     = useState(0);
  const [hExtraDomNoct,     setHExtraDomNoct]     = useState(0);
  const [hRecDomFest,       setHRecDomFest]       = useState(0);

  // Bloquear scroll del body cuando el modal esté abierto
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  // ── Cálculos ──
  const calc = useMemo(() => {
    const sb = Math.max(0, Number(salario) || 0);
    const diasT = Math.max(0, Math.min(30, Number(dias) || 0));
    const salarioProp = (sb / 30) * diasT;

    const tieneAux = sb <= TOPE_AUX;
    const auxBase  = tieneAux ? AUX_2026 : 0;
    const auxProp  = (auxBase / 30) * diasT;
    const auxLabel = trabajoRemoto ? 'Auxilio de Conectividad' : 'Auxilio de Transporte';

    // Jornada legal 2026: 44 h/semana = 220 h/mes (Ley 2101/2021 - reducción progresiva)
    // Valores tradicionales: 240 (48 h/sem, antes de reforma), 230 (46 h/sem 2024-2025), 220 (44 h/sem desde jul/2025), 210 (42 h/sem desde jul/2026)
    const valorHora = sb / 220;
    const vHED  = valorHora * 1.25 * (Number(hExtraDiur)    || 0);
    const vHEN  = valorHora * 1.75 * (Number(hExtraNoct)    || 0);
    const vRN   = valorHora * 0.35 * (Number(hRecNoct)      || 0);
    const vDOM  = valorHora * 1.75 * (Number(hRecDomFest)   || 0);
    const vEDD  = valorHora * 2.00 * (Number(hExtraDomDiur) || 0);
    const vEDN  = valorHora * 2.50 * (Number(hExtraDomNoct) || 0);
    const totalExtras = vHED + vHEN + vRN + vDOM + vEDD + vEDN;

    const comis     = Math.max(0, Number(comisiones)       || 0);
    const bonosNS   = Math.max(0, Number(bonosNoSal)       || 0);
    const otrosDesc = Math.max(0, Number(otrasDeducciones) || 0);

    // Devengado total
    const devengadoSalarial = salarioProp + totalExtras + comis;
    const totalDevengado = devengadoSalarial + auxProp + bonosNS;

    // IBC con tope mínimo (1 SMMLV proporcional) y máximo (25 SMMLV)
    const ibcMin = SMMLV_2026 * (diasT / 30);
    const ibcMax = 25 * SMMLV_2026;
    const ibc = Math.min(Math.max(devengadoSalarial, ibcMin), ibcMax);

    // Deducciones empleado
    const salud4   = Math.round(ibc * 0.04);
    const pension4 = Math.round(ibc * 0.04);
    const solRate  = tasaSolidaridad(sb);
    const solidar  = Math.round(ibc * (solRate / 100));
    const totalDeducciones = salud4 + pension4 + solidar + otrosDesc;
    const neto = totalDevengado - totalDeducciones;

    // Aportes patronales (Ley 1819 si IBC < 10 SMMLV)
    const exonAplica = exonerado && sb < TOPE_EXONER;
    const saludP    = exonAplica ? 0 : Math.round(ibc * 0.085);
    const pensionP  = Math.round(ibc * 0.12);
    const arlTasa   = ARL[riesgoArl].tasa;
    const arl       = Math.round(ibc * (arlTasa / 100));
    const cajaComp  = Math.round(ibc * 0.04);
    const sena      = exonAplica ? 0 : Math.round(ibc * 0.02);
    const icbf      = exonAplica ? 0 : Math.round(ibc * 0.03);
    const segSocial    = saludP + pensionP + arl;
    const parafiscales = cajaComp + sena + icbf;

    // Prestaciones sociales (provisión mensual)
    const baseDevPrest = salarioProp + totalExtras + comis + auxProp;
    const cesantias = Math.round(baseDevPrest * 0.0833);
    const intCes    = Math.round(cesantias * 0.12);
    const prima     = Math.round(baseDevPrest * 0.0833);
    const vacaciones = Math.round((salarioProp + comis) * 0.0417);
    const prestaciones = cesantias + intCes + prima + vacaciones;

    const costoTotalEmpresa = totalDevengado + segSocial + parafiscales + prestaciones;

    return {
      sb, diasT, salarioProp, auxProp, tieneAux, auxLabel,
      valorHora, vHED, vHEN, vRN, vDOM, vEDD, vEDN, totalExtras,
      comis, bonosNS, otrosDesc,
      devengadoSalarial, totalDevengado,
      ibc, salud4, pension4, solRate, solidar, totalDeducciones, neto,
      exonAplica, saludP, pensionP, arlTasa, arl, cajaComp, sena, icbf, segSocial, parafiscales,
      cesantias, intCes, prima, vacaciones, prestaciones,
      costoTotalEmpresa,
    };
  }, [
    salario, riesgoArl, exonerado, trabajoRemoto,
    dias, comisiones, bonosNoSal, otrasDeducciones,
    hExtraDiur, hExtraNoct, hRecNoct, hExtraDomDiur, hExtraDomNoct, hRecDomFest,
  ]);

  const resetAdvanced = () => {
    setDias(30); setComisiones(0); setBonosNoSal(0); setOtrasDeducciones(0);
    setHExtraDiur(0); setHExtraNoct(0); setHRecNoct(0);
    setHExtraDomDiur(0); setHExtraDomNoct(0); setHRecDomFest(0);
  };

  // Cuántos campos avanzados están activos
  const advancedActive =
    (dias !== 30 ? 1 : 0) +
    (comisiones      > 0 ? 1 : 0) +
    (bonosNoSal      > 0 ? 1 : 0) +
    (otrasDeducciones > 0 ? 1 : 0) +
    (hExtraDiur      > 0 ? 1 : 0) +
    (hExtraNoct      > 0 ? 1 : 0) +
    (hRecNoct        > 0 ? 1 : 0) +
    (hExtraDomDiur   > 0 ? 1 : 0) +
    (hExtraDomNoct   > 0 ? 1 : 0) +
    (hRecDomFest     > 0 ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-500 dark:text-amber-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Colombia 2026
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Calculadora de Nómina</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Calcula salario neto, costo empresa y aportes según ley colombiana. SMMLV 2026: {formatCOP(SMMLV_2026)}
        </p>
      </div>

      {/* ── Card principal ── */}
      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm">

        <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-2">
          Salario mensual
        </div>

        {/* Salario grande + botón calcular */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400 dark:text-gray-300 font-light">$</span>
            <MoneyInput
              value={salario}
              onChange={setSalario}
              className="w-full pl-10 pr-4 py-4 text-3xl sm:text-4xl font-extrabold rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder={new Intl.NumberFormat('es-CO').format(SMMLV_2026)}
            />
          </div>
          <button
            onClick={() => setSalario(SMMLV_2026)}
            className="px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition-all"
            title="Restablecer al SMMLV 2026"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m-6 4h6m-6 4h4M5 5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
            </svg>
            SMMLV
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-400 mt-2">
          • Salario mínimo 2026: <span className="font-semibold">{formatCOP(SMMLV_2026)}</span>
          {calc.tieneAux && <> · {calc.auxLabel}: <span className="font-semibold">{formatCOP(AUX_2026)}</span></>}
        </p>

        {/* Toggles row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <label className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1.5">Riesgo Laboral (ARL)</span>
            <select className={INPUT_CLS} value={riesgoArl} onChange={(e) => setRiesgoArl(e.target.value)}>
              {Object.entries(ARL).map(([k, v]) => (
                <option key={k} value={k} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{v.label} ({v.tasa}%)</option>
              ))}
            </select>
          </label>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1.5 block">Exonerado (Ley 1819)</span>
            <Toggle label="Exoneración aportes" hint={`Aplica si salario < ${formatCOP(TOPE_EXONER)}`} checked={exonerado} onChange={setExonerado} color="emerald" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-400 mb-1.5 block">¿Trabajo remoto?</span>
            <Toggle label="Aux. Conectividad (Ley 2088)" hint="Reemplaza el aux. de transporte" checked={trabajoRemoto} onChange={setTrabajoRemoto} color="amber" />
          </div>
        </div>

        {/* Botón ajustes avanzados */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full mt-5 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-amber-400 dark:hover:border-amber-500/60 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-gray-600 dark:text-gray-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
          Añadir Horas Extras, Comisiones y Ajustes
          {advancedActive > 0 && (
            <span className="ml-1 text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">{advancedActive}</span>
          )}
        </button>
      </div>

      {/* ── Resultados destacados ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">

        {/* Empleado */}
        <div className="relative bg-white dark:bg-white/[0.04] border-2 border-emerald-500/40 rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -translate-y-20 translate-x-20" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h.01M11 15h2m-7 6h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">Recibe el Empleado</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 mt-3">Neto mensual a pagar</div>
            <div className="text-4xl font-extrabold text-gray-900 dark:text-white tabular-nums">{formatCOP(calc.neto)}</div>
            <div className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Directo al bolsillo
            </div>
          </div>
        </div>

        {/* Empresa */}
        <div className="relative bg-gray-900 dark:bg-black border-2 border-red-500/40 rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full -translate-y-20 translate-x-20" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <span className="font-bold text-white">Costo Total Empresa</span>
            </div>
            <div className="text-xs text-gray-400 mb-2 mt-3">Salario + Prestaciones + Aportes</div>
            <div className="text-4xl font-extrabold text-white tabular-nums">{formatCOP(calc.costoTotalEmpresa)}</div>
            <div className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-red-300 bg-red-500/15 px-2.5 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Provisión mensual requerida
            </div>
          </div>
        </div>
      </div>

      {/* ── Desglose detallado ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

        {/* Desprendible empleado */}
        <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Desprendible Empleado
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">{calc.diasT} Días Liquidados</span>
          </div>

          <SectionTitle>Ingresos (devengados)</SectionTitle>
          <DetailRow label="Sueldo Básico" value={formatCOP(calc.salarioProp)} icon="💰" />
          {calc.tieneAux && <DetailRow label={calc.auxLabel} value={formatCOP(calc.auxProp)} icon={trabajoRemoto ? '📶' : '🚌'} />}
          {calc.vHED  > 0 && <DetailRow label={`Extra Diurna (${hExtraDiur} h)`}        value={formatCOP(calc.vHED)} icon="☀️" />}
          {calc.vHEN  > 0 && <DetailRow label={`Extra Nocturna (${hExtraNoct} h)`}      value={formatCOP(calc.vHEN)} icon="🌙" />}
          {calc.vRN   > 0 && <DetailRow label={`Recargo Nocturno (${hRecNoct} h)`}      value={formatCOP(calc.vRN)}  icon="🌙" />}
          {calc.vDOM  > 0 && <DetailRow label={`Recargo Dom/Fest (${hRecDomFest} h)`}   value={formatCOP(calc.vDOM)} icon="📅" />}
          {calc.vEDD  > 0 && <DetailRow label={`Extra Dom/Fest Diur (${hExtraDomDiur} h)`} value={formatCOP(calc.vEDD)} icon="📅" />}
          {calc.vEDN  > 0 && <DetailRow label={`Extra Dom/Fest Noct (${hExtraDomNoct} h)`} value={formatCOP(calc.vEDN)} icon="📅" />}
          {calc.comis   > 0 && <DetailRow label="Comisiones"            value={formatCOP(calc.comis)}   icon="💼" />}
          {calc.bonosNS > 0 && <DetailRow label="Bonos No Salariales"   value={formatCOP(calc.bonosNS)} icon="🎁" />}

          <TotalRow color="emerald" label="TOTAL DEVENGADO" value={formatCOP(calc.totalDevengado)} />

          <SectionTitle className="mt-5">Descuentos (deducciones)</SectionTitle>
          <DetailRow label="Salud (4%)"   value={`− ${formatCOP(calc.salud4)}`}   icon="🩺" danger />
          <DetailRow label="Pensión (4%)" value={`− ${formatCOP(calc.pension4)}`} icon="👴" danger />
          {calc.solidar > 0 && <DetailRow label={`Fondo Solidaridad (${calc.solRate}%)`} value={`− ${formatCOP(calc.solidar)}`} icon="🤝" danger />}
          {calc.otrosDesc > 0 && <DetailRow label="Otras Deducciones" value={`− ${formatCOP(calc.otrosDesc)}`} icon="📉" danger />}

          <TotalRow color="red" label="TOTAL DEDUCIDO" value={`− ${formatCOP(calc.totalDeducciones)}`} />

          {/* Pago Neto */}
          <div className="mt-5 p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Pago Neto Final</div>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1 tabular-nums">{formatCOP(calc.neto)}</div>
              </div>
              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 12l2 2 4-4" /></svg>
            </div>
          </div>
        </div>

        {/* Costo real empresa */}
        <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" /></svg>
              Costo Real Empresa
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-1 rounded-full">Provisión</span>
          </div>

          <SectionTitle>1. Seguridad Social</SectionTitle>
          <DetailRow label="Salud (8.5%)" value={calc.exonAplica ? 'Exonerado' : formatCOP(calc.saludP)} icon="🩺" muted={calc.exonAplica} />
          <DetailRow label="Pensión (12%)" value={formatCOP(calc.pensionP)} icon="👴" />
          <DetailRow label={`Riesgos Laborales (ARL ${riesgoArl})`} value={formatCOP(calc.arl)} icon="⚠️" />
          <Subtotal label="Subtotal Seguridad Social" value={formatCOP(calc.segSocial)} />

          <SectionTitle className="mt-4">2. Prestaciones Sociales</SectionTitle>
          <DetailRow label="Cesantías (8.33%)"             value={formatCOP(calc.cesantias)}  icon="🏦" />
          <DetailRow label="Intereses sobre Cesantías (12% s/c)" value={formatCOP(calc.intCes)}     icon="📈" />
          <DetailRow label="Prima de Servicios (8.33%)"    value={formatCOP(calc.prima)}      icon="🎁" />
          <DetailRow label="Vacaciones (4.17%)"            value={formatCOP(calc.vacaciones)} icon="🏖️" />
          <Subtotal label="Subtotal Prestaciones Sociales" value={formatCOP(calc.prestaciones)} />

          <SectionTitle className="mt-4">3. Parafiscales</SectionTitle>
          <DetailRow label="Caja de Compensación (4%)" value={formatCOP(calc.cajaComp)} icon="🏢" />
          <DetailRow label={`SENA (2%) ${calc.exonAplica ? '· Exonerado' : ''}`} value={calc.exonAplica ? 'Exonerado' : formatCOP(calc.sena)} icon="🎓" muted={calc.exonAplica} />
          <DetailRow label={`ICBF (3%) ${calc.exonAplica ? '· Exonerado' : ''}`} value={calc.exonAplica ? 'Exonerado' : formatCOP(calc.icbf)} icon="👶" muted={calc.exonAplica} />
          <Subtotal label="Subtotal Parafiscales" value={formatCOP(calc.parafiscales)} />

          {/* Costo total */}
          <div className="mt-5 p-4 rounded-xl border-2 border-red-500/40 bg-gray-900 dark:bg-black">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-red-300">Costo Total Empresa</div>
                <div className="text-2xl font-extrabold text-white mt-1 tabular-nums">{formatCOP(calc.costoTotalEmpresa)}</div>
              </div>
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Información legal */}
      <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
        <div className="font-semibold mb-1">📋 Marco legal aplicado</div>
        <ul className="list-disc pl-4 space-y-0.5 text-amber-700/90 dark:text-amber-300/90">
          <li>SMMLV 2026: {formatCOP(SMMLV_2026)} · Auxilio 2026: {formatCOP(AUX_2026)} (aplica si salario ≤ 2 SMMLV)</li>
          <li>Aportes según Ley 100/1993 · ARL Decreto 1295/1994 · Recargos CST</li>
          <li>Valor hora ordinaria: salario / 220 (jornada 44 h/sem, Ley 2101/2021)</li>
          <li>Exoneración Ley 1819/2016 (Salud, SENA, ICBF) si IBC &lt; 10 SMMLV</li>
          <li>Trabajo remoto: aux. de conectividad reemplaza al de transporte (Ley 2088/2021)</li>
        </ul>
      </div>

      {/* ── Modal Ajustes Avanzados ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 flex items-center justify-between p-5 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ajustes Avanzados</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Col 1: Ingresos / Deducciones */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-3">Ingresos y Deducciones</div>
                <div className="space-y-3">
                  <FieldBox label="Días Trabajados (Mes)" hint="Máximo 30 días">
                    <NumInput value={dias} max="30" onChange={setDias} />
                  </FieldBox>
                  <FieldBox label="Comisiones (Salariales)">
                    <MoneyInput value={comisiones} onChange={setComisiones} />
                  </FieldBox>
                  <FieldBox label="Bonos No Salariales (Ley 1393)">
                    <MoneyInput value={bonosNoSal} onChange={setBonosNoSal} />
                  </FieldBox>
                  <FieldBox label="Otras Deducciones (Préstamos)">
                    <MoneyInput value={otrasDeducciones} onChange={setOtrasDeducciones} />
                  </FieldBox>
                </div>
              </div>

              {/* Col 2: Trabajo suplementario */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-3 flex justify-between">
                  <span>Trabajo Suplementario</span>
                  <span className="text-gray-400">Máx 720h</span>
                </div>
                <div className="space-y-2">
                  <RowInput label="Extra Diurna (+25%)"     value={hExtraDiur}    onChange={setHExtraDiur} />
                  <RowInput label="Extra Nocturna (+75%)"   value={hExtraNoct}    onChange={setHExtraNoct} />
                  <RowInput label="Recargo Nocturno (+35%)" value={hRecNoct}      onChange={setHRecNoct} />
                  <RowInput label="Recargo Dom/Fest (+75%)" value={hRecDomFest}   onChange={setHRecDomFest} />
                  <RowInput label="Extra Dom/Fest Diur (+100%)" value={hExtraDomDiur} onChange={setHExtraDomDiur} />
                  <RowInput label="Extra Dom/Fest Noct (+150%)" value={hExtraDomNoct} onChange={setHExtraDomNoct} />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-5 border-t border-gray-200 dark:border-white/10 flex gap-3">
              <button onClick={resetAdvanced}
                className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-all">
                Reiniciar
              </button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all">
                Guardar y Calcular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componentes auxiliares ───

function SectionTitle({ children, className = '' }) {
  return (
    <div className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ${className}`}>
      {children}
    </div>
  );
}

function DetailRow({ label, value, icon, danger, muted }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/10 text-sm">
      <span className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        {label}
      </span>
      <span className={`tabular-nums font-medium ${
        muted  ? 'text-emerald-500 dark:text-emerald-400 text-xs italic' :
        danger ? 'text-red-500 dark:text-red-400' :
        'text-gray-900 dark:text-white'
      }`}>
        {value}
      </span>
    </div>
  );
}

function TotalRow({ label, value, color = 'emerald' }) {
  const colors = {
    emerald: 'border-l-emerald-500 text-gray-900 dark:text-white',
    red:     'border-l-red-500 text-red-500 dark:text-red-400',
  };
  return (
    <div className={`mt-2 pl-3 border-l-4 ${colors[color]} flex items-center justify-between py-2`}>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      <span className="font-bold text-sm tabular-nums">{value}</span>
    </div>
  );
}

function Subtotal({ label, value }) {
  return (
    <div className="mt-2 pl-3 border-l-4 border-l-gray-400 dark:border-l-gray-500 flex items-center justify-between py-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{label}</span>
      <span className="font-bold text-sm tabular-nums text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function FieldBox({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-gray-400 dark:text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

function RowInput({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/10">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-200 flex-1">{label}</span>
      <input
        type="number" min="0"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-16 px-2 py-1 text-sm text-right rounded border border-gray-200 dark:border-white/15 bg-white dark:bg-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-400"
        placeholder="0"
      />
    </div>
  );
}
