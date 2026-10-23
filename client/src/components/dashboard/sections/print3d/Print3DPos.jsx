import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientsApi, inventoryApi, posSalesApi } from '../../../../api';
import { useCompany } from '../../../../context/CompanyContext';
import { queryKeys } from '../../../../lib/queryKeys';
import { EMPTY_ARRAY, unwrapSupabaseResponse } from '../../../../lib/queryUtils';
import { DOC_TYPES, PAYMENT_METHODS, formatDateTime, money, paymentLabel, printReceipt, printShippingLabel } from './printDocs';

const inputClass = 'mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20';
const labelClass = 'block text-xs font-semibold text-gray-700';
const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;
const emptyLine = { description: '', quantity: '1', unitPrice: '', unitCost: '' };
// payment: PREPAID = el envío se cobra en esta venta · COLLECT = al cobro, el cliente lo paga al recibir.
const emptyEinvoice = { docType: 'CC', docNumber: '', name: '', email: '', phone: '', address: '', city: '' };
const emptyShipping = { recipient: '', phone: '', address: '', city: '', department: '', reference: '', payment: 'PREPAID' };

// Fechas en hora de Colombia (UTC-5, sin horario de verano).
const todayBogota = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const monthStartBogota = () => `${todayBogota().slice(0, 8)}01`;
const dayStartIso = (date) => new Date(`${date}T00:00:00-05:00`).toISOString();
const nextDayIso = (date) => new Date(new Date(`${date}T00:00:00-05:00`).getTime() + 86400000).toISOString();

let lineSeq = 0;
const newLine = (data) => ({ key: `l${++lineSeq}`, ...data });

