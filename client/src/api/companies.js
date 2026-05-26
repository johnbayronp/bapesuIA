import { db } from './db';

export const companiesApi = {
  getById: (id) =>
    db.from('bapesu_companies').select('*').eq('id', id).single(),

  update: (id, payload) =>
    db.from('bapesu_companies').update(payload).eq('id', id),

  create: (payload) =>
    db.from('bapesu_companies').insert(payload).select().single(),
};
