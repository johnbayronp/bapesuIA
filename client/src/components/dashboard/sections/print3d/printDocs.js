import bapesuLogo from '../../../../assets/logo-light.png';

export const PAYMENT_METHODS = [
  ['EFECTIVO', 'Efectivo'],
  ['TRANSFERENCIA', 'Transferencia'],
  ['NEQUI', 'Nequi'],
  ['DAVIPLATA', 'Daviplata'],
  ['TARJETA', 'Tarjeta'],
  ['OTRO', 'Otro'],
];
export const DOC_TYPES = [['CC', 'Cédula de ciudadanía'], ['NIT', 'NIT'], ['CE', 'Cédula de extranjería'], ['PP', 'Pasaporte'], ['TI', 'Tarjeta de identidad']];
export const docTypeLabel = (id) => DOC_TYPES.find(([key]) => key === id)?.[1] ?? id;
export const paymentLabel = (id) => PAYMENT_METHODS.find(([key]) => key === id)?.[1] ?? id;

export const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(value) || 0);

export const formatDateTime = (value) => new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota',
}).format(new Date(value));

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const saleCode = (sale) => `V-${String(sale.sale_number).padStart(5, '0')}`;

// Abre una ventana con el documento y lanza la impresión cuando cargan las imágenes.
function openPrint(title, body, pageCss) {
  const win = window.open('', '_blank', 'width=480,height=720');
  if (!win) return false;
  const logoUrl = new URL(bapesuLogo, window.location.href).href;
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; }
  .logo { display: block; height: 34px; margin: 0 auto; }
  h1, h2, p { margin: 0; }
  .center { text-align: center; }
  .muted { color: #555; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  table { width: 100%; border-collapse: collapse; }
  ${pageCss}
</style></head><body>${body.replaceAll('{{LOGO}}', esc(logoUrl))}
<script>
  const imgs = Array.from(document.images);
  Promise.all(imgs.map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })))
    .then(() => { window.focus(); window.print(); });
