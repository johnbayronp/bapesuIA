import { useCallback, useEffect, useState } from 'react';
import { posSalesApi } from '../../../api';
import { useCompany } from '../../../context/CompanyContext';
import { Print3DCalculatorView } from '../../tools/Print3DCalculator';
import Print3DPos from './print3d/Print3DPos';
import EinvoiceList from './print3d/EinvoiceList';

const TABS = [
  ['calculator', 'Calculadora'],
  ['pos', 'Ventas (POS)'],
  ['einvoice', 'Facturación electrónica'],
];

let calcSeq = 0;

export default function Print3DModule() {
  const { company } = useCompany();
  const [tab, setTab] = useState('calculator');
  // La venta en curso vive aquí para que la calculadora pueda agregarle piezas.
  const [cart, setCart] = useState([]);
  // Sube cada vez que cambia algo de facturación, para recargar la lista y el contador.
  const [einvoiceVersion, setEinvoiceVersion] = useState(0);
  const [pendingEinvoices, setPendingEinvoices] = useState(0);

  const bumpEinvoices = useCallback(() => setEinvoiceVersion((v) => v + 1), []);

  useEffect(() => {
    if (!company?.id) return;
    posSalesApi.countPendingEinvoices(company.id).then(({ count, error }) => {
      if (!error) setPendingEinvoices(count ?? 0);
    });
  }, [company?.id, einvoiceVersion]);

  const addFromCalculator = ({ description, quantity, unitPrice, unitCost }) => {
    setCart((current) => [...current, { key: `c${++calcSeq}`, description, quantity, unitPrice, unitCost, source: 'calculator' }]);
    setTab('pos');
  };

  const badge = (id) => {
    if (id === 'pos' && cart.length > 0) return <span className="ml-2 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{cart.length}</span>;
    if (id === 'einvoice' && pendingEinvoices > 0) return <span className="ml-2 rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold text-white" title="Facturas pendientes">{pendingEinvoices}</span>;
    return null;
  };

  return (
    <div>
      <div role="tablist" aria-label="Impresión 3D" className="mb-6 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 sm:inline-flex">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${tab === id ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {label}{badge(id)}
          </button>
        ))}
      </div>
      {/* Las pestañas quedan montadas para no perder lo que se está escribiendo. */}
      <div hidden={tab !== 'calculator'}><Print3DCalculatorView embedded onAddToSale={addFromCalculator} /></div>
      <div hidden={tab !== 'pos'}><Print3DPos cart={cart} setCart={setCart} onSaleRegistered={bumpEinvoices} /></div>
      <div hidden={tab !== 'einvoice'}><EinvoiceList refreshKey={einvoiceVersion} onChange={bumpEinvoices} /></div>
    </div>
  );
}
