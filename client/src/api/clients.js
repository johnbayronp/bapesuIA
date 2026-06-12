import { db } from './db';

export const clientsApi = {
  list: (companyId) =>
    db.from('bapesu_clients')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),

  listForSelect: (companyId, columns = '*') =>
    db.from('bapesu_clients')
      .select(columns)
      .eq('company_id', companyId)
      .order('name'),

  create: (payload) =>
    db.from('bapesu_clients').insert(payload).select().single(),

  update: (id, payload) =>
    db.from('bapesu_clients').update(payload).eq('id', id),

  remove: (id) =>
    db.from('bapesu_clients').delete().eq('id', id),
};
