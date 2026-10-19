import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
// Starting estimates for quoting, not manufacturer ratings or measured averages.
const printers = [
  { id: 'custom', name: 'Otra / personalizado', watts: null },
  { id: 'a1', name: 'Bambu Lab A1', watts: 100 },
  { id: 'a2l', name: 'Bambu Lab A2L', watts: 150 },
  { id: 'p2s', name: 'Bambu Lab P2S', watts: 200 },
];
const volumeDefaults = { minMargin: '25', discount13: '5', discount100: '8', discount200: '10' };
const initial = { spoolPrice: '', spoolWeight: '1000', grams: '', hours: '', minutes: '0', waste: '0', watts: '0', electricity: '0', machine: '0', laborMinutes: '0', laborRate: '0', extras: '0', margin: '30', quantity: '1', ...volumeDefaults };
const example = { spoolPrice: '90000', spoolWeight: '1000', grams: '50', hours: '3', minutes: '30', waste: '10', watts: '150', electricity: '900', machine: '1000', laborMinutes: '15', laborRate: '18000', extras: '1000', margin: '30', quantity: '1', ...volumeDefaults };
const groups = [
  { title: 'Material y pieza', subtitle: 'Usa los gramos y el tiempo que indica tu laminador (Cura, PrusaSlicer, Bambu Studio…). Incluye soportes y purga en el peso.', fields: [
    ['spoolPrice', 'Precio de la bobina (COP)', 0, 100000000, '0.01'], ['spoolWeight', 'Peso neto de la bobina (g)', 1, 1000000, '1'], ['grams', 'Material por pieza (g)', .01, 1000000, '.01'], ['waste', 'Material adicional / desperdicio (%)', 0, 100, '.1'],
  ] },
  { title: 'Tiempo y uso de la impresora', subtitle: 'Tiempo por pieza. La tarifa de máquina cubre desgaste y mantenimiento; no incluyas aquí la electricidad.', fields: [
    ['hours', 'Horas de impresión', 0, 10000, '1'], ['minutes', 'Minutos adicionales', 0, 59, '1'], ['machine', 'Costo de máquina por hora (COP)', 0, 100000000, '.01'], ['watts', 'Consumo promedio (W)', 0, 100000, '1'], ['electricity', 'Tarifa eléctrica (COP/kWh)', 0, 1000000, '.01'],
  ] },
  { title: 'Acabados y precio de venta', subtitle: 'Mano de obra y extras por pieza: preparación, retiro de soportes, pintura o empaque. Los costos opcionales pueden quedar en cero.', fields: [
    ['laborMinutes', 'Trabajo manual por pieza (min)', 0, 100000, '1'], ['laborRate', 'Valor de tu hora de trabajo (COP)', 0, 100000000, '.01'], ['extras', 'Otros costos por pieza (COP)', 0, 100000000, '.01'], ['margin', 'Margen sobre el precio de venta (%)', 0, 99, '.1'], ['quantity', 'Cantidad de piezas iguales', 1, 100000, '1'],
  ] },
];
groups.push({ title: 'Precios por volumen', subtitle: 'Propuesta editable: 13–99, 100–199 y 200 o más unidades. El descuento se aplica a todas las piezas del pedido, sin acumular escalas. Los costos por pieza se mantienen; ajusta arriba solo ahorros reales.', fields: [
  ['minMargin', 'Margen mínimo sobre venta (%)', 0, 99, '.1'],
  ['discount13', 'Descuento de 13 a 99 unidades (%)', 0, 99, '.1'],
  ['discount100', 'Descuento de 100 a 199 unidades (%)', 0, 99, '.1'],
  ['discount200', 'Descuento desde 200 unidades (%)', 0, 99, '.1'],
] });
const allFields = groups.flatMap((group) => group.fields);
const inputClass = 'mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white';

