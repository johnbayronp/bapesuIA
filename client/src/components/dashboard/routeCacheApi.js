import { normalizeDashboardPath } from './dashboardRoutes';

/** Rutas de formulario "nuevo" que deben reiniciarse al salir o guardar. */
export const NEW_EDITOR_PATHS = {
  invoice:   '/cobros/invoices/new',
  factura:   '/cobros/facturas/new',
  quotation: '/quotations/new',
};

let evictHandler = null;

export function registerDashboardCacheEvict(handler) {
  evictHandler = handler;
  return () => { evictHandler = null; };
}

/** Elimina una ruta del keep-alive para que se monte de nuevo en la próxima visita. */
export function evictDashboardRoute(pathnameOrKey) {
  if (!evictHandler) return;
  const key = pathnameOrKey.startsWith('/dashboard')
    ? normalizeDashboardPath(pathnameOrKey)
    : pathnameOrKey;
  evictHandler(key);
}

export function evictNewEditorCache(kind) {
  const path = NEW_EDITOR_PATHS[kind];
  if (path) evictDashboardRoute(path);
}
