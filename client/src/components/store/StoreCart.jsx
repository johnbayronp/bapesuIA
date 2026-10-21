import React, { useEffect, useRef, useState } from 'react';
import { Minus, Plus, Trash, X, WhatsappLogo, ShoppingCart } from '@phosphor-icons/react';
import { useEcommerce } from '../../context/EcommerceContext';
import { waLink } from '../home/LandingSections';
import { EASE_CLASS, FOCUS, PRIMARY_BTN, formatCOP } from './storeUi';

const EMPTY_FORM = { name: '', city: '', notes: '' };

function buildOrderMessage(cart, total, form) {
  const lines = cart.map((item) => `• ${item.quantity} × ${item.name} (${formatCOP(item.price)} c/u) = ${formatCOP(item.price * item.quantity)}`);
  return [
    'Hola Bapesu, quiero hacer este pedido desde la tienda en línea:',
    '',
    ...lines,
    '',
    `Total: ${formatCOP(total)}`,
    '',
    `Nombre: ${form.name.trim()}`,
    `Ciudad: ${form.city.trim()}`,
    form.notes.trim() ? `Notas: ${form.notes.trim()}` : null,
  ].filter((line) => line !== null).join('\n');
}

export default function StoreCart({ open, onClose }) {
  const { cart, removeFromCart, updateCartQuantity, clearCart, getCartTotal } = useEcommerce();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const total = getCartTotal();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Escribe tu nombre para saber a quién confirmar el pedido.';
    if (form.city.trim().length < 2) nextErrors.city = 'Escribe tu ciudad para calcular el envío.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    window.open(waLink(buildOrderMessage(cart, total, form)), '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  const inputClass = (hasError) => `w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:bg-[#272727] dark:text-white ${hasError ? 'border-red-400' : 'border-gray-300 dark:border-white/15'} ${FOCUS}`;

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} {...(!open && { inert: '' })}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/50 ${EASE_CLASS} ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white outline-none dark:bg-[#181818] ${EASE_CLASS} ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-white/10">
          <h2 id="cart-title" className="text-lg font-semibold text-gray-950 dark:text-white">Tu pedido ({cart.reduce((n, item) => n + item.quantity, 0)})</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar carrito" className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 ${EASE_CLASS} ${FOCUS}`}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300">
              <ShoppingCart size={32} weight="duotone" aria-hidden="true" />
            </span>
            <p className="mt-4 text-base font-semibold text-gray-950 dark:text-white">Tu carrito está vacío</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Agrega productos del catálogo y envíanos el pedido por WhatsApp.</p>
            <button type="button" onClick={onClose} className={`${PRIMARY_BTN} mt-6`}>Ver productos</button>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-3 overflow-y-auto p-4">
              {cart.map((item) => {
                const atMax = item.stock != null && item.quantity >= item.stock;
                return (
                  <li key={item.id} className="flex gap-3 rounded-xl border border-gray-200 p-3 dark:border-white/10">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-[#272727]">
                      {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-950 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{formatCOP(item.price)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity - 1)} aria-label={`Quitar una unidad de ${item.name}`} className={`rounded-lg border border-gray-300 p-1 text-gray-700 hover:bg-gray-100 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10 ${EASE_CLASS} ${FOCUS}`}>
                          <Minus size={16} aria-hidden="true" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-gray-950 dark:text-white" aria-live="polite">{item.quantity}</span>
                        <button type="button" disabled={atMax} onClick={() => updateCartQuantity(item.id, item.quantity + 1)} aria-label={`Agregar una unidad de ${item.name}`} className={`rounded-lg border border-gray-300 p-1 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10 ${EASE_CLASS} ${FOCUS}`}>
                          <Plus size={16} aria-hidden="true" />
                        </button>
                        {atMax && <span className="text-xs text-gray-500 dark:text-gray-400">Máximo disponible</span>}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.id)} aria-label={`Eliminar ${item.name} del carrito`} className={`self-start rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 ${EASE_CLASS} ${FOCUS}`}>
                      <Trash size={16} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>

            <form onSubmit={submit} noValidate className="space-y-3 border-t border-gray-200 p-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total</span>
                <span className="text-xl font-semibold text-gray-950 dark:text-white">{formatCOP(total)}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">El envío se cotiza según tu ciudad. Confirmamos disponibilidad y forma de pago por WhatsApp antes de cobrar.</p>
              <div>
                <label htmlFor="cart-name" className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-200">Nombre</label>
                <input id="cart-name" value={form.name} onChange={(e) => setField('name', e.target.value)} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'cart-name-error' : undefined} className={inputClass(errors.name)} placeholder="Tu nombre" />
                {errors.name && <p id="cart-name-error" className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="cart-city" className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-200">Ciudad</label>
                <input id="cart-city" value={form.city} onChange={(e) => setField('city', e.target.value)} autoComplete="address-level2" aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? 'cart-city-error' : undefined} className={inputClass(errors.city)} placeholder="Ej: Bucaramanga" />
                {errors.city && <p id="cart-city-error" className="mt-1 text-xs text-red-500">{errors.city}</p>}
              </div>
              <div>
                <label htmlFor="cart-notes" className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-200">Notas (opcional)</label>
                <textarea id="cart-notes" rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} className={`${inputClass(false)} resize-none`} placeholder="Color, dirección de entrega, factura…" />
              </div>
              <button type="submit" className={`${PRIMARY_BTN} w-full justify-center`}>
                <WhatsappLogo size={20} weight="fill" aria-hidden="true" />Enviar pedido por WhatsApp
              </button>
              {sent && (
                <p role="status" className="rounded-lg bg-green-50 p-3 text-xs text-green-700 dark:bg-green-500/10 dark:text-green-300">
                  Abrimos WhatsApp con tu pedido. Envía el mensaje y te respondemos con la confirmación.
                  <button type="button" onClick={() => { clearCart(); setSent(false); setForm(EMPTY_FORM); }} className={`ml-1 rounded font-semibold underline ${FOCUS}`}>Vaciar carrito</button>
                </p>
              )}
            </form>
          </>
        )}
      </aside>
    </div>
  );
}