/** cart/setCart viven en el módulo padre para que la calculadora pueda agregar piezas. */
export default function Print3DPos({ cart, setCart, onSaleRegistered }) {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchMsg, setSearchMsg] = useState('');
  const searchRef = useRef(null);
  const [draft, setDraft] = useState(emptyLine);
  const [discount, setDiscount] = useState('0');
  const [payment, setPayment] = useState('EFECTIVO');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [isShipping, setIsShipping] = useState(false);
  const [shipping, setShipping] = useState(emptyShipping);
  const [shippingCost, setShippingCost] = useState('0');
  const [requiresEinvoice, setRequiresEinvoice] = useState(false);
  const [einvoice, setEinvoice] = useState(emptyEinvoice);
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSale, setLastSale] = useState(null);

  const [range, setRange] = useState({ from: todayBogota(), to: todayBogota() });
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    if (!company?.id) return;
    clientsApi.listForSelect(company.id, 'id, name, nit, email, phone, address, city')
      .then(({ data }) => setClients(data ?? []));
  }, [company?.id]);

  // Mismo caché que el módulo Inventario: al vender, ambos ven el stock actualizado.
  const productsQuery = useQuery({
    queryKey: queryKeys.company.inventory.products(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => inventoryApi.listProducts(company.id).then(unwrapSupabaseResponse),
  });
  const products = (productsQuery.data ?? EMPTY_ARRAY).filter((p) => p.is_active !== false);
  const refreshInventory = () => queryClient.invalidateQueries({ queryKey: queryKeys.company.inventory.root(company?.id) });

  const norm = (value) => String(value ?? '').trim().toLowerCase();
  const term = norm(search);
  const suggestions = term
    ? products.filter((p) => [p.name, p.sku, p.barcode].some((v) => norm(v).includes(term))).slice(0, 8)
    : [];

  const addProduct = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) return current.map((item) => (item === existing ? { ...item, quantity: item.quantity + 1 } : item));
      return [...current, newLine({
        productId: product.id,
        sku: product.sku ?? '',
        description: product.name,
        quantity: 1,
        unitPrice: Number(product.sale_price) || 0,
        unitCost: Number(product.purchase_price) || 0,
        source: 'inventory',
      })];
    });
    setSearch('');
    setSearchMsg(`Agregado: ${product.name}`);
    setError('');
    searchRef.current?.focus();
  };

  // Los lectores de código de barras escriben el código y presionan Enter.
  const onSearchKey = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!term) return;
    const exact = products.find((p) => norm(p.sku) === term || norm(p.barcode) === term);
    if (exact) return addProduct(exact);
    if (suggestions.length === 1) return addProduct(suggestions[0]);
    setSearchMsg(suggestions.length ? 'Hay varias coincidencias: elige una de la lista.' : `No hay ningún producto con "${search.trim()}" en el inventario.`);
  };

  const loadSales = useCallback(async () => {
    if (!company?.id) return;
    setLoadingSales(true);
    setHistoryError('');
    const { data, error: err } = await posSalesApi.list(company.id, { from: dayStartIso(range.from), to: nextDayIso(range.to) });
    if (err) setHistoryError(err.message?.includes('bapesu_pos_sales') ? 'Falta crear o actualizar la tabla de ventas: ejecuta database/pos_sales_module.sql en Supabase.' : err.message);
    else setSales(data ?? []);
    setLoadingSales(false);
  }, [company?.id, range.from, range.to]);

  useEffect(() => { loadSales(); }, [loadSales]);

  // ── Venta actual ──
  const stockOf = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? Number(product.stock_available) || 0 : null;
  };
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const discountN = Number(discount) || 0;
  const shippingCollect = isShipping && shipping.payment === 'COLLECT';
  const shippingN = isShipping && !shippingCollect ? Number(shippingCost) || 0 : 0;
  const total = Math.max(subtotal - discountN, 0) + shippingN;
  const profit = subtotal - discountN - totalCost;

  const addDraft = () => {
    const quantity = Number(draft.quantity);
    const unitPrice = Number(draft.unitPrice);
    const unitCost = draft.unitCost === '' ? 0 : Number(draft.unitCost);
    if (!draft.description.trim()) return setError('Escribe la descripción del producto.');
    if (!Number.isInteger(quantity) || quantity < 1) return setError('La cantidad debe ser un número entero mayor que cero.');
    if (!(unitPrice >= 0) || draft.unitPrice === '') return setError('Ingresa un precio válido.');
    if (!(unitCost >= 0)) return setError('Ingresa un costo válido o déjalo vacío.');
    setCart((current) => [...current, newLine({ description: draft.description.trim(), quantity, unitPrice, unitCost, source: 'manual' })]);
    setDraft(emptyLine);
    setError('');
  };

  const updateLine = (key, field, value) => setCart((current) => current.map((item) => (
    item.key === key ? { ...item, [field]: field === 'description' ? value : Number(value) } : item
  )));

  const chooseClient = (id) => {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    setClientName(client?.name ?? '');
    if (client) {
      setShipping((current) => ({
        ...current,
        recipient: current.recipient || client.name || '',
        phone: current.phone || client.phone || '',
        address: current.address || client.address || '',
        city: current.city || client.city || '',
      }));
      setEinvoice((current) => ({
        ...current,
        name: current.name || client.name || '',
        docNumber: current.docNumber || client.nit || '',
        email: current.email || client.email || '',
        phone: current.phone || client.phone || '',
        address: current.address || client.address || '',
        city: current.city || client.city || '',
      }));
    }
  };

  const resetSale = () => {
    setCart([]); setDraft(emptyLine); setDiscount('0'); setPayment('EFECTIVO');
    setClientId(''); setClientName(''); setNotes(''); setIsShipping(false);
    setShipping(emptyShipping); setShippingCost('0'); setError('');
    setRequiresEinvoice(false); setEinvoice(emptyEinvoice);
  };

  const registerSale = async () => {
    setError('');
    if (!company?.id) return setError('No tienes empresa asociada.');
    if (cart.length === 0) return setError('Agrega al menos un producto.');
    if (cart.some((item) => !item.description.trim() || !Number.isInteger(item.quantity) || item.quantity < 1 || !(item.unitPrice >= 0) || !(item.unitCost >= 0))) {
      return setError('Revisa los productos: descripción, cantidad entera y precios válidos.');
    }
    if (!(discountN >= 0) || discountN > subtotal) return setError('El descuento no puede ser negativo ni mayor que el subtotal.');
    if (isShipping) {
      if (!(shippingN >= 0)) return setError('Ingresa un costo de envío válido.');
      const missing = ['recipient', 'phone', 'address', 'city'].filter((key) => !shipping[key].trim());
      if (missing.length) return setError('Completa los datos de envío: nombre, teléfono, dirección y ciudad.');
    }
    if (requiresEinvoice) {
      if (!einvoice.docNumber.trim() || !einvoice.name.trim() || !einvoice.email.trim()) {
        return setError('Para la factura electrónica completa documento, nombre o razón social y correo.');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(einvoice.email.trim())) return setError('El correo para la factura electrónica no es válido.');
    }
    setSaving(true);
    const payload = {
      company_id: company.id,
      client_id: clientId || null,
      client_name: clientName.trim() || null,
      items: cart.map((item) => ({
        description: item.description.trim(),
        quantity: item.quantity,
        ...(item.productId ? { product_id: item.productId, sku: item.sku || null } : {}),
        unit_price: round2(item.unitPrice),
        unit_cost: round2(item.unitCost),
        source: item.source,
      })),
      subtotal: round2(subtotal),
      discount: round2(discountN),
      shipping_cost: round2(shippingN),
      total: round2(total),
      total_cost: round2(totalCost),
      payment_method: payment,
      is_shipping: isShipping,
      shipping: isShipping ? Object.fromEntries(Object.entries(shipping).map(([k, v]) => [k, v.trim()])) : null,
      notes: notes.trim() || null,
      requires_einvoice: requiresEinvoice,
      einvoice_data: requiresEinvoice ? Object.fromEntries(Object.entries(einvoice).map(([k, v]) => [k, v.trim()])) : null,
      einvoice_status: requiresEinvoice ? 'PENDING' : null,
    };
    const { data, error: err } = await posSalesApi.create(payload);
    setSaving(false);
    if (err) return setError(err.message?.includes('bapesu_pos_sales') ? 'Falta crear o actualizar la tabla de ventas: ejecuta database/pos_sales_module.sql en Supabase.' : err.message);
    setLastSale(data);
    resetSale();
    loadSales();
    if (payload.items.some((item) => item.product_id)) refreshInventory();
    if (payload.requires_einvoice) onSaleRegistered?.();
  };

  const voidSale = async (sale) => {
    if (!window.confirm(`¿Anular la venta V-${String(sale.sale_number).padStart(5, '0')}? Dejará de contar en los totales.`)) return;
    const { data, error: err } = await posSalesApi.void(sale.id);
    if (err) return setHistoryError(err.message);
    setSales((current) => current.map((s) => (s.id === sale.id ? data : s)));
    if (sale.items.some((item) => item.product_id)) refreshInventory();
    if (sale.requires_einvoice) onSaleRegistered?.();
    if (lastSale?.id === sale.id) setLastSale(data);
  };

  const doPrint = (fn, sale) => {
    if (!fn(sale, company)) setHistoryError('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio.');
  };

  // ── Resumen del periodo ──
  const summary = useMemo(() => {
    const done = sales.filter((s) => s.status === 'COMPLETED');
    const byMethod = {};
    done.forEach((s) => { byMethod[s.payment_method] = (byMethod[s.payment_method] || 0) + Number(s.total); });
    return {
      count: done.length,
      total: done.reduce((sum, s) => sum + Number(s.total), 0),
      profit: done.reduce((sum, s) => sum + Number(s.subtotal) - Number(s.discount) - Number(s.total_cost), 0),
      shipments: done.filter((s) => s.is_shipping).length,
      byMethod,
    };
  }, [sales]);

  const presets = [
    ['Hoy', { from: todayBogota(), to: todayBogota() }],
    ['Este mes', { from: monthStartBogota(), to: todayBogota() }],
  ];

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ── Productos ── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-bold text-gray-900">Nueva venta</h2>
          <p className="mt-1 text-xs text-gray-500">Busca en el inventario o escanea el código de barras, agrega piezas a mano o desde la Calculadora.</p>

          <div className="relative mt-4">
            <label htmlFor="pos-search" className={labelClass}>Producto del inventario (nombre, SKU o código de barras)</label>
            <input id="pos-search" ref={searchRef} autoComplete="off" className={inputClass + ' text-base'} value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchMsg(''); }} onKeyDown={onSearchKey}
              placeholder={productsQuery.isLoading ? 'Cargando inventario…' : 'Escanea o escribe y presiona Enter'} />
            {suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {suggestions.map((p) => {
                  const stock = Number(p.stock_available) || 0;
                  return (
                    <li key={p.id}>
                      <button type="button" onClick={() => addProduct(p)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-violet-50">
                        <span className="min-w-0"><span className="block truncate font-semibold text-gray-900">{p.name}</span>
                          <span className="text-xs text-gray-500">{p.sku ? `SKU ${p.sku}` : 'Sin SKU'} · <span className={stock > 0 ? '' : 'text-rose-600'}>Stock {stock}</span></span></span>
                        <span className="whitespace-nowrap font-bold text-violet-700">{money(p.sale_price)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {searchMsg && <p role="status" className="mt-1 text-xs text-violet-700">{searchMsg}</p>}
          </div>

          {cart.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-gray-200 text-xs text-gray-500">
                  <th className="py-2 pr-2">Producto</th><th className="p-2">Cant.</th><th className="p-2">Precio unit.</th><th className="p-2">Costo unit.</th><th className="p-2 text-right">Total</th><th />
                </tr></thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.key} className="border-b border-gray-100 align-top">
                      <td className="py-2 pr-2"><input aria-label="Descripción" className={inputClass + ' min-w-[10rem]'} value={item.description} onChange={(e) => updateLine(item.key, 'description', e.target.value)} />
                        {item.source === 'calculator' && <span className="mt-1 inline-block rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Desde calculadora</span>}
                        {item.productId && <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Inventario{item.sku ? ` · ${item.sku}` : ''}</span>}
                        {item.productId && stockOf(item.productId) !== null && item.quantity > stockOf(item.productId) && (
                          <span className="mt-1 block text-[11px] font-semibold text-amber-700">Solo hay {stockOf(item.productId)} en stock</span>
                        )}</td>
                      <td className="p-2"><input aria-label="Cantidad" type="number" min="1" step="1" className={inputClass + ' w-20'} value={item.quantity} onChange={(e) => updateLine(item.key, 'quantity', e.target.value)} /></td>
                      <td className="p-2"><input aria-label="Precio unitario" type="number" min="0" className={inputClass + ' w-28'} value={round2(item.unitPrice)} onChange={(e) => updateLine(item.key, 'unitPrice', e.target.value)} /></td>
                      <td className="p-2"><input aria-label="Costo unitario" type="number" min="0" className={inputClass + ' w-28'} value={round2(item.unitCost)} onChange={(e) => updateLine(item.key, 'unitCost', e.target.value)} /></td>
                      <td className="whitespace-nowrap p-2 pt-4 text-right font-semibold">{money(item.quantity * item.unitPrice)}</td>
                      <td className="p-2 pt-3"><button type="button" onClick={() => setCart((c) => c.filter((x) => x.key !== item.key))} className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">Quitar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Aún no hay productos en esta venta.</p>
          )}

          <div className="mt-5 rounded-xl bg-violet-50 p-4">
            <p className="text-xs font-bold text-violet-800">Agregar producto manual</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-[2fr_0.7fr_1fr_1fr_auto] sm:items-end">
              <label className={labelClass}>Descripción<input className={inputClass} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Ej. Llavero personalizado" /></label>
              <label className={labelClass}>Cant.<input type="number" min="1" step="1" className={inputClass} value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} /></label>
              <label className={labelClass}>Precio unit.<input type="number" min="0" className={inputClass} value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: e.target.value })} /></label>
              <label className={labelClass}>Costo unit. (opcional)<input type="number" min="0" className={inputClass} value={draft.unitCost} onChange={(e) => setDraft({ ...draft, unitCost: e.target.value })} /></label>
              <button type="button" onClick={addDraft} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700">Agregar</button>
            </div>
          </div>

          {/* ── Envío ── */}
          <div className="mt-5 rounded-xl border border-gray-200 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-gray-800">
              <input type="checkbox" checked={isShipping} onChange={(e) => setIsShipping(e.target.checked)} />
              Es un envío (se imprimirá el rótulo)
            </label>
            {isShipping && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>Nombre de quien recibe *<input className={inputClass} value={shipping.recipient} onChange={(e) => setShipping({ ...shipping, recipient: e.target.value })} /></label>
                <label className={labelClass}>Teléfono *<input type="tel" className={inputClass} value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} /></label>
                <label className={labelClass + ' sm:col-span-2'}>Dirección *<input className={inputClass} value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} placeholder="Calle, número, barrio, apto" /></label>
                <label className={labelClass}>Ciudad *<input className={inputClass} value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} /></label>
                <label className={labelClass}>Departamento<input className={inputClass} value={shipping.department} onChange={(e) => setShipping({ ...shipping, department: e.target.value })} /></label>
                <label className={labelClass}>Indicaciones / referencia<input className={inputClass} value={shipping.reference} onChange={(e) => setShipping({ ...shipping, reference: e.target.value })} /></label>
                <fieldset className="sm:col-span-2">
                  <legend className={labelClass}>¿Cómo se paga el envío?</legend>
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">
                    {[['PREPAID', 'Cobrado en esta venta', 'Se suma al total que paga el cliente ahora.'], ['COLLECT', 'Al cobro', 'El cliente le paga el envío a la transportadora al recibir.']].map(([id, title, hint]) => (
                      <label key={id} className={`flex cursor-pointer gap-2 rounded-xl border p-3 text-sm ${shipping.payment === id ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="shipping-payment" className="mt-0.5" checked={shipping.payment === id} onChange={() => setShipping({ ...shipping, payment: id })} />
                        <span><span className="block font-semibold text-gray-900">{title}</span><span className="text-xs text-gray-500">{hint}</span></span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {!shippingCollect && <label className={labelClass}>Costo del envío cobrado (COP)<input type="number" min="0" className={inputClass} value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} /></label>}
              </div>
            )}
          </div>

          {/* ── Factura electrónica ── */}
          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-gray-800">
              <input type="checkbox" checked={requiresEinvoice} onChange={(e) => setRequiresEinvoice(e.target.checked)} />
              El cliente requiere factura electrónica
            </label>
            {requiresEinvoice && (
              <>
                <p className="mt-2 text-xs text-gray-500">Quedará en la pestaña “Facturación electrónica” como pendiente hasta que la envíes.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className={labelClass}>Tipo de documento
                    <select className={inputClass} value={einvoice.docType} onChange={(e) => setEinvoice({ ...einvoice, docType: e.target.value })}>
                      {DOC_TYPES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                    </select>
                  </label>
                  <label className={labelClass}>Número de documento *<input className={inputClass} value={einvoice.docNumber} onChange={(e) => setEinvoice({ ...einvoice, docNumber: e.target.value })} placeholder={einvoice.docType === 'NIT' ? '900123456-7' : '1234567890'} /></label>
                  <label className={labelClass + ' sm:col-span-2'}>{einvoice.docType === 'NIT' ? 'Razón social *' : 'Nombre completo *'}<input className={inputClass} value={einvoice.name} onChange={(e) => setEinvoice({ ...einvoice, name: e.target.value })} /></label>
                  <label className={labelClass}>Correo para la factura *<input type="email" className={inputClass} value={einvoice.email} onChange={(e) => setEinvoice({ ...einvoice, email: e.target.value })} placeholder="cliente@correo.com" /></label>
                  <label className={labelClass}>Teléfono<input type="tel" className={inputClass} value={einvoice.phone} onChange={(e) => setEinvoice({ ...einvoice, phone: e.target.value })} /></label>
                  <label className={labelClass}>Dirección<input className={inputClass} value={einvoice.address} onChange={(e) => setEinvoice({ ...einvoice, address: e.target.value })} /></label>
                  <label className={labelClass}>Ciudad<input className={inputClass} value={einvoice.city} onChange={(e) => setEinvoice({ ...einvoice, city: e.target.value })} /></label>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Cobro ── */}
        <aside className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
          <h2 className="text-base font-bold text-gray-900">Cobro</h2>
          <div className="mt-4 space-y-3">
            <label className={labelClass}>Cliente (opcional)
              <select className={inputClass} value={clientId} onChange={(e) => chooseClient(e.target.value)}>
                <option value="">Sin cliente registrado</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            {!clientId && <label className={labelClass}>Nombre del cliente (opcional)<input className={inputClass} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Cliente de mostrador" /></label>}
            <label className={labelClass}>Método de pago
              <select className={inputClass} value={payment} onChange={(e) => setPayment(e.target.value)}>
                {PAYMENT_METHODS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            <label className={labelClass}>Descuento (COP)<input type="number" min="0" className={inputClass} value={discount} onChange={(e) => setDiscount(e.target.value)} /></label>
            <label className={labelClass}>Notas<input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" /></label>
          </div>
          <dl className="mt-5 space-y-2 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd className="font-semibold">{money(subtotal)}</dd></div>
            {discountN > 0 && <div className="flex justify-between"><dt className="text-gray-500">Descuento</dt><dd className="font-semibold">-{money(discountN)}</dd></div>}
            {isShipping && <div className="flex justify-between"><dt className="text-gray-500">Envío</dt><dd className="font-semibold">{shippingCollect ? 'Al cobro' : money(shippingN)}</dd></div>}
            <div className="flex justify-between text-lg font-extrabold text-gray-900"><dt>Total</dt><dd>{money(total)}</dd></div>
            <div className="flex justify-between text-xs text-gray-500"><dt>Costo de productos</dt><dd>{money(totalCost)}</dd></div>
            <div className={`flex justify-between text-sm font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}><dt>Ganancia</dt><dd>{money(profit)}</dd></div>
          </dl>
          {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          <button type="button" disabled={saving || cart.length === 0} onClick={registerSale} className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40">
            {saving ? 'Registrando…' : `Registrar venta · ${money(total)}`}
          </button>
          {cart.length > 0 && <button type="button" onClick={resetSale} className="mt-2 w-full rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50">Vaciar venta</button>}

          {lastSale && (
            <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-bold">Venta V-{String(lastSale.sale_number).padStart(5, '0')} registrada · {money(lastSale.total)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => doPrint(printReceipt, lastSale)} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm">Imprimir recibo</button>
                {lastSale.is_shipping && <button type="button" onClick={() => doPrint(printShippingLabel, lastSale)} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm">Imprimir rótulo</button>}
                <button type="button" onClick={() => setLastSale(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700">Cerrar</button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Historial ── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Ventas realizadas</h2>
            <p className="mt-1 text-xs text-gray-500">Las ventas anuladas se muestran pero no suman en los totales.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {presets.map(([label, value]) => (
              <button key={label} type="button" onClick={() => setRange(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${range.from === value.from && range.to === value.to ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{label}</button>
            ))}
            <label className={labelClass}>Desde<input type="date" className={inputClass} value={range.from} max={range.to} onChange={(e) => e.target.value && setRange({ ...range, from: e.target.value })} /></label>
            <label className={labelClass}>Hasta<input type="date" className={inputClass} value={range.to} min={range.from} onChange={(e) => e.target.value && setRange({ ...range, to: e.target.value })} /></label>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Ventas', summary.count.toLocaleString('es-CO')],
            ['Total vendido', money(summary.total)],
            ['Ganancia', money(summary.profit)],
            ['Envíos', summary.shipments.toLocaleString('es-CO')],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-lg font-extrabold text-gray-900">{value}</p></div>
          ))}
        </div>
        {Object.keys(summary.byMethod).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(summary.byMethod).map(([method, value]) => (
              <span key={method} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">{paymentLabel(method)}: {money(value)}</span>
            ))}
          </div>
        )}

        {historyError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{historyError}</p>}
        {loadingSales ? <p className="mt-5 text-sm text-gray-500">Cargando ventas…</p> : sales.length === 0 ? (
          <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No hay ventas en este periodo.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-gray-200 text-xs text-gray-500">
                {['N.º', 'Fecha', 'Cliente', 'Productos', 'Pago', 'Total', 'Ganancia', ''].map((h, i) => <th key={i} className="whitespace-nowrap p-2">{h}</th>)}
              </tr></thead>
              <tbody>
                {sales.map((sale) => {
                  const voided = sale.status === 'VOIDED';
                  const saleProfit = Number(sale.subtotal) - Number(sale.discount) - Number(sale.total_cost);
                  return (
                    <tr key={sale.id} className={`border-b border-gray-100 ${voided ? 'text-gray-400' : ''}`}>
                      <td className="whitespace-nowrap p-2 font-semibold">V-{String(sale.sale_number).padStart(5, '0')}{voided && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">ANULADA</span>}</td>
                      <td className="whitespace-nowrap p-2">{formatDateTime(sale.sold_at)}</td>
                      <td className="p-2">{sale.client_name || '—'}{sale.is_shipping && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{sale.shipping?.payment === 'COLLECT' ? 'Envío al cobro' : 'Envío'}</span>}
                        {sale.requires_einvoice && <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">{sale.einvoice_status === 'SENT' ? 'FE enviada' : 'FE pendiente'}</span>}</td>
                      <td className="p-2 text-xs">{sale.items.map((it) => `${it.quantity}× ${it.description}`).join(', ')}</td>
                      <td className="whitespace-nowrap p-2">{paymentLabel(sale.payment_method)}</td>
                      <td className={`whitespace-nowrap p-2 font-semibold ${voided ? 'line-through' : ''}`}>{money(sale.total)}</td>
                      <td className={`whitespace-nowrap p-2 ${voided ? 'line-through' : saleProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{money(saleProfit)}</td>
                      <td className="whitespace-nowrap p-2 text-right">
                        <button type="button" onClick={() => doPrint(printReceipt, sale)} className="rounded-lg px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50">Recibo</button>
                        {sale.is_shipping && <button type="button" onClick={() => doPrint(printShippingLabel, sale)} className="rounded-lg px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50">Rótulo</button>}
                        {!voided && <button type="button" onClick={() => voidSale(sale)} className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">Anular</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
