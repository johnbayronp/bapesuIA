import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import contractTemplateUrl from '../../assets/contract-template.docx?url';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const monthIndex = Object.fromEntries(MONTHS.map((month, index) => [month.toLowerCase(), index]));
const number = (value) => Number(value || 0);
const currency = (value, decimals = 2) => new Intl.NumberFormat('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(number(value));
const imageCurrency = (value, decimals = 0) => new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(number(value));
const escapeXml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function boldPlaceholderWithoutHighlight(zip, placeholder) {
  const xml = zip.file('word/document.xml').asText();
  const token = `<w:t>{{${placeholder}}}</w:t>`;
  const tokenIndex = xml.indexOf(token);
  if (tokenIndex < 0) return;
  const runStart = xml.lastIndexOf('<w:r ', tokenIndex);
  const runEnd = xml.indexOf('</w:r>', tokenIndex) + '</w:r>'.length;
  if (runStart < 0 || runEnd < '</w:r>'.length) return;
  const run = xml.slice(runStart, runEnd).replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/, (_match, properties) => {
    const cleanProperties = properties.replace(/<w:highlight\b[^>]*\/>/g, '').replace(/<w:b(?:\s[^>]*)?\/>/g, '');
    return `<w:rPr>${cleanProperties}<w:b/></w:rPr>`;
  });
  zip.file('word/document.xml', `${xml.slice(0, runStart)}${run}${xml.slice(runEnd)}`);
}

function removeRunContaining(xml, marker) {
  const markerIndex = xml.indexOf(marker);
  if (markerIndex < 0) return xml;
  const runStart = Math.max(xml.lastIndexOf('<w:r ', markerIndex), xml.lastIndexOf('<w:r>', markerIndex));
  const runEnd = xml.indexOf('</w:r>', markerIndex) + '</w:r>'.length;
  if (runStart < 0 || runEnd < '</w:r>'.length) return xml;
  return `${xml.slice(0, runStart)}${xml.slice(runEnd)}`;
}

function removeAlternateContentContaining(xml, marker) {
  const markerIndex = xml.indexOf(marker);
  if (markerIndex < 0) return xml;
  const blockStart = xml.lastIndexOf('<mc:AlternateContent', markerIndex);
  const blockEnd = xml.indexOf('</mc:AlternateContent>', markerIndex) + '</mc:AlternateContent>'.length;
  if (blockStart < 0 || blockEnd < '</mc:AlternateContent>'.length) return xml;
  return `${xml.slice(0, blockStart)}${xml.slice(blockEnd)}`;
}

function removeDuplicateAttachmentAndArrow(zip) {
  let xml = zip.file('word/document.xml').asText();
  xml = removeRunContaining(xml, 'r:embed="rId11"');
  xml = removeRunContaining(xml, 'endarrow="block"');
  xml = removeAlternateContentContaining(xml, '13683B47');
  zip.file('word/document.xml', xml);
}

function keepCaptionWithImage(paragraph) {
  let result = paragraph.replace(/<w:lastRenderedPageBreak\s*\/>/g, '');
  const additions = `${result.includes('<w:keepNext') ? '' : '<w:keepNext/>'}${result.includes('<w:pageBreakBefore') ? '' : '<w:pageBreakBefore/>'}`;
  if (!additions) return result;
  if (/<w:pPr(?:\s[^>]*)?>/.test(result)) {
    if (/<w:pStyle\b[^>]*\/>/.test(result)) return result.replace(/(<w:pStyle\b[^>]*\/>)/, `$1${additions}`);
    return result.replace(/(<w:pPr(?:\s[^>]*)?>)/, `$1${additions}`);
  }
  return result.replace(/(<w:p(?:\s[^>]*)?>)/, `$1<w:pPr>${additions}</w:pPr>`);
}

function positionAnnexCaptions(zip) {
  const xml = zip.file('word/document.xml').asText();
  const paragraphs = [...xml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
    xml: match[0],
  }));
  const find = (predicate) => paragraphs.find(({ xml: paragraph }) => predicate(paragraph));
  const paragraphText = (paragraph) => [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
    .map((match) => match[1])
    .join('');
  const captionOne = find((paragraph) => paragraphText(paragraph).includes('Anexo 1 Ubicación en Plano'));
  const imageOne = find((paragraph) => paragraph.includes('r:embed="rId12"'));
  const captionTwo = find((paragraph) => paragraphText(paragraph).includes('Anexo 2 Cedula del promitente comprador'));
  const imageTwo = find((paragraph) => paragraph.includes('r:embed="rId13"'));
  if (!captionOne || !imageOne || !captionTwo || !imageTwo) return;

  const replacement = [
    keepCaptionWithImage(captionOne.xml),
    imageOne.xml,
    keepCaptionWithImage(captionTwo.xml),
    imageTwo.xml,
  ].join('');
  zip.file('word/document.xml', `${xml.slice(0, captionOne.start)}${replacement}${xml.slice(imageTwo.end)}`);
}

