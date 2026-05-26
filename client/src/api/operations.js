import { db } from './db';

export const operationsApi = {
  // ── Operaciones ──────────────────────────────────────────────────
  list: (companyId) =>
    db.from('bapesu_inventory_ops')
      .select('*, bapesu_suppliers(name), bapesu_warehouses!warehouse_to(name), bapesu_warehouses!warehouse_from(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),

  getWithItems: (id) =>
    db.from('bapesu_inventory_ops')
      .select('*, bapesu_inventory_op_items(*, bapesu_products(name,unit))')
      .eq('id', id)
      .single(),

  create: (payload) =>
    db.from('bapesu_inventory_ops').insert(payload).select('id').single(),

  update: (id, payload) =>
    db.from('bapesu_inventory_ops').update(payload).eq('id', id),

  // Items
  addItems: (items) =>
    db.from('bapesu_inventory_op_items').insert(items),

  listItems: (opId) =>
    db.from('bapesu_inventory_op_items')
      .select('*, bapesu_products(id,name,unit,stock_available,purchase_price,sale_price)')
      .eq('op_id', opId),

  // ── Proveedores ──────────────────────────────────────────────────
  listSuppliers: (companyId) =>
    db.from('bapesu_suppliers')
      .select('*')
      .eq('company_id', companyId)
      .order('name'),

  createSupplier: (payload) =>
    db.from('bapesu_suppliers').insert(payload).select().single(),

  updateSupplier: (id, payload) =>
    db.from('bapesu_suppliers').update(payload).eq('id', id),

  deleteSupplier: (id) =>
    db.from('bapesu_suppliers').delete().eq('id', id),

  // ── Bodegas ──────────────────────────────────────────────────────
  listWarehouses: (companyId) =>
    db.from('bapesu_warehouses')
      .select('*')
      .eq('company_id', companyId)
      .order('name'),

  createWarehouse: (payload) =>
    db.from('bapesu_warehouses').insert(payload).select().single(),

  updateWarehouse: (id, payload) =>
    db.from('bapesu_warehouses').update(payload).eq('id', id),

  deleteWarehouse: (id) =>
    db.from('bapesu_warehouses').delete().eq('id', id),

  // ── Documentos pendientes (para vincular a salidas) ───────────────
  listPendingInvoices: (companyId) =>
    db.from('bapesu_invoices')
      .select('id, number, client_name, total, status')
      .eq('company_id', companyId)
      .in('status', ['draft', 'sent', 'borrador', 'enviada', 'pendiente']),

  listPendingFacturas: (companyId) =>
    db.from('bapesu_facturas')
      .select('id, number, client_name, total, status')
      .eq('company_id', companyId)
      .in('status', ['draft', 'sent', 'borrador', 'enviada', 'pendiente']),
};
