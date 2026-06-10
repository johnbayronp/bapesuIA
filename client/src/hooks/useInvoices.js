import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const invoiceKeys = {
  all: ['invoices'],
  lists: () => [...invoiceKeys.all, 'list'],
  list: (companyId) => [...invoiceKeys.lists(), companyId],
};

export function useInvoices(companyId) {
  return useQuery({
    queryKey: invoiceKeys.list(companyId),
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bapesu_invoices')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDeleteInvoice(companyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId) => {
      const { error } = await supabase
        .from('bapesu_invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      return invoiceId;
    },
    onSuccess: (invoiceId) => {
      queryClient.setQueryData(invoiceKeys.list(companyId), (current = []) =>
        current.filter((invoice) => invoice.id !== invoiceId)
      );
      queryClient.invalidateQueries({ queryKey: invoiceKeys.list(companyId) });
    },
  });
}

export function useDuplicateInvoice(companyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice) => {
      const { data: items, error: itemsError } = await supabase
        .from('bapesu_invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (itemsError) throw itemsError;

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('bapesu_invoices')
        .insert({
          ...invoice,
          id: undefined,
          number: invoice.number ? `${invoice.number}-COPY` : null,
          status: 'draft',
          created_at: undefined,
          updated_at: undefined,
        })
        .select('id')
        .single();

      if (invoiceError) throw invoiceError;
      if (!newInvoice) throw new Error('No se pudo duplicar la cuenta de cobro.');

      if (items?.length) {
        const { error: insertItemsError } = await supabase
          .from('bapesu_invoice_items')
          .insert(
            items.map((item) => ({
              ...item,
              id: undefined,
              invoice_id: newInvoice.id,
              created_at: undefined,
            }))
          );

        if (insertItemsError) throw insertItemsError;
      }

      return newInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.list(companyId) });
    },
  });
}
