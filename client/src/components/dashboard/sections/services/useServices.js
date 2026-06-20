import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../../../../api';
import { useCompany } from '../../../../context/CompanyContext';
import { queryKeys } from '../../../../lib/queryKeys';
import { EMPTY_ARRAY, invalidateCompanyData, unwrapSupabaseResponse } from '../../../../lib/queryUtils';
import { EMPTY_SERVICE } from './constants';

export function useServices() {
  const { user, company } = useCompany();
  const queryClient = useQueryClient();

  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_SERVICE);

  const servicesQuery = useQuery({
    queryKey: queryKeys.company.services(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => servicesApi.list(company.id).then(unwrapSupabaseResponse),
  });

  const invalidate = () => invalidateCompanyData(queryClient, company?.id);

  const saveMutation = useMutation({
    mutationFn: async ({ mode, id, payload }) => {
      const response = mode === 'add'
        ? await servicesApi.create({ ...payload, company_id: company.id, created_by: user?.id ?? null })
        : await servicesApi.update(id, payload);
      if (response.error) throw response.error;
      return response.data ?? null;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await servicesApi.remove(id);
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: async (service) => {
      const response = await servicesApi.toggleActive(service.id, !service.is_active);
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const services = servicesQuery.data ?? EMPTY_ARRAY;
  const loading = servicesQuery.isLoading;
  const saving = saveMutation.isPending || toggleMutation.isPending;

  const setF = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setForm(EMPTY_SERVICE);
    setError('');
    setModal({ mode: 'add' });
  };

  const openEdit = (service) => {
    setForm({
      name: service.name,
      description: service.description ?? '',
      default_price: String(service.default_price ?? 0),
      unit: service.unit ?? '',
      is_active: service.is_active ?? true,
    });
    setError('');
    setModal({ mode: 'edit', id: service.id });
  };

  const closeModal = () => {
    setModal(null);
    setError('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!company?.id) {
      setError('No tienes empresa asociada');
      return;
    }
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        default_price: parseFloat(form.default_price) || 0,
        unit: form.unit.trim() || null,
        is_active: form.is_active,
      };
      await saveMutation.mutateAsync({ mode: modal.mode, id: modal.id, payload });
      closeModal();
    } catch (e) {
      setError(e.message ?? 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este servicio? Las cotizaciones existentes no se ven afectadas.')) return;
    setDeleting(id);
    try {
      await deleteMutation.mutateAsync(id);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (service) => {
    await toggleMutation.mutateAsync(service);
  };

  const filtered = useMemo(() => services.filter((s) =>
    [s.name, s.description, s.unit].some((v) =>
      (v ?? '').toLowerCase().includes(search.toLowerCase())
    )
  ), [services, search]);

  return {
    services,
    filtered,
    loading,
    saving,
    deleting,
    error,
    search,
    setSearch,
    modal,
    form,
    setF,
    openAdd,
    openEdit,
    closeModal,
    handleSave,
    handleDelete,
    handleToggleActive,
  };
}
