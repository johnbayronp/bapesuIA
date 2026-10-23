import { db } from './db';

export const posSalesApi = {
  list: (companyId, { from, to } = {}) => {
    let query = db.from('bapesu_pos_sales')
      .select('*')
      .eq('company_id', companyId)
      .order('sold_at', { ascending: false });
    if (from) query = query.gte('sold_at', from);
    if (to) query = query.lt('sold_at', to);
    return query;
  },

  // sale_number lo asigna la base de datos.
  create: (payload) =>
    db.from('bapesu_pos_sales').insert({ ...payload, sale_number: 0 }).select().single(),

  // Ventas que pidieron factura electrónica. status: 'PENDING' | 'SENT' | undefined (todas).
  listEinvoices: (companyId, status) => {
    let query = db.from('bapesu_pos_sales')
      .select('*')
      .eq('company_id', companyId)
      .eq('requires_einvoice', true)
      .order('sold_at', { ascending: false });
    if (status) query = query.eq('einvoice_status', status);
    // Una venta anulada no se factura: no se cuenta como pendiente.
    if (status === 'PENDING') query = query.neq('status', 'VOIDED');
    return query;
  },

  countPendingEinvoices: (companyId) =>
    db.from('bapesu_pos_sales')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('requires_einvoice', true)
      .eq('einvoice_status', 'PENDING')
      .neq('status', 'VOIDED'),

  setEinvoiceStatus: (id, { status, number }) =>
    db.from('bapesu_pos_sales').update(status === 'SENT'
      ? { einvoice_status: 'SENT', einvoice_number: number || null, einvoice_sent_at: new Date().toISOString() }
      : { einvoice_status: 'PENDING', einvoice_number: null, einvoice_sent_at: null })
      .eq('id', id).select().single(),

  void: (id) =>
    db.from('bapesu_pos_sales').update({ status: 'VOIDED' }).eq('id', id).select().single(),
};