function replaceArrasPriceWithDynamicValues(zip) {
  const xml = zip.file('word/document.xml').asText();
  const originalText = '<w:t>CIENTO QUINCE MILLONES DE PESOS (${{PRICE}}),</w:t>';
  const replacementText = '<w:t>{{PRICE_WORDS}} (${{PRICE}}),</w:t>';
  const tokenIndex = xml.indexOf(originalText);
  if (tokenIndex < 0) throw new Error('No se encontró el precio de la cláusula de arras en la plantilla.');
  const runStart = xml.lastIndexOf('<w:r ', tokenIndex);
  const runEnd = xml.indexOf('</w:r>', tokenIndex) + '</w:r>'.length;
  if (runStart < 0 || runEnd < '</w:r>'.length) throw new Error('No se pudo aplicar el formato al precio de la cláusula de arras.');
  const run = xml.slice(runStart, runEnd)
    .replace(originalText, replacementText)
    .replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/, (_match, properties) => {
      const cleanProperties = properties
        .replace(/<w:highlight\b[^>]*\/>/g, '')
        .replace(/<w:u\b[^>]*\/>/g, '')
        .replace(/<w:b(?:\s[^>]*)?\/>/g, '');
      return `<w:rPr>${cleanProperties}<w:b/></w:rPr>`;
    });
  zip.file('word/document.xml', `${xml.slice(0, runStart)}${run}${xml.slice(runEnd)}`);
}