export default function Print3DCalculator() {
  const [values, setValues] = useState(initial);
  const [volumeEnabled, setVolumeEnabled] = useState(false);
  const [project, setProject] = useState('');
  const [notice, setNotice] = useState('');
  const [printerId, setPrinterId] = useState('custom');
  const printer = printers.find((item) => item.id === printerId);
  const choosePrinter = (id) => {
    setPrinterId(id);
    const selected = printers.find((item) => item.id === id);
    if (selected.watts !== null) setValues((current) => ({ ...current, watts: String(selected.watts) }));
    setNotice('');
  };
  const errors = {};
  const numbers = {};
  allFields.forEach(([key, label, min, max, step]) => {
    if (!volumeEnabled && key in volumeDefaults) return;
    const n = Number(values[key]);
    numbers[key] = n;
    if (values[key].trim() === '' || !Number.isFinite(n)) errors[key] = 'Completa este campo.';
    else if (n < min || n > max) errors[key] = `Ingresa un valor entre ${min} y ${max}.`;
    else if (step === '1' && !Number.isInteger(n)) errors[key] = 'Ingresa un número entero.';
  });
  const n = numbers;
  const duration = n.hours + n.minutes / 60;
  if (!errors.hours && !errors.minutes && duration <= 0) errors.hours = 'El tiempo de impresión debe ser mayor que cero.';
  if (volumeEnabled && !errors.minMargin && !errors.margin && n.minMargin > n.margin) errors.minMargin = 'El mínimo no puede superar el margen base.';
  if (volumeEnabled && n.discount100 < n.discount13) errors.discount100 = 'Debe ser igual o mayor al descuento anterior.';
  if (volumeEnabled && n.discount200 < n.discount100) errors.discount200 = 'Debe ser igual o mayor al descuento anterior.';
  const valid = Object.keys(errors).length === 0;
  const costs = valid ? [
    ['Material', n.spoolPrice / n.spoolWeight * n.grams * (1 + n.waste / 100)],
    ['Electricidad', n.watts / 1000 * duration * n.electricity],
    ['Uso de máquina', duration * n.machine],
    ['Mano de obra', n.laborMinutes / 60 * n.laborRate],
    ['Otros costos', n.extras],
  ] : [];
  const cost = costs.reduce((total, [, value]) => total + value, 0);
  const basePrice = valid ? cost / (1 - n.margin / 100) : 0;
  const quoteFor = (quantity) => {
    const requested = volumeEnabled ? (quantity >= 200 ? n.discount200 : quantity >= 100 ? n.discount100 : quantity >= 13 ? n.discount13 : 0) : 0;
    const floor = volumeEnabled && valid ? cost / (1 - n.minMargin / 100) : cost;
    const discounted = basePrice * (1 - requested / 100);
    const unit = valid ? Math.max(discounted, floor) : 0;
    return { unit, requested, limited: valid && discounted < floor - .000001,
      discount: basePrice > 0 ? (1 - unit / basePrice) * 100 : 0,
      margin: unit > 0 ? (unit - cost) / unit * 100 : 0 };
  };
  const quote = quoteFor(n.quantity);
  const price = quote.unit;
  const profit = price - cost;
  const summary = () => [project || 'Cotización de impresión 3D', `Impresora: ${printer.name}`, `Consumo usado: ${n.watts} W (editable)`, ...costs.map(([label, value]) => `${label}: ${money(value)}`), `Costo por pieza: ${money(cost)}`, `Margen efectivo sobre costos ingresados: ${quote.margin.toFixed(2)}%`, `Descuento por volumen: ${quote.discount.toFixed(2)}%`, `Ganancia estimada del pedido: ${money(profit * n.quantity)}`, `Precio por pieza: ${money(price)}`, `Cantidad: ${n.quantity}`, `Total: ${money(price * n.quantity)}`, 'Valores en COP, antes de impuestos y envío.'].join('\n');
  const copy = async () => {
    try { await navigator.clipboard.writeText(summary()); setNotice('Resumen copiado.'); }
    catch { setNotice('No se pudo copiar. Puedes descargar el resumen.'); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([summary()], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'cotizacion-impresion-3d.txt'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="mx-auto max-w-6xl pb-12">
    <Link to="/tools" className="text-sm font-semibold text-violet-600 dark:text-violet-300">← Herramientas IA</Link>
    <header className="mb-8 mt-6 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6 dark:border-violet-400/20 dark:from-violet-950/40 dark:via-gray-950 dark:to-cyan-950/30 sm:p-9">
      <span className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-300">Bapesu Lab · Calculadora gratuita</span>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-4xl">¿Cuánto cobrar por tu impresión 3D?</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">Calcula tus costos y define un precio con ganancia. Pensada para impresión con filamento (FDM), con desglose en pesos colombianos y resultados al instante.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => { setValues(example); setVolumeEnabled(false); setPrinterId('custom'); setNotice('Ejemplo cargado. Ajusta los valores a tus costos reales.'); }} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700">Cargar ejemplo</button>
        <button type="button" onClick={() => { setValues(initial); setVolumeEnabled(false); setPrinterId('custom'); setProject(''); setNotice('Calculadora reiniciada.'); }} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-white/20 dark:text-gray-200">Reiniciar</button>
      </div>
    </header>
    <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-5">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Nombre del proyecto (opcional)<input className={inputClass} maxLength={120} value={project} onChange={(event) => setProject(event.target.value)} placeholder="Ej. Soporte para sensor" /></label>
        {groups.map((group, index) => <fieldset key={group.title} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900/50 sm:p-6">
          <legend className="px-2 text-base font-bold text-gray-900 dark:text-white"><span className="mr-2 text-violet-500">0{index + 1}</span>{group.title}</legend>
          <p className="mb-5 text-xs leading-5 text-gray-500 dark:text-gray-400">{group.subtitle}</p>
          {index === 3 && <label className="mb-4 flex items-center gap-3 text-sm font-semibold text-violet-700 dark:text-violet-300"><input type="checkbox" checked={volumeEnabled} onChange={(event) => { setVolumeEnabled(event.target.checked); setNotice(''); }} />Activar precios por volumen</label>}
          {index === 1 && <div className="mb-5 rounded-xl bg-violet-50 p-4 dark:bg-violet-500/10">
            <label htmlFor="print-printer" className="block text-xs font-semibold text-gray-700 dark:text-gray-200">Modelo de impresora
              <select id="print-printer" value={printerId} onChange={(event) => choosePrinter(event.target.value)} className={inputClass} aria-describedby="printer-consumption-note">
                {printers.map((item) => <option key={item.id} value={item.id}>{item.name}{item.watts !== null ? ' · referencia ' + item.watts + ' W' : ''}</option>)}
              </select>
            </label>
            <p id="printer-consumption-note" className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{printer.watts === null ? 'Ingresa tu consumo promedio en W.' : 'Se carga una estimación orientativa, no un promedio oficial del fabricante. Puedes ajustar los W debajo.'} El consumo cambia con el material, la cama y el ambiente. Usa una medición propia si la tienes.</p>
            {printer.watts !== null && Number(values.watts) !== printer.watts && <p className="mt-1 text-xs text-violet-600 dark:text-violet-300">Consumo personalizado para {printer.name}.</p>}
          </div>}
          <div className="grid gap-4 sm:grid-cols-2">{group.fields.map(([key, label, min, max, step]) => <label key={key} className="block text-xs font-semibold text-gray-700 dark:text-gray-200" htmlFor={'print-' + key}>
            {label}<input id={'print-' + key} type="number" inputMode="decimal" disabled={index === 3 && !volumeEnabled} required min={min} max={max} step={step} value={values[key]} className={inputClass} aria-invalid={Boolean(errors[key] && values[key] !== '')} aria-describedby={'hint-' + key} onChange={(event) => { setValues((current) => ({ ...current, [key]: event.target.value })); setNotice(''); }} />
            <span id={'hint-' + key} className="mt-1 block text-xs font-normal text-rose-600 dark:text-rose-400">{values[key] !== '' ? errors[key] : ''}</span>
          </label>)}</div>
        </fieldset>)}
      </div>
      <aside className="rounded-3xl border border-violet-200 bg-white p-6 shadow-xl shadow-violet-950/5 dark:border-violet-400/20 dark:bg-gray-900 lg:sticky lg:top-24">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-300">Tu cotización</p>
        <h2 className="mt-3 break-words text-lg font-bold text-gray-900 dark:text-white">{project || 'Precio de impresión 3D'}</h2>
        {!valid ? <div className="my-6 rounded-2xl bg-violet-50 p-5 text-sm leading-6 text-violet-800 dark:bg-violet-400/10 dark:text-violet-200">Completa material y tiempo para ver el precio. Corrige los campos señalados o carga el ejemplo para comenzar.</div> : <>
          <div className="my-6 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white"><p className="text-sm text-violet-100">Precio de venta por pieza</p><p className="mt-2 break-words text-3xl font-extrabold">{money(price)}</p><p className="mt-2 text-xs text-violet-100">COP · antes de impuestos y envío</p></div>
          <dl className="space-y-3 text-sm">{costs.map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-gray-500 dark:text-gray-400">{label}</dt><dd className="text-right font-semibold text-gray-800 dark:text-gray-200">{money(value)}</dd></div>)}
            <div className="flex justify-between gap-3 border-t border-gray-200 pt-3 font-bold dark:border-white/10 dark:text-white"><dt>Costo por pieza</dt><dd>{money(cost)}</dd></div>
            <div className="flex justify-between gap-3 text-emerald-700 dark:text-emerald-300"><dt>Ganancia por pieza</dt><dd className="font-bold">{money(profit)}</dd></div>
            <div className="flex justify-between gap-3 border-t border-gray-200 pt-4 text-lg font-bold dark:border-white/10 dark:text-white"><dt>Total ({n.quantity} {n.quantity === 1 ? 'pieza' : 'piezas'})</dt><dd className="text-right">{money(price * n.quantity)}</dd></div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-gray-500 dark:text-gray-400">Todas las piezas usan el mismo material, tiempo y acabado. El total usa el precio unitario de la escala elegida. El margen cubre únicamente los costos ingresados; incluye comisiones, fallos y gastos generales en tus costos si aplican.</p>
          {volumeEnabled && <div className="mt-5 space-y-3 rounded-xl bg-violet-50 p-4 text-sm dark:bg-violet-500/10 dark:text-gray-200">
            <p>Descuento efectivo: <strong>{quote.discount.toFixed(2)}%</strong> · Margen: <strong>{quote.margin.toFixed(2)}%</strong></p>
            <p>Ganancia estimada del pedido: <strong>{money(profit * n.quantity)}</strong></p>
            <p>Horas de máquina del pedido: <strong>{(duration * n.quantity).toLocaleString('es-CO', { maximumFractionDigits: 1 })} h</strong></p>
            {quote.limited && <p className="text-xs text-amber-800 dark:text-amber-300">El descuento solicitado de {quote.requested}% se limitó para mantener el margen mínimo de {n.minMargin}%.</p>}
          </div>}
        </>}
        <div className="mt-6 grid grid-cols-2 gap-2"><button type="button" disabled={!valid} onClick={copy} className="rounded-xl bg-violet-600 px-3 py-3 text-xs font-bold text-white disabled:opacity-40">Copiar resumen</button><button type="button" disabled={!valid} onClick={download} className="rounded-xl border border-violet-200 px-3 py-3 text-xs font-bold text-violet-700 disabled:opacity-40 dark:text-violet-300">Descargar TXT</button></div>
        <p role="status" className="mt-3 text-xs text-violet-600 dark:text-violet-300">{notice}</p>
        <details className="mt-6 border-t border-gray-200 pt-4 text-xs leading-6 text-gray-500 dark:border-white/10 dark:text-gray-400"><summary className="cursor-pointer font-semibold">¿Cómo se calcula?</summary><p className="mt-2">Material = precio de bobina ÷ gramos de bobina × gramos de pieza × (1 + desperdicio / 100).</p><p>Electricidad = W ÷ 1000 × horas × tarifa por kWh.</p><p>Precio = costo total ÷ (1 − margen / 100). Un margen del 30% significa que la ganancia es el 30% del precio de venta; no es sumar un 30% al costo.</p><p>Con volumen: precio = máximo entre precio base × (1 − descuento / 100) y costo ÷ (1 − margen mínimo / 100).</p><p>Los importes se muestran redondeados a pesos. Los cálculos conservan los decimales.</p></details>
      </aside>
    </div>
    {volumeEnabled && <section className="mt-8 rounded-2xl border border-violet-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900 sm:p-7">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Compara tus precios por volumen</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Escenarios para piezas iguales. Elige una cantidad para aplicarla a la cotización.</p>
      {valid ? <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm dark:text-gray-200"><thead><tr className="border-b border-gray-200 dark:border-white/10">{['Cantidad', 'Precio / pieza', 'Descuento efectivo', 'Margen', 'Total', 'Ganancia estimada', ''].map((heading, i) => <th key={i} scope="col" className="whitespace-nowrap p-3">{heading || 'Cotizar'}</th>)}</tr></thead><tbody>
        {[1, 13, 100, 200].map((quantity) => { const row = quoteFor(quantity); return <tr key={quantity} className={n.quantity === quantity ? 'bg-violet-50 dark:bg-violet-500/10' : ''}>
          <th scope="row" className="p-3">{quantity} uds.</th><td className="whitespace-nowrap p-3">{money(row.unit)}</td><td className="p-3">{row.discount.toFixed(2)}%{row.limited && <span className="block text-xs text-amber-700 dark:text-amber-300">Limitado por margen</span>}</td><td className="p-3">{row.margin.toFixed(2)}%</td><td className="whitespace-nowrap p-3">{money(row.unit * quantity)}</td><td className="whitespace-nowrap p-3">{money((row.unit - cost) * quantity)}</td><td className="p-3"><button type="button" onClick={() => { setValues((current) => ({ ...current, quantity: String(quantity) })); setNotice('Cantidad aplicada: ' + quantity + ' unidades.'); }} className="rounded-lg bg-violet-600 px-3 py-2 font-semibold text-white">Aplicar</button></td>
        </tr>; })}
      </tbody></table></div> : <p className="mt-4 text-sm text-violet-600 dark:text-violet-300">Completa los campos y corrige los errores para comparar las escalas.</p>}
      <p className="mt-5 text-xs leading-6 text-gray-500 dark:text-gray-400">Los descuentos de 5%, 8% y 10% y el mínimo de 25% son una propuesta inicial editable, no un estándar del sector. No se asumen ahorros automáticos por fabricar más piezas. Revisa la capacidad y el plazo antes de cotizar. Criterios: <a href="https://help.shopify.com/en/manual/products/details/product-pricing/determine-pricing" target="_blank" rel="noreferrer" className="underline">precios basados en costos y margen (Shopify)</a> y <a href="https://formlabs.com/eu/blog/how-to-calculate-3d-printer-cost/" target="_blank" rel="noreferrer" className="underline">costos de impresión 3D (Formlabs)</a>.</p>
    </section>}
  </div>;
}
