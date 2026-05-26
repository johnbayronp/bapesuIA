import { db } from './db';

export const inventoryApi = {
  // ── Productos ────────────────────────────────────────────────────
  listProducts: (companyId) =>
    db.from('bapesu_products')
      .select('*, bapesu_inventory_categories(id,name,color)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),

  createProduct: (payload) =>
    db.from('bapesu_products').insert(payload),

  updateProduct: (id, payload) =>
    db.from('bapesu_products').update(payload).eq('id', id),

  deleteProduct: (id) =>
    db.from('bapesu_products').delete().eq('id', id),

  getProductStock: (id) =>
    db.from('bapesu_products')
      .select('id, stock_available, purchase_price, sale_price')
      .eq('id', id)
      .single(),

  // ── Categorías ───────────────────────────────────────────────────
  listCategories: (companyId) =>
    db.from('bapesu_inventory_categories')
      .select('*')
      .eq('company_id', companyId)
      .order('name'),

  createCategory: (payload) =>
    db.from('bapesu_inventory_categories').insert(payload),

  updateCategory: (id, payload) =>
    db.from('bapesu_inventory_categories').update(payload).eq('id', id),

  deleteCategory: (id) =>
    db.from('bapesu_inventory_categories').delete().eq('id', id),

  // ── Movimientos de stock ─────────────────────────────────────────
  listMovements: (companyId, limit = 100) =>
    db.from('bapesu_stock_movements')
      .select('*, bapesu_products(name,unit)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit),

  addMovement: (payload) =>
    db.from('bapesu_stock_movements').insert(payload),
};
