export const EMPTY_SERVICE = {
  name:          '',
  description:   '',
  default_price: '',
  unit:          '',
  is_active:     true,
};

export const INPUT = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400 transition';
export const LABEL = 'block text-xs font-medium text-gray-600 mb-1';

export const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

export const formatPriceCOP = (raw) => {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('es-CO');
};

export const parsePriceCOP = (formatted) =>
  String(formatted).replace(/\./g, '').replace(/,/g, '');
