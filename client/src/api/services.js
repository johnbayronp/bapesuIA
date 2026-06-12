import { db } from './db';

export const servicesApi = {
  list: (companyId) =>
    db.from('bapesu_services')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),

  listActiveForSelect: (companyId, columns = '*') =>
    db.from('bapesu_services')
      .select(columns)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name'),

  create: (payload) =>
    db.from('bapesu_services').insert(payload).select().single(),

  update: (id, payload) =>
    db.from('bapesu_services').update(payload).eq('id', id),

  remove: (id) =>
    db.from('bapesu_services').delete().eq('id', id),

  toggleActive: (id, isActive) =>
    db.from('bapesu_services').update({ is_active: isActive }).eq('id', id),
};
