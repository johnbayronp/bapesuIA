export const EASE_CLASS = 'transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]';
export const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black';
export const PRIMARY_BTN = `inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-base font-semibold text-white hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${EASE_CLASS} ${FOCUS}`;
export const GHOST_BTN = `inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-100 active:scale-[0.98] dark:border-white/15 dark:text-white dark:hover:bg-white/10 ${EASE_CLASS} ${FOCUS}`;

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const formatCOP = (value) => cop.format(Number(value) || 0);
