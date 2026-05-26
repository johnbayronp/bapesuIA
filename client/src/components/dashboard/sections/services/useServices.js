import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useCompany } from '../../../../context/CompanyContext';
import { EMPTY_SERVICE } from './constants';

export function useServices() {
  const { user, company } = useCompany();

  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');

  // Modal state
  const [modal, setModal] = useState(null); // null | { mode: 'add' | 'edit', id?: string }
  const [form, setForm]   = useState(EMPTY_SERVICE);

  // ── Data fetching ──────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('bapesu_services')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });
    setServices(data ?? []);
    setLoading(false);
  }, [company]);

  useEffect(() => { load(); }, [load]);

  // ── Form helpers ───────────────────────────────────────────────
  const setF = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setForm(EMPTY_SERVICE);
    setError('');
    setModal({ mode: 'add' });
  };

  const openEdit = (service) => {
    setForm({
      name:          service.name,
      description:   service.description ?? '',
      default_price: String(service.default_price ?? 0),
      unit:          service.unit ?? '',
      is_active:     service.is_active ?? true,
    });
    setError('');
    setModal({ mode: 'edit', id: service.id });
  };

  const closeModal = () => {
    setModal(null);
    setError('');
  };

  // ── CRUD ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return; }
    if (!company?.id)      { setError('No tienes empresa asociada'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name:          form.name.trim(),
        description:   form.description.trim() || null,
        default_price: parseFloat(form.default_price) || 0,
        unit:          form.unit.trim() || null,
        is_active:     form.is_active,
      };
      if (modal.mode === 'add') {
        const { error: e } = await supabase
          .from('bapesu_services')
          .insert({ ...payload, company_id: company.id, created_by: user?.id ?? null });
        if (e) throw e;
      } else {
        const { error: e } = await supabase
          .from('bapesu_services')
          .update(payload)
          .eq('id', modal.id);
        if (e) throw e;
      }
      await load();
      closeModal();
    } catch (e) {
      setError(e.message ?? 'Error al guardar');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este servicio? Las cotizaciones existentes no se ven afectadas.')) return;
    setDeleting(id);
    await supabase.from('bapesu_services').delete().eq('id', id);
    await load();
    setDeleting(null);
  };

  const handleToggleActive = async (service) => {
    await supabase
      .from('bapesu_services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id);
    await load();
  };

  // ── Filtered list ──────────────────────────────────────────────
  const filtered = services.filter((s) =>
    [s.name, s.description, s.unit].some((v) =>
      (v ?? '').toLowerCase().includes(search.toLowerCase())
    )
  );

  return {
    // data
    services,
    filtered,
    loading,
    saving,
    deleting,
    error,
    // search
    search,
    setSearch,
    // modal
    modal,
    form,
    setF,
    openAdd,
    openEdit,
    closeModal,
    // actions
    handleSave,
    handleDelete,
    handleToggleActive,
  };
}
