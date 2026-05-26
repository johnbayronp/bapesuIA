/**
 * db.js — Adaptador de base de datos
 *
 * HOY: exporta el cliente Supabase.
 * MAÑANA: para migrar a otro proveedor solo cambias este archivo.
 * Los módulos de api/ nunca importan supabase directamente.
 *
 * Si migras a un backend REST propio, reemplaza `query` por algo como:
 *   export const query = (endpoint, options) => fetch(`/api/${endpoint}`, options).then(r => r.json())
 */
export { supabase as db } from '../lib/supabase';
