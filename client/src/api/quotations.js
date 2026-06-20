import { db } from './db';

export const quotationsApi = {
  list: (companyId) =>
    db.from('bapesu_quotations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),

  get: (id) =>
    db.from('bapesu_quotations').select('*').eq('id', id).maybeSingle(),

  countByCompany: (companyId) =>
    db.from('bapesu_quotations')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),

  getItems: (quotationId) =>
    db.from('bapesu_quotation_items')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('position'),

  create: (payload) =>
    db.from('bapesu_quotations').insert(payload).select('id').single(),

  update: (id, payload) =>
    db.from('bapesu_quotations').update(payload).eq('id', id),

  remove: (id) =>
    db.from('bapesu_quotations').delete().eq('id', id),

  removeItems: (quotationId) =>
    db.from('bapesu_quotation_items').delete().eq('quotation_id', quotationId),

  addItems: (items) =>
    db.from('bapesu_quotation_items').insert(items),
};
