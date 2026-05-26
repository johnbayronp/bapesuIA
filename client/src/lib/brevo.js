const API_KEY       = import.meta.env.VITE_BREVO_API_KEY;
const WA_SENDER     = import.meta.env.VITE_BREVO_WHATSAPP_SENDER;
const SENDER_NAME   = import.meta.env.VITE_BREVO_SENDER_NAME  ?? 'Bapesu tech';
const SENDER_EMAIL  = import.meta.env.VITE_BREVO_SENDER_EMAIL ?? '';

const BASE = 'https://api.brevo.com/v3';

const headers = () => ({
  'accept':       'application/json',
  'content-type': 'application/json',
  'api-key':      API_KEY,
});

// ── Email transaccional ───────────────────────────────────────────────
/**
 * @param {{ to: string, toName?: string, subject: string, html: string }} opts
 */
export async function sendEmail({ to, toName, subject, html }) {
  if (!API_KEY)        throw new Error('Falta VITE_BREVO_API_KEY en el .env');
  if (!SENDER_EMAIL)   throw new Error('Falta VITE_BREVO_SENDER_EMAIL en el .env');

  const res = await fetch(`${BASE}/smtp/email`, {
    method:  'POST',
    headers: headers(),
    body: JSON.stringify({
      sender:      { name: SENDER_NAME, email: SENDER_EMAIL },
      to:          [{ email: to, name: toName ?? to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Error Brevo email: ${res.status}`);
  }
  return await res.json();
}

// ── WhatsApp transaccional ────────────────────────────────────────────
/**
 * @param {{ phone: string, text: string }} opts
 * phone debe incluir código de país sin + ni espacios, ej: 573001234567
 */
export async function sendWhatsApp({ phone, text }) {
  if (!API_KEY)    throw new Error('Falta VITE_BREVO_API_KEY en el .env');
  if (!WA_SENDER)  throw new Error('Falta VITE_BREVO_WHATSAPP_SENDER en el .env — configura tu número de WhatsApp Business en Brevo');

  const cleanPhone = String('57'+phone).replace(/\D/g, '');
  if (!cleanPhone)  throw new Error('El cliente no tiene teléfono registrado');

  const res = await fetch(`${BASE}/whatsapp/sendMessage`, {
    method:  'POST',
    headers: headers(),
    body: JSON.stringify({
      senderNumber:   WA_SENDER,
      contactNumbers: [cleanPhone],
      text,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Error Brevo WhatsApp: ${res.status}`);
  }
  return await res.json();
}

// ── HTML template para recordatorios ─────────────────────────────────
export function buildReminderEmail({ companyName, title, message, type }) {
  const typeLabels = {
    payment:     '💳 Recordatorio de pago',
    promotion:   '🎯 Promoción especial',
    new_service: '✨ Nuevo servicio',
  };
  const typeLabel = typeLabels[type] ?? title;

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:24px 32px">
            <p style="margin:0;color:#fff;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;opacity:.85">${typeLabel}</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;line-height:1.3">${title}</h1>
          </td>
        </tr>
        ${message ? `
        <tr>
          <td style="padding:28px 32px">
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;white-space:pre-line">${message}</p>
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding:0 32px 28px;border-top:1px solid #f3f4f6">
            <p style="margin:24px 0 0;color:#9ca3af;font-size:12px">
              Enviado por <strong style="color:#f59e0b">${companyName}</strong>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
