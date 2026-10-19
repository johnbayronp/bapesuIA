import { db } from './db';

export const traceabilityApi = {
  listContractEvents: (companyId, from, to) =>
    db.from('bapesu_contract_audit_log')
      .select('id,contract_id,action,actor_id,actor_email,occurred_at,reason,client_name,lot,price,signing_date')
      .eq('company_id', companyId)
      .order('occurred_at', { ascending: false })
      .range(from, to),
};