</script></body></html>`);
  win.document.close();
  return true;
}

// Redes sociales: íconos en negro para que se impriman bien en térmicas.
const ICON_INSTAGRAM = '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="#000" stroke="none"/></svg>';
const ICON_TIKTOK = '<svg viewBox="0 0 24 24"><path fill="#000" d="M14.2 2h3.1c.3 2.3 1.8 3.9 4.2 4.1v3.2c-1.6 0-3-.5-4.2-1.3v6.9c0 3.9-3 6.6-6.5 6.6-3.6 0-6.3-2.8-6.3-6.2 0-3.7 3.2-6.6 7.2-6.1v3.3c-.4-.1-.8-.2-1.2-.2-1.6 0-2.9 1.3-2.9 2.9 0 1.7 1.3 2.9 2.9 2.9 1.7 0 3-1.2 3-3.1V2z"/></svg>';
const ICON_YOUTUBE = '<svg viewBox="0 0 24 24"><path fill="#000" d="M22.5 7.2c-.3-1.1-1.1-1.9-2.2-2.2C18.4 4.5 12 4.5 12 4.5s-6.4 0-8.3.5C2.6 5.3 1.8 6.1 1.5 7.2 1 9.1 1 12 1 12s0 2.9.5 4.8c.3 1.1 1.1 1.9 2.2 2.2 1.9.5 8.3.5 8.3.5s6.4 0 8.3-.5c1.1-.3 1.9-1.1 2.2-2.2.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8z"/><path fill="#fff" d="M9.8 15.3V8.7l5.7 3.3z"/></svg>';
const SOCIAL_HANDLE = '@bapesutech';
const socialBlock = (className) => `<div class="${className}">
    <p class="social-title">Síguenos en nuestras redes</p>
    <div class="social-row"><span class="social-icons">${ICON_INSTAGRAM}${ICON_TIKTOK}${ICON_YOUTUBE}</span><strong>${SOCIAL_HANDLE}</strong></div>
    <p class="social-sub">Instagram · TikTok · YouTube</p>
  </div>`;
const SOCIAL_CSS = `
    .social-title { font-size: 10px; }
    .social-row { display: flex; align-items: center; justify-content: center; gap: 2mm; margin-top: 1mm; }
    .social-icons { display: inline-flex; gap: 1.2mm; }
    .social-icons svg { width: 4.2mm; height: 4.2mm; display: block; }
    .social-sub { font-size: 9px; color: #444; margin-top: .5mm; }
`;

export function printReceipt(sale, company) {
  const items = sale.items.map((item) => `
    <tr><td colspan="2" class="desc">${esc(item.description)}</td></tr>
    <tr class="sub"><td>${esc(item.quantity)} × ${money(item.unit_price)}</td><td class="num">${money(item.quantity * item.unit_price)}</td></tr>`).join('');
  const companyLines = [company?.name, company?.nit && `NIT ${company.nit}`, company?.address, company?.phone]
    .filter(Boolean).map((line) => `<p class="center muted">${esc(line)}</p>`).join('');
  const body = `<div class="ticket">
    <img class="logo" src="{{LOGO}}" alt="Bapesu">
    <div class="block">${companyLines}</div>
    <div class="block">
      <div class="row"><strong>Recibo ${saleCode(sale)}</strong>${sale.status === 'VOIDED' ? '<strong>ANULADA</strong>' : ''}</div>
      <p class="muted">${esc(formatDateTime(sale.sold_at))}</p>
      ${sale.client_name ? `<p>Cliente: ${esc(sale.client_name)}</p>` : ''}
    </div>
    <table class="block">${items}</table>
    <div class="block totals">
      <div class="row"><span>Subtotal</span><span>${money(sale.subtotal)}</span></div>
      ${Number(sale.discount) > 0 ? `<div class="row"><span>Descuento</span><span>-${money(sale.discount)}</span></div>` : ''}
      ${sale.is_shipping && sale.shipping?.payment === 'COLLECT'
        ? '<div class="row"><span>Envío</span><span>Al cobro</span></div><p class="muted collect-note">El envío lo pagas a la transportadora al recibir.</p>'
        : Number(sale.shipping_cost) > 0 ? `<div class="row"><span>Envío</span><span>${money(sale.shipping_cost)}</span></div>` : ''}
      <div class="row total"><span>Total</span><span>${money(sale.total)}</span></div>
      <div class="row"><span>Pago</span><span>${esc(paymentLabel(sale.payment_method))}</span></div>
    </div>
    ${sale.notes ? `<p class="block muted">${esc(sale.notes)}</p>` : ''}
    <section class="block thanks-box">
      ${SPOOL_MASCOT}
      <p class="title">${HEART}<span>¡Gracias por tu compra!</span>${HEART}</p>
      <p>Hicimos esta pieza con mucho cuidado para ti. Esperamos que la disfrutes.</p>
      <p class="eco">Nuestros productos están hechos en <strong>PLA</strong>, un material a base de <strong>maíz</strong> y biodegradable.</p>
    </section>
    ${socialBlock('social block center')}
  </div>`;
  return openPrint(`Recibo ${saleCode(sale)}`, body, `
    @page { size: 80mm auto; margin: 4mm; }
    .ticket { width: 72mm; margin: 0 auto; font-size: 12px; padding: 4mm 0; }
    .block { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #999; }
    .desc { padding-top: 4px; font-weight: bold; }
    .sub td { padding-bottom: 4px; color: #333; }
    .num { text-align: right; white-space: nowrap; }
    .totals .row { margin-top: 3px; }
    .total { font-size: 15px; font-weight: bold; margin-top: 6px !important; }
    .thanks-box { text-align: center; font-size: 11px; line-height: 1.35; }
    .thanks-box .mascot { display: block; width: 24mm; height: 27mm; margin: 0 auto 2mm; }
    .thanks-box .title { display: flex; align-items: center; justify-content: center; gap: 1.2mm; font-size: 14px; font-weight: bold; margin-bottom: 1.5mm; white-space: nowrap; }
    .thanks-box .heart { width: 3.4mm; height: 3.4mm; flex-shrink: 0; }
    .thanks-box .eco { margin-top: 2mm; }
    .collect-note { font-size: 10px; text-align: right; }
    .social strong { font-size: 13px; }
    ${SOCIAL_CSS}
  `);
}

// Carrete de filamento con carita y corazones, en línea negra sobre blanco (imprime bien en térmicas).
const heartPath = (x, y, k) => `M${x} ${y + 7 * k} C${x - 6 * k} ${y + 2 * k} ${x - 8 * k} ${y - 1 * k} ${x - 8 * k} ${y - 4 * k} C${x - 8 * k} ${y - 7 * k} ${x - 5.5 * k} ${y - 9 * k} ${x - 3.5 * k} ${y - 9 * k} C${x - 2 * k} ${y - 9 * k} ${x - 0.6 * k} ${y - 8 * k} ${x} ${y - 6.5 * k} C${x + 0.6 * k} ${y - 8 * k} ${x + 2 * k} ${y - 9 * k} ${x + 3.5 * k} ${y - 9 * k} C${x + 5.5 * k} ${y - 9 * k} ${x + 8 * k} ${y - 7 * k} ${x + 8 * k} ${y - 4 * k} C${x + 8 * k} ${y - 1 * k} ${x + 6 * k} ${y + 2 * k} ${x} ${y + 7 * k} Z`;
const SPOOL_MASCOT = `<svg class="mascot" viewBox="0 0 96 110" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 58 L6 50 M70 58 L80 64"/>
  <path d="M34 84 L31 100 L24 102 M54 84 L57 100 L64 102"/>
  <circle cx="44" cy="56" r="31" fill="#fff"/>
  <g stroke-width="1.2"><circle cx="44" cy="56" r="27"/><circle cx="44" cy="56" r="23.5"/><circle cx="44" cy="56" r="20"/></g>
  <circle cx="44" cy="56" r="16" fill="#fff"/>
  <circle cx="38.5" cy="53" r="2.4" fill="#000" stroke="none"/><circle cx="49.5" cy="53" r="2.4" fill="#000" stroke="none"/>
  <path d="M38 60 Q44 66 50 60"/>
  <path d="${heartPath(33, 59, 0.32)}" fill="#000" stroke="none"/><path d="${heartPath(55, 59, 0.32)}" fill="#000" stroke="none"/>
  <path d="M74 50 C84 46 86 36 80 30 C76 26 78 20 82 18"/>
  <path d="${heartPath(84, 11, 0.75)}" fill="#000" stroke="none"/>
  <path d="${heartPath(14, 18, 0.9)}" fill="#000" stroke="none"/>
  <path d="${heartPath(36, 10, 0.55)}" stroke-width="1.6"/>
  <path d="${heartPath(60, 14, 0.5)}" fill="#000" stroke="none"/>
  <path d="${heartPath(8, 82, 0.55)}" stroke-width="1.6"/>
  <path d="${heartPath(86, 84, 0.65)}" fill="#000" stroke="none"/>
</svg>`;

const HEART = '<svg class="heart" viewBox="0 0 24 22" xmlns="http://www.w3.org/2000/svg"><path d="M12 21 C5 15 1 11 1 6.5 C1 3.4 3.4 1 6.4 1 C8.6 1 10.8 2.3 12 4.3 C13.2 2.3 15.4 1 17.6 1 C20.6 1 23 3.4 23 6.5 C23 11 19 15 12 21 Z" fill="#000"/></svg>';

export function printShippingLabel(sale, company) {
  const s = sale.shipping || {};
  const body = `<div class="label">
    <div class="head">
      <img class="logo" src="{{LOGO}}" alt="Bapesu">
      <div class="code"><span>Pedido</span><strong>${saleCode(sale)}</strong></div>
    </div>
    ${s.payment === 'COLLECT' ? '<div class="collect"><strong>ENVÍO AL COBRO</strong><span>El destinatario paga el envío al recibir</span></div>' : ''}
    <section class="to">
      <p class="tag">Destinatario</p>
      <h2>${esc(s.recipient)}</h2>
      <p class="big">${esc(s.address)}</p>
      <p class="big">${esc([s.city, s.department].filter(Boolean).join(', '))}</p>
      <p>Tel: ${esc(s.phone)}</p>
      ${s.reference ? `<p class="muted">Ref: ${esc(s.reference)}</p>` : ''}
    </section>
    <section class="from">
      <p class="tag">Remitente</p>
      <p><strong>${esc(company?.name || 'Bapesu')}</strong></p>
      ${company?.address || company?.city ? `<p>${esc([company?.address, company?.city].filter(Boolean).join(', '))}</p>` : ''}
      ${company?.phone ? `<p>Tel: ${esc(company.phone)}</p>` : ''}
    </section>
    <section class="thanks">
      ${SPOOL_MASCOT}
      <div class="thanks-text">
        <p class="title">${HEART}<span>¡Gracias por tu pedido!</span>${HEART}</p>
        <p>Hicimos esta pieza con mucho cuidado para ti. Esperamos que la disfrutes.</p>
        <p class="eco">Nuestros productos están hechos en <strong>PLA</strong>, un material a base de <strong>maíz</strong> y biodegradable.</p>
      </div>
    </section>
    ${socialBlock('social social-label')}
  </div>`;
  return openPrint(`Rótulo ${saleCode(sale)}`, body, `
    @page { size: 100mm 150mm; margin: 0; }
    .label { width: 100mm; height: 150mm; padding: 6mm; display: flex; flex-direction: column; gap: 3.5mm; overflow: hidden; border: 1px solid #000; }
    .head { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 3mm; }
    .head .logo { margin: 0; height: 30px; }
    .code { text-align: right; font-size: 11px; }
    .code strong { display: block; font-size: 18px; }
    .collect { background: #000; color: #fff; text-align: center; padding: 1.5mm; border-radius: 2mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .collect strong { display: block; font-size: 15px; letter-spacing: .06em; }
    .collect span { font-size: 10px; }
    .tag { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; color: #555; margin-bottom: 2mm; }
    .to h2 { font-size: 18px; margin-bottom: 1.5mm; }
    .to p { font-size: 13px; margin-top: 1mm; }
    .to .big { font-size: 15px; font-weight: bold; }
    .from { font-size: 11px; border-top: 1px dashed #999; padding-top: 2.5mm; }
    .from p { margin-top: 1mm; }
    .thanks { margin-top: auto; display: flex; align-items: center; gap: 3mm; border: 2px solid #111; border-radius: 4mm; padding: 2.5mm 3mm; font-size: 10px; line-height: 1.3; }
    .mascot { width: 21mm; height: 24mm; flex-shrink: 0; }
    .thanks-text { flex: 1; text-align: center; }
    .thanks .title { display: flex; align-items: center; justify-content: center; gap: 1.2mm; font-size: 13px; font-weight: bold; margin-bottom: 1.5mm; white-space: nowrap; }
    .heart { width: 3.4mm; height: 3.4mm; flex-shrink: 0; }
    .eco { margin-top: 2mm; padding-top: 2mm; border-top: 1px dashed #777; }
    .social-label { text-align: center; margin-top: -1mm; }
    .social-label strong { font-size: 14px; }
    ${SOCIAL_CSS}
    .muted { color: #555; }
  `);
}