function paymentScheduleSvg(form) {
  const date = new Date(`${form.signingDate || new Date().toISOString().slice(0, 10)}T12:00:00Z`);
  const startYear = date.getUTCFullYear();
  const semiMonths = String(form.semiannualMonths || '').toLowerCase().split(/[,y\s]+/).map((month) => monthIndex[month]).filter((month) => month !== undefined);
  const semiSet = new Set(semiMonths.length ? semiMonths : [2, 8]);
  let monthlyLeft = Math.max(0, Math.min(60, number(form.monthlyInstallmentCount)));
  let semiLeft = Math.max(0, Math.min(20, number(form.semiannualInstallmentCount)));
  const payments = {};
  const totals = {};
  let cursor = new Date(Date.UTC(startYear, date.getUTCMonth() + 1, 1));

  for (let step = 0; step < 84 && (monthlyLeft > 0 || semiLeft > 0); step += 1) {
    const month = cursor.getUTCMonth();
    const year = cursor.getUTCFullYear();
    const isSemi = semiLeft > 0 && semiSet.has(month);
    if (isSemi || monthlyLeft > 0) {
      const amount = number(isSemi ? form.semiannualInstallment : form.monthlyInstallment);
      payments[`${year}-${month}`] = amount;
      totals[year] = (totals[year] || 0) + amount;
      if (isSemi) semiLeft -= 1;
      else monthlyLeft -= 1;
    }
    cursor = new Date(Date.UTC(year, month + 1, 1));
  }

  const years = [...new Set([startYear, ...Object.keys(totals).map(Number)])].sort((a, b) => a - b).slice(0, 5);
  const x = 135, y = 245, rowH = 40, monthW = 210, totalW = 220;
  const yearW = Math.min(260, (1330 - monthW - totalW) / Math.max(1, years.length));
  const tableW = monthW + yearW * years.length + totalW;
  const line = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="2"/>`;
  const text = (tx, ty, value, size = 21, bold = false, anchor = 'middle') => `<text x="${tx}" y="${ty}" font-family="Georgia,serif" font-size="${size}" font-weight="${bold ? 700 : 400}" text-anchor="${anchor}">${escapeXml(value)}</text>`;
  const parts = [];
  const headerBottom = y + rowH;
  parts.push(`<rect x="${x}" y="${y}" width="${tableW}" height="${rowH * 14}" fill="white" stroke="#111" stroke-width="3"/>`);
  parts.push(text(x + tableW / 2, y - 25, 'Plan de Pagos', 34, true));
  parts.push(line(x, headerBottom, x + tableW, headerBottom));
  parts.push(text(x + monthW / 2, y + 30, 'Mes', 22, true));
  years.forEach((year, index) => parts.push(text(x + monthW + index * yearW + yearW / 2, y + 30, String(year), 24, true)));
  parts.push(text(x + monthW + years.length * yearW + totalW / 2, y + 30, 'Saldo escrituras', 21, true));
  parts.push(line(x + monthW, y, x + monthW, y + rowH * 14));
  years.forEach((_year, index) => parts.push(line(x + monthW + (index + 1) * yearW, y, x + monthW + (index + 1) * yearW, y + rowH * 14)));
  parts.push(line(x + monthW + years.length * yearW, y, x + monthW + years.length * yearW, y + rowH * 14));

  MONTHS.forEach((monthName, month) => {
    const rowY = y + rowH * (month + 2);
    parts.push(line(x, rowY, x + tableW, rowY));
    parts.push(text(x + monthW / 2, rowY - 11, monthName, 21));
    years.forEach((year, index) => {
      const amount = payments[`${year}-${month}`] || 0;
      const display = year === startYear && month === date.getUTCMonth() ? number(form.initialPayment) + amount : amount;
      if (display) parts.push(text(x + monthW + index * yearW + yearW / 2, rowY - 11, `$ ${imageCurrency(display)}`, 18));
    });
    if (month === 5) parts.push(text(x + monthW + years.length * yearW + totalW / 2, rowY - 11, `$ ${imageCurrency(form.finalPayment)}`, 19));
  });

  const widths = [205, 305, 280, 510];
  const summary = [
    [['Lote:', form.lot], ['Valor m²', `$ ${imageCurrency(number(form.price) / (number(form.areaM2) || 1), 2)}`]],
    [['Área:', `${form.areaM2 || ''}`], ['Valor del Terreno:', `$ ${imageCurrency(form.price, 2)}`]],
    [['Cuota Inicial:', `$ ${imageCurrency(form.initialPayment)}`], ['Cuota Semestral:', `$ ${imageCurrency(form.semiannualInstallment)}`]],
    [['Cuota Mensual:', `$ ${imageCurrency(form.monthlyInstallment)}`], ['Saldo a Escrituras', `$ ${imageCurrency(form.finalPayment)}`]],
  ];
  const summarySvg = summary.map((pair, row) => {
    let left = 135;
    return pair.flatMap((item, pairIndex) => item.map((value, cellIndex) => {
      const cell = pairIndex * 2 + cellIndex;
      const width = widths[cell];
      const isLabel = cellIndex === 0;
      const markup = `<rect x="${left}" y="${16 + row * 39}" width="${width}" height="39" fill="white" stroke="#111" stroke-width="1.5"/>${text(left + (isLabel ? 10 : width - 10), 41 + row * 39, value, 18, isLabel, isLabel ? 'start' : 'end')}`;
      left += width;
      return markup;
    })).join('');
  }).join('');
  const yearTotals = years.map((year, index) => text(x + monthW + index * yearW + yearW / 2, y + rowH * 14 - 10, `$ ${imageCurrency(totals[year] || (year === startYear ? number(form.initialPayment) : 0), 2)}`, 17)).join('');
  const ending = `${text(x, y + rowH * 14 - 10, 'Total Fin de Año', 17, true, 'start')}${yearTotals}${text(x, 855, `Total Aportes: $ ${imageCurrency(number(form.price) - number(form.finalPayment), 2)}`, 21, true, 'start')}${text(x, 900, `Aportes + Saldo: $ ${imageCurrency(form.price, 2)}`, 21, true, 'start')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="968" viewBox="0 0 1600 968"><rect width="100%" height="100%" fill="white"/>${summarySvg}${parts.join('')}${ending}</svg>`;
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo preparar una imagen para el contrato.')), type, quality));
}

async function svgToJpeg(svg) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 968;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('El navegador no pudo preparar la tabla de pagos.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    return new Uint8Array(await (await canvasBlob(canvas, 'image/jpeg', 0.92)).arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function attachmentPlaceholder(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="420"><rect width="100%" height="100%" fill="#f8fafc"/><rect x="12" y="12" width="876" height="396" fill="none" stroke="#94a3b8" stroke-width="4" stroke-dasharray="14 10"/><text x="450" y="205" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" fill="#475569">${label}</text><text x="450" y="252" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#64748b">Se incluirá al adjuntar el archivo</text></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 420;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('El navegador no pudo preparar la vista previa.');
    context.drawImage(image, 0, 0);
    return new Uint8Array(await (await canvasBlob(canvas, 'image/png')).arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function imageFileToPng(file) {
  if (!file?.type.startsWith('image/')) throw new Error('Para insertar el plano y la cédula en el Word, selecciona archivos JPG o PNG.');
  const image = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('El navegador no pudo leer uno de los anexos.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  image.close?.();
  return new Uint8Array(await (await canvasBlob(canvas, 'image/png')).arrayBuffer());
}

async function imageFileToJpeg(file) {
  const image = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('El navegador no pudo leer el cuadro del plan de pagos.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  image.close?.();
  return new Uint8Array(await (await canvasBlob(canvas, 'image/jpeg', 0.96)).arrayBuffer());
}

export async function generateContractDocx(form, attachments = {}) {
  const [mapPng, idPng] = await Promise.all([
    attachments.mapFile?.type.startsWith('image/') ? imageFileToPng(attachments.mapFile) : attachmentPlaceholder('PLANO DEL LOTE'),
    attachments.idFile?.type.startsWith('image/') ? imageFileToPng(attachments.idFile) : attachmentPlaceholder('DOCUMENTO DEL COMPRADOR'),
  ]);
  const response = await fetch(contractTemplateUrl);
  if (!response.ok) throw new Error('No se pudo cargar la plantilla de contratos.');
  const zip = new PizZip(await response.arrayBuffer());
  removeDuplicateAttachmentAndArrow(zip);
  positionAnnexCaptions(zip);
  boldPlaceholderWithoutHighlight(zip, 'SEMIANNUAL_MONTHS');
  replaceArrasPriceWithDynamicValues(zip);
  const document = new Docxtemplater(zip, { delimiters: { start: '{{', end: '}}' }, nullGetter: () => '', linebreaks: true });
  const signingDate = new Date(`${form.signingDate || new Date().toISOString().slice(0, 10)}T12:00:00Z`);
  const dateLabel = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(signingDate);
  const coBuyerName = (form.coBuyerName || '').trim();
  document.render({
    BUYER_NAME: form.buyerName,
    BUYER_ID_TYPE: form.buyerIdType,
    BUYER_ID: form.buyerIdentification,
    BUYER_ID_PLACE: form.buyerIssuedIn,
    MARITAL_STATUS: form.buyerMaritalStatus,
    BUYER_ADDRESS: form.buyerAddress,
    BUYER_PHONE: form.buyerPhone,
    BUYER_EMAIL: form.buyerEmail,
    CO_BUYER_NAME: coBuyerName || 'N/A',
    CO_BUYER_ID_TYPE: coBuyerName ? form.coBuyerIdType || 'C.C.' : '',
    CO_BUYER_ID: form.coBuyerIdentification || 'N/A',
    CO_BUYER_NOTICE: coBuyerName ? `\n\nSEGUNDO PROMITENTE COMPRADOR: ${coBuyerName}, identificado con ${form.coBuyerIdType || 'C.C.'} ${form.coBuyerIdentification || ''}, expedida en ${form.coBuyerIssuedIn || ''}` : '',
    CO_BUYER_SIGNATURE: coBuyerName ? `\n\n______________________\n${coBuyerName}\n${form.coBuyerIdType || 'C.C.'} ${form.coBuyerIdentification || ''}, expedida en ${form.coBuyerIssuedIn || ''}` : '',
    LOT: form.lot,
    AREA: form.areaM2,
    PRICE_WORDS: (form.priceInWords || '').toUpperCase(),
    PRICE: currency(form.price, 0),
    PAYMENT_START_DAY: String(form.paymentStartDay),
    PAYMENT_DEADLINE_DAY: String(form.paymentDeadlineDay),
    INITIAL_PAYMENT: `$${currency(form.initialPayment)}`,
    MONTHLY_INSTALLMENT_COUNT: String(form.monthlyInstallmentCount),
    MONTHLY_COUNT: String(form.monthlyInstallmentCount),
    MONTHLY_PAYMENT: `$${currency(form.monthlyInstallment)}`,
    SEMIANNUAL_INSTALLMENT_COUNT: String(form.semiannualInstallmentCount),
    SEMIANNUAL_COUNT: String(form.semiannualInstallmentCount),
    SEMIANNUAL_MONTHS: form.semiannualMonths,
    SEMIANNUAL_PAYMENT: `$${currency(form.semiannualInstallment)}`,
    EXTRAORDINARY_COUNT: form.extraordinaryPayment ? '1' : 'N/A',
    EXTRAORDINARY_PAYMENT: form.extraordinaryPayment ? `$${currency(form.extraordinaryPayment)}` : '-',
    FINAL_PAYMENT: `$${currency(form.finalPayment)}`,
    SIGNING_DATE: dateLabel,
    SIGNING_CITY: form.signingCity,
  });

  const generated = document.getZip();
  const scheduleJpeg = attachments.paymentPlanFile?.type.startsWith('image/')
    ? await imageFileToJpeg(attachments.paymentPlanFile)
    : await svgToJpeg(paymentScheduleSvg(form));
  generated.file('word/media/image1.jpeg', scheduleJpeg);
  generated.file('word/media/image3.png', mapPng);
  generated.file('word/media/image4.png', idPng);
  return new Blob([generated.generate({ type: 'uint8array', compression: 'DEFLATE' })], { type: DOCX_MIME });
}
