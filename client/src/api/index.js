/**
 * Capa de abstracción de datos — Bapesu Platform
 *
 * Importa siempre desde aquí, nunca desde supabase directamente:
 *   import { inventoryApi, clientsApi } from '../api'
 *
 * Para migrar a otro proveedor (backend propio, Neon, Firebase, etc.)
 * solo modificas los archivos dentro de esta carpeta.
 * Los hooks y componentes no necesitan cambiar.
 */
export { companiesApi }  from './companies';
export { clientsApi }    from './clients';
export { servicesApi }   from './services';
export { invoicesApi }   from './invoices';
export { facturasApi }   from './facturas';
export { remindersApi }  from './reminders';
export { inventoryApi }  from './inventory';
export { operationsApi } from './operations';
export { quotationsApi } from './quotations';
export { adminApi, superadminApi } from './admin';
