import { db } from './db';

export const remindersApi = {
  list: (companyId) =>
    db.from('bapesu_reminders')
      .select('*, bapesu_clients(name, phone, email)')
      .eq('company_id', companyId)
      .order('scheduled_date', { ascending: true }),

  create: (payload) =>
    db.from('bapesu_reminders').insert(payload).select().single(),

  update: (id, payload) =>
    db.from('bapesu_reminders').update(payload).eq('id', id),

  updateStatus: (id, status) =>
    db.from('bapesu_reminders').update({ status }).eq('id', id),

  remove: (id) =>
    db.from('bapesu_reminders').delete().eq('id', id),
};
