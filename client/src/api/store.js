import { db } from './db';
import { STORE_COMPANY_ID } from '../lib/storeConfig';

// Lectura pública (sin sesión) de los productos publicados en la tienda.
export const storeApi = {
  listProducts: () =>
    db.from('bapesu_products')
      .select('id, name, description, photo_url, sale_price, stock_available, stock_min, unit, category_id, bapesu_inventory_categories(id, name)')
      .eq('company_id', STORE_COMPANY_ID)
      .eq('is_active', true)
      .eq('show_in_store', true)
      .order('name'),
};
