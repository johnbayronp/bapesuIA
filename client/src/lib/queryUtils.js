export const EMPTY_ARRAY = Object.freeze([]);

export function unwrapSupabaseResponse(response) {
  if (response?.error) throw response.error;
  return response?.data ?? [];
}

export function unwrapSupabaseSingle(response) {
  if (response?.error) throw response.error;
  return response?.data ?? null;
}

export function unwrapSupabaseCount(response) {
  if (response?.error) throw response.error;
  return response?.count ?? 0;
}

export function invalidateCompanyData(queryClient, companyId) {
  if (!companyId) return Promise.resolve();
  return queryClient.invalidateQueries({ queryKey: ['company', companyId] });
}
