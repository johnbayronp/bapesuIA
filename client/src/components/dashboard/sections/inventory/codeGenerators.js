const randomDigits = (length) => {
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => String(v % 10)).join('');
};

// "Llavero dragón" → "LLA". Sin nombre usa "PRD".
const namePrefix = (name) => {
  const letters = String(name ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (letters.slice(0, 3) || 'PRD').padEnd(3, 'X');
};

// Dígito de control EAN-13 (pesos 1 y 3 alternados).
const ean13CheckDigit = (twelve) => {
  const sum = [...twelve].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return String((10 - (sum % 10)) % 10);
};

const unique = (make, taken) => {
  const used = new Set([...taken].filter(Boolean).map((v) => String(v).trim().toUpperCase()));
  for (let i = 0; i < 50; i += 1) {
    const code = make();
    if (!used.has(code)) return code;
  }
  return make();
};

export const generateSku = (name, taken = []) => unique(() => `${namePrefix(name)}-${randomDigits(6)}`, taken);

// EAN-13 con prefijo 2xx: rango GS1 reservado para uso interno de la tienda.
export const generateEan13 = (taken = []) => unique(() => {
  const twelve = `2${randomDigits(11)}`;
  return twelve + ean13CheckDigit(twelve);
}, taken);
