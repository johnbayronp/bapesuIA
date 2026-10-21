// Empresa cuyo inventario se publica en /tienda. Debe coincidir con
// public.store_company_id() en database/store_module.sql.
export const STORE_COMPANY_ID = import.meta.env.VITE_STORE_COMPANY_ID || '';
export const isStoreCompany = (companyId) => Boolean(STORE_COMPANY_ID) && companyId === STORE_COMPANY_ID;
