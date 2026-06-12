import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { facturasApi, invoicesApi } from '../api';
import { queryKeys } from '../lib/queryKeys';
import { invalidateCompanyData, unwrapSupabaseResponse } from '../lib/queryUtils';

const FACTURA_PREFIX = 'FAC';

export function useInvoices(companyId) {
  return useQuery({
    queryKey: queryKeys.company.invoices(companyId),
    enabled: Boolean(companyId),
    queryFn: () => invoicesApi.list(companyId).then(unwrapSupabaseResponse),
  });
}

export function useDeleteInvoice(companyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId) => {
      const response = await invoicesApi.remove(invoiceId);
      if (response.error) throw response.error;
      return invoiceId;
    },
    onSuccess: () => invalidateCompanyData(queryClient, companyId),
  });
}

export function useDuplicateInvoice(companyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice) => {
      const itemsResponse = await invoicesApi.getItems(invoice.id);
      if (itemsResponse.error) throw itemsResponse.error;

      const invoiceResponse = await invoicesApi.create({
        ...invoice,
        id: undefined,
        number: invoice.number ? `${invoice.number}-COPY` : null,
        status: 'draft',
        created_at: undefined,
        updated_at: undefined,
      });
      if (invoiceResponse.error) throw invoiceResponse.error;
      if (!invoiceResponse.data) throw new Error('No se pudo duplicar la cuenta de cobro.');

      const items = itemsResponse.data ?? [];
      if (items.length) {
        const insertResponse = await invoicesApi.addItems(
          items.map((item) => ({
            ...item,
            id: undefined,
            invoice_id: invoiceResponse.data.id,
            created_at: undefined,
          }))
        );
        if (insertResponse.error) throw insertResponse.error;
      }

      return invoiceResponse.data;
    },
    onSuccess: () => invalidateCompanyData(queryClient, companyId),
  });
}

export function useConvertInvoiceToFactura(companyId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice) => {
      const [itemsResponse, countResponse] = await Promise.all([
        invoicesApi.getItems(invoice.id),
        facturasApi.countByCompany(companyId),
      ]);
      if (itemsResponse.error) throw itemsResponse.error;
      if (countResponse.error) throw countResponse.error;

      const newNumber = String((countResponse.count ?? 0) + 1).padStart(3, '0');
      const facturaResponse = await facturasApi.createId({
        company_id: companyId,
        client_id: invoice.client_id,
        client_name: invoice.client_name,
        client_nit: invoice.client_nit,
        client_email: invoice.client_email,
        client_phone: invoice.client_phone,
        client_address: invoice.client_address,
        prefix: FACTURA_PREFIX,
        number: newNumber,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        concept: invoice.concept,
        notes: invoice.notes,
        payment_info: invoice.payment_info,
        include_iva: invoice.include_iva,
        iva_rate: invoice.iva_rate,
        include_retefuente: invoice.include_retefuente,
        retefuente_rate: invoice.retefuente_rate,
        include_reteiva: false,
        reteiva_rate: 15,
        include_reteica: false,
        reteica_rate: 0.414,
        subtotal: invoice.subtotal,
        iva_amount: invoice.iva_amount,
        retefuente_amount: invoice.retefuente_amount,
        reteiva_amount: 0,
        reteica_amount: 0,
        total: invoice.total,
        status: 'draft',
      });
      if (facturaResponse.error) throw facturaResponse.error;

      const items = itemsResponse.data ?? [];
      if (items.length) {
        const insertResponse = await facturasApi.addItems(
          items.map((item) => ({
            factura_id: facturaResponse.data.id,
            service_id: item.service_id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            position: item.position,
          }))
        );
        if (insertResponse.error) throw insertResponse.error;
      }

      return facturaResponse.data;
    },
    onSuccess: () => invalidateCompanyData(queryClient, companyId),
  });
}
