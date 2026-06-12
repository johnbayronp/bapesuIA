import { db } from './db';

export const invoicesApi = {
  list: (companyId) =>
    db.from('bapesu_invoices')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),

  getWithItems: (id) =>
    db.from('bapesu_invoices')
      .select('*, bapesu_invoice_items(*)')
      .eq('id', id)
      .single(),

  get: (id) =>
    db.from('bapesu_invoices').select('*').eq('id', id).maybeSingle(),

  countByCompany: (companyId) =>
    db.from('bapesu_invoices')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),

  getItems: (id) =>
    db.from('bapesu_invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('position'),

  create: (payload) =>
    db.from('bapesu_invoices').insert(payload).select().single(),

  update: (id, payload) =>
    db.from('bapesu_invoices').update(payload).eq('id', id),

  remove: (id) =>
    db.from('bapesu_invoices').delete().eq('id', id),

  updateStatus: (id, status) =>
    db.from('bapesu_invoices').update({ status }).eq('id', id),

  // Items
  addItems: (items) =>
    db.from('bapesu_invoice_items').insert(items),

  removeItems: (invoiceId) =>
    db.from('bapesu_invoice_items').delete().eq('invoice_id', invoiceId),
};
