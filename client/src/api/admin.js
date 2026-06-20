import { db } from './db';

export const adminApi = {
  listCompanyUsers: (companyId) =>
    db.from('users')
      .select('id,email,first_name,last_name,role,is_active,created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),

  updateUser: (id, payload) =>
    db.from('users').update(payload).eq('id', id),

  assignUserToCompany: (userId, companyId, role) =>
    db.rpc('admin_assign_user_to_company', {
      p_user_id: userId,
      p_company_id: companyId,
      p_role: role,
    }),
};

export const superadminApi = {
  dashboard: async () => {
    const [companies, users] = await Promise.all([
      db.from('bapesu_companies').select('id,plan,is_active,created_at'),
      db.from('users').select('id,role,created_at'),
    ]);
    if (companies.error) throw companies.error;
    if (users.error) throw users.error;
    return { companies: companies.data ?? [], users: users.data ?? [] };
  },

  listCompanies: async () => {
    const [companies, users] = await Promise.all([
      db.from('bapesu_companies').select('*').order('created_at', { ascending: false }),
      db.from('users').select('company_id'),
    ]);
    if (companies.error) throw companies.error;
    if (users.error) throw users.error;
    return { companies: companies.data ?? [], users: users.data ?? [] };
  },

  createCompany: (payload) =>
    db.from('bapesu_companies').insert(payload),

  updateCompany: (id, payload) =>
    db.from('bapesu_companies').update(payload).eq('id', id),

  listPlans: () =>
    db.from('bapesu_plans').select('*').order('price_cop'),

  updatePlan: (id, payload) =>
    db.from('bapesu_plans').update(payload).eq('id', id),

  listUsers: async () => {
    const [users, companies] = await Promise.all([
      db.from('users').select('*').order('created_at', { ascending: true }),
      db.from('bapesu_companies').select('id,name,plan'),
    ]);
    if (users.error) throw users.error;
    if (companies.error) throw companies.error;
    return { users: users.data ?? [], companies: companies.data ?? [] };
  },

  updateUser: (id, payload) =>
    db.from('users').update(payload).eq('id', id),

  assignUserToCompany: (userId, companyId, role) =>
    db.rpc('superadmin_assign_user_to_company', {
      p_user_id: userId,
      p_company_id: companyId,
      p_role: role,
    }),
};
