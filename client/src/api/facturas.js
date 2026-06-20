import { db } from './db';

export const facturasApi = {
  list: (companyId) =>
    db.from('bapesu_facturas')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),

  getWithItems: (id) =>
    db.from('bapesu_facturas')
      .select('*, bapesu_factura_items(*)')
      .eq('id', id)
      .single(),

  get: (id) =>
    db.from('bapesu_facturas').select('*').eq('id', id).maybeSingle(),

  countByCompany: (companyId) =>
    db.from('bapesu_facturas')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),

  create: (payload) =>
    db.from('bapesu_facturas').insert(payload).select().single(),

  createId: (payload) =>
    db.from('bapesu_facturas').insert(payload).select('id').single(),

  update: (id, payload) =>
    db.from('bapesu_facturas').update(payload).eq('id', id),

  remove: (id) =>
    db.from('bapesu_facturas').delete().eq('id', id),

  updateStatus: (id, status) =>
    db.from('bapesu_facturas').update({ status }).eq('id', id),

  // Items
  getItems: (facturaId) =>
    db.from('bapesu_factura_items')
      .select('*')
      .eq('factura_id', facturaId)
      .order('position'),

  addItems: (items) =>
    db.from('bapesu_factura_items').insert(items),

  removeItems: (facturaId) =>
    db.from('bapesu_factura_items').delete().eq('factura_id', facturaId),
};
