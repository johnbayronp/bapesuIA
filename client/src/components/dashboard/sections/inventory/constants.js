export const INPUT = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-400 transition';
export const LABEL = 'block text-xs font-medium text-gray-600 mb-1';

export const EMPTY_PRODUCT = {
  name:            '',
  sku:             '',
  barcode:         '',
  description:     '',
  category_id:     '',
  unit:            'unidad',
  photo_url:       '',
  is_active:       true,
  stock_available:  0,
  stock_reserved:   0,
  stock_in_transit: 0,
  stock_min:        0,
  stock_location:  '',
  purchase_price:  '',
  sale_price:      '',
  tax_rate:        19,
};

export const EMPTY_CATEGORY = {
  name:        '',
  description: '',
  color:       '#6366f1',
  parent_id:   '',
};

export const UNITS = [
  'unidad', 'kg', 'g', 'litro', 'ml', 'metro', 'cm',
  'caja', 'paquete', 'par', 'docena', 'hora', 'servicio',
];

export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

export const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

export const formatPriceCOP = (raw) => {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('es-CO');
};

export const parsePriceCOP = (formatted) =>
  String(formatted).replace(/\./g, '').replace(/,/g, '');

export const getMargin = (purchase, sale) => {
  const p = Number(purchase);
  const s = Number(sale);
  if (!p || !s) return 0;
  return Math.round(((s - p) / s) * 100);
};

export const getStockStatus = (available, min) => {
  if (available <= 0)       return { label: 'Sin stock',  color: 'bg-red-100 text-red-600',    dot: 'bg-red-500' };
  if (available <= min)     return { label: 'Stock bajo', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' };
  return                           { label: 'En stock',   color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
};
