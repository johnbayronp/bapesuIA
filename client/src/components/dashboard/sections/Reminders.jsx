import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientsApi, invoicesApi, remindersApi } from '../../../api';
import { useCompany } from '../../../context/CompanyContext';
import { sendEmail, sendWhatsApp, buildReminderEmail } from '../../../lib/brevo';
import { queryKeys } from '../../../lib/queryKeys';
import { invalidateCompanyData, unwrapSupabaseResponse } from '../../../lib/queryUtils';

// ── Configuración de tipos ────────────────────────────────────────────
const TYPES = {
  payment: {
    label: 'Recordatorio de pago',
    short: 'Pago',
    icon: '💳',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    accent: 'from-emerald-400 to-teal-500',
  },
  promotion: {
    label: 'Promoción',
    short: 'Promo',
    icon: '🎯',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
    accent: 'from-yellow-400 to-amber-500',
  },
  new_service: {
    label: 'Nuevo servicio / producto',
    short: 'Nuevo',
    icon: '✨',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    accent: 'from-indigo-400 to-violet-500',
  },
};

const STATUS = {
  pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600' },
  sent:    { label: 'Enviado',   color: 'bg-blue-100 text-blue-600' },
  done:    { label: 'Hecho',     color: 'bg-emerald-100 text-emerald-700' },
};

const EMPTY = {
  type: 'payment',
  title: '',
  message: '',
  scheduled_date: '',
  client_id: '',
  status: 'pending',
};

const INPUT  = 'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400 transition';
const LABEL  = 'block text-xs font-medium text-gray-600 mb-1';

const today = () => new Date().toISOString().slice(0, 10);

function isOverdue(r) {
  return r.status === 'pending' && r.scheduled_date && r.scheduled_date < today();
}
function isDueToday(r) {
  return r.status === 'pending' && r.scheduled_date === today();
}

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

export default function Reminders() {
  const { user, company } = useCompany();
  const queryClient = useQueryClient();
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  // Búsqueda de cuentas pendientes dentro del modal
  const [invSearch, setInvSearch]       = useState('');
  const [invDropdown, setInvDropdown]   = useState(false);
  const [linkedInvoice, setLinkedInvoice] = useState(null); // invoice seleccionada

  // Modal de envío Brevo
  const [sendModal, setSendModal]   = useState(null);
  const [sending, setSending]       = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [filter, setFilter]       = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]       = useState('');

  const remindersQuery = useQuery({
    queryKey: queryKeys.company.reminders(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => remindersApi.list(company.id).then(unwrapSupabaseResponse),
  });

  const clientsQuery = useQuery({
    queryKey: queryKeys.company.clients(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => clientsApi.list(company.id).then(unwrapSupabaseResponse),
  });

  const pendingInvoicesQuery = useQuery({
    queryKey: [...queryKeys.company.invoices(company?.id), 'pending-reminders'],
    enabled: Boolean(company?.id),
    queryFn: async () => {
      const response = await invoicesApi.list(company.id);
      if (response.error) throw response.error;
      return (response.data ?? [])
        .filter((invoice) => ['draft', 'sent'].includes(invoice.status))
        .sort((a, b) => String(a.due_date ?? '').localeCompare(String(b.due_date ?? '')));
    },
  });

  const reminders = remindersQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const pendingInvoices = pendingInvoicesQuery.data ?? [];
  const loading = remindersQuery.isLoading || clientsQuery.isLoading || pendingInvoicesQuery.isLoading;
  const invalidate = () => invalidateCompanyData(queryClient, company?.id);

  const saveMutation = useMutation({
    mutationFn: async ({ mode, id, payload }) => {
      const response = mode === 'add'
        ? await remindersApi.create({ ...payload, company_id: company.id, created_by: user?.id ?? null })
        : await remindersApi.update(id, payload);
      if (response.error) throw response.error;
      return response.data ?? null;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await remindersApi.remove(id);
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await remindersApi.update(id, { status, updated_at: new Date().toISOString() });
      if (response.error) throw response.error;
    },
    onSuccess: invalidate,
  });

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openAdd = (type = 'payment') => {
    setForm({ ...EMPTY, type, scheduled_date: today() });
    setError('');
    setInvSearch('');
    setInvDropdown(false);
    setLinkedInvoice(null);
    setModal({ mode: 'add' });
  };
  const openEdit = (r) => {
    setForm({
      type: r.type,
      title: r.title,
      message: r.message ?? '',
      scheduled_date: r.scheduled_date ?? '',
      client_id: r.client_id ?? '',
      status: r.status,
    });
    setError('');
    setInvSearch('');
    setInvDropdown(false);
    setLinkedInvoice(null);
    setModal({ mode: 'edit', id: r.id });
  };
  const closeModal = () => { setModal(null); setError(''); setLinkedInvoice(null); setInvSearch(''); };

  // ── Selección de cuenta de cobro pendiente ────────────────────────
  const selectInvoice = (inv) => {
    const overdue = inv.due_date && inv.due_date < today();
    setLinkedInvoice(inv);
    setInvSearch(inv.client_name ? `#${inv.number} – ${inv.client_name}` : `#${inv.number}`);
    setInvDropdown(false);
    setForm((p) => ({
      ...p,
      client_id:      inv.client_id ?? '',
      scheduled_date: inv.due_date ?? p.scheduled_date,
      title:          `Recordar pago cuenta de cobro #${inv.number}${inv.client_name ? ` – ${inv.client_name}` : ''}`,
      message:        `Hola${inv.client_name ? ` ${inv.client_name}` : ''}, te recuerdo que tienes${overdue ? ' vencida' : ' próxima a vencer'} la cuenta de cobro #${inv.number} por ${formatCOP(inv.total)}. ¡Gracias!\n\nAtentamente,\n${company?.name ?? 'Administrador'}`,
    }));
  };

  const clearLinkedInvoice = () => {
    setLinkedInvoice(null);
    setInvSearch('');
    setForm((p) => ({ ...p, client_id: '', title: '', message: '', scheduled_date: today() }));
  };

  // Filtrado del dropdown de invoices
  const filteredInvoices = pendingInvoices.filter((inv) => {
    if (!invSearch.trim()) return true;
    const q = invSearch.toLowerCase();
    return (
      String(inv.number).toLowerCase().includes(q) ||
      (inv.client_name ?? '').toLowerCase().includes(q) ||
      (inv.client_nit ?? '').toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    if (!form.title.trim()) { setError('El título es obligatorio'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        type:           form.type,
        title:          form.title.trim(),
        message:        form.message.trim() || null,
        scheduled_date: form.scheduled_date || null,
        client_id:      form.client_id || null,
        status:         form.status,
        updated_at:     new Date().toISOString(),
      };
      await saveMutation.mutateAsync({ mode: modal.mode, id: modal.id, payload });
      closeModal();
    } catch (e) {
      setError(e.message ?? 'Error al guardar');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este recordatorio?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleStatus = async (r, status) => {
    await statusMutation.mutateAsync({ id: r.id, status });
  };

  // ── Envío Brevo ───────────────────────────────────────────────────
  const openSendModal = (r) => {
    setSendModal(r);
    setSendResult(null);
  };

  const handleSendBrevo = async (channel) => {
    const r = sendModal;
    if (!r) return;
    setSending(true); setSendResult(null);
    try {
      if (channel === 'email') {
        const email = r.bapesu_clients?.email;
        if (!email) throw new Error('El cliente no tiene email registrado');
        await sendEmail({
          to:      email,
          toName:  r.bapesu_clients?.name,
          subject: r.title,
          html:    buildReminderEmail({ companyName: company?.name ?? '', title: r.title, message: r.message, type: r.type }),
        });
      } else {
        const phone = r.bapesu_clients?.phone;
        if (!phone) throw new Error('El cliente no tiene teléfono registrado');
        const text = `${r.title}${r.message ? '\n\n' + r.message : ''}`;
        await sendWhatsApp({ phone, text });
      }
      // Marcar como enviado
      await statusMutation.mutateAsync({ id: r.id, status: 'sent' });
      setSendResult({ ok: true, channel, msg: channel === 'email' ? 'Email enviado correctamente' : 'WhatsApp enviado correctamente' });
    } catch (e) {
      setSendResult({ ok: false, channel, msg: e.message ?? 'Error al enviar' });
    }
    setSending(false);
  };

  // WhatsApp rápido (enlace directo sin API)
  const openWhatsApp = (r) => {
    const raw   = r.bapesu_clients?.phone ?? '';
    const digits = raw.replace(/\D/g, '');
    // Si ya tiene código de país (más de 10 dígitos o empieza con 57) no lo duplicamos
    const phone  = digits
      ? digits.startsWith('57') && digits.length > 10
        ? digits
        : `57${digits}`
      : '';
    const text  = encodeURIComponent(`${r.title}${r.message ? '\n\n' + r.message : ''}`);
    const url   = phone
      ? `https://wa.me/${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // Filtrado
  const filtered = reminders.filter((r) => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.message ?? '').toLowerCase().includes(q) ||
        (r.bapesu_clients?.name ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Contadores para alertas
  const overdueCount  = reminders.filter(isOverdue).length;
  const todayCount    = reminders.filter(isDueToday).length;
  const pendingCount  = reminders.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Recordatorios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            {overdueCount > 0 && <span className="ml-2 text-red-500 font-semibold">· {overdueCount} vencido{overdueCount !== 1 ? 's' : ''}</span>}
            {todayCount > 0 && <span className="ml-2 text-yellow-600 font-semibold">· {todayCount} para hoy</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(TYPES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => openAdd(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition hover:shadow-sm ${t.color}`}
            >
              <span>{t.icon}</span>
              {t.short}
            </button>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {overdueCount > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {overdueCount} recordatorio{overdueCount !== 1 ? 's' : ''} vencido{overdueCount !== 1 ? 's' : ''} sin completar
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar recordatorios..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition"
          />
        </div>

        {/* Tipo */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-yellow-400/50"
        >
          <option value="all">Todos los tipos</option>
          {Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t.icon} {t.label}</option>)}
        </select>

        {/* Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-yellow-400/50"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-6 h-6 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl text-center">
          <span className="text-4xl mb-3">🔔</span>
          <p className="text-gray-700 font-semibold">
            {search || filter !== 'all' || statusFilter !== 'all' ? 'Sin resultados' : 'Aún no hay recordatorios'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Crea un recordatorio de pago, promoción o nuevo servicio.</p>
          {!search && filter === 'all' && statusFilter === 'all' && (
            <button onClick={() => openAdd()} className="mt-4 text-sm text-yellow-600 hover:text-yellow-700 font-medium">
              + Crear el primero
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const t   = TYPES[r.type] ?? TYPES.payment;
            const s   = STATUS[r.status] ?? STATUS.pending;
            const ov  = isOverdue(r);
            const td  = isDueToday(r);
            return (
              <div
                key={r.id}
                className={`bg-white border rounded-2xl shadow-sm transition hover:shadow-md overflow-hidden ${
                  ov ? 'border-red-200' : td ? 'border-yellow-300' : 'border-gray-200'
                }`}
              >
                {/* Cuerpo de la tarjeta */}
                <div className="p-4 flex items-start gap-4">
                  {/* Icono tipo */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.accent} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                    {t.icon}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 truncate">{r.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${t.color}`}>{t.short}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                      {ov && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">Vencido</span>}
                      {td && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-yellow-100 text-yellow-700">Hoy</span>}
                    </div>
                    {r.message && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.message}</p>}
                    <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] text-gray-400">
                      {r.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(r.scheduled_date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {r.bapesu_clients?.name && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {r.bapesu_clients.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Barra de acciones ── */}
                <div className="flex items-center gap-1 px-3 pb-3 flex-wrap">

                  {/* Estado: pendiente → enviado / hecho */}
                  {r.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatus(r, 'sent')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Enviado
                      </button>
                      <button
                        onClick={() => handleStatus(r, 'done')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Hecho
                      </button>
                    </>
                  )}
                  {r.status !== 'pending' && (
                    <button
                      onClick={() => handleStatus(r, 'pending')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-semibold transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Pendiente
                    </button>
                  )}

                  {/* Enviar (Brevo) */}
                  <button
                    onClick={() => openSendModal(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Enviar
                  </button>

                  {/* WhatsApp directo */}
                  <button
                    onClick={() => openWhatsApp(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.524 5.847L0 24l6.303-1.506A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.651-.52-5.16-1.427l-.37-.22-3.742.895.926-3.638-.241-.384A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    WhatsApp
                  </button>

                  {/* Separador + Editar + Eliminar al final */}
                  <div className="flex-1" />

                  <button
                    onClick={() => openEdit(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 text-xs font-semibold transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-semibold transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL ENVÍO BREVO ─────────────────────────────────────────── */}
      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { if (!sending) setSendModal(null); }} />
          <div className="relative w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Enviar recordatorio</h2>
                {!sending && (
                  <button onClick={() => setSendModal(null)} className="text-gray-400 hover:text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              {/* Info del recordatorio */}
              <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-semibold text-gray-800">{sendModal.title}</p>
                {sendModal.message && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{sendModal.message}</p>}
                {sendModal.bapesu_clients?.name && (
                  <p className="text-[11px] text-indigo-600 mt-1.5 font-medium">→ {sendModal.bapesu_clients.name}</p>
                )}
              </div>

              {/* Resultado */}
              {sendResult && (
                <div className={`mb-4 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${sendResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {sendResult.ok
                    ? <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  }
                  {sendResult.msg}
                </div>
              )}

              {/* Botones de canal */}
              {!sendResult?.ok && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-3">Enviar por email:</p>

                  <button
                    onClick={() => handleSendBrevo('email')}
                    disabled={sending}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition disabled:opacity-50 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Enviar por Email</p>
                      <p className="text-[11px] text-gray-400">{sendModal.bapesu_clients?.email ?? 'Sin email registrado'}</p>
                    </div>
                    {sending && <svg className="w-4 h-4 ml-auto animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  </button>
                </div>
              )}

              {sendResult?.ok && (
                <button onClick={() => setSendModal(null)} className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-semibold text-sm">
                  Listo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ─────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className={`h-1 w-full bg-gradient-to-r ${TYPES[form.type]?.accent ?? 'from-yellow-400 to-amber-500'}`} />

            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900">
                  {modal.mode === 'add' ? 'Nuevo recordatorio' : 'Editar recordatorio'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {/* Tipo */}
                <div>
                  <label className={LABEL}>Tipo de recordatorio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TYPES).map(([key, t]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setF('type', key)}
                        className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition ${
                          form.type === key
                            ? `border-current ${t.color}`
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span className="text-lg">{t.icon}</span>
                        {t.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buscador de cuenta de cobro pendiente (solo tipo Pago) */}
                {form.type === 'payment' && (
                  <div>
                    <label className={LABEL}>
                      Cuenta de cobro pendiente
                      <span className="ml-1 text-gray-400 font-normal">(opcional — auto-completa el formulario)</span>
                    </label>

                    {linkedInvoice ? (
                      /* Invoice vinculada */
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-emerald-300 bg-emerald-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-emerald-800 truncate">
                            #{linkedInvoice.number}
                            {linkedInvoice.client_name && <span className="font-normal text-emerald-700"> – {linkedInvoice.client_name}</span>}
                          </p>
                          <p className="text-[11px] text-emerald-600">
                            {formatCOP(linkedInvoice.total)}
                            {linkedInvoice.due_date && (
                              <span className={`ml-2 ${linkedInvoice.due_date < today() ? 'text-red-500 font-semibold' : ''}`}>
                                · Vence {new Date(linkedInvoice.due_date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {linkedInvoice.due_date < today() && ' ⚠'}
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearLinkedInvoice}
                          className="flex-shrink-0 w-6 h-6 rounded-lg text-emerald-500 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition"
                          title="Desvincular"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      /* Buscador */
                      <div className="relative">
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            className={INPUT + ' pl-9'}
                            value={invSearch}
                            onChange={(e) => { setInvSearch(e.target.value); setInvDropdown(true); }}
                            onFocus={() => setInvDropdown(true)}
                            onBlur={() => setTimeout(() => setInvDropdown(false), 150)}
                            placeholder={pendingInvoices.length === 0 ? 'Sin cuentas de cobro pendientes' : `Buscar entre ${pendingInvoices.length} pendiente${pendingInvoices.length !== 1 ? 's' : ''}...`}
                            disabled={pendingInvoices.length === 0}
                          />
                        </div>

                        {invDropdown && filteredInvoices.length > 0 && (
                          <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                            {filteredInvoices.map((inv) => {
                              const overdue = inv.due_date && inv.due_date < today();
                              return (
                                <button
                                  key={inv.id}
                                  type="button"
                                  onMouseDown={() => selectInvoice(inv)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-0"
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${overdue ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                    #{inv.number}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                      {inv.client_name ?? '(sin cliente)'}
                                      {inv.client_nit && <span className="text-gray-400 text-[11px] ml-1">NIT: {inv.client_nit}</span>}
                                    </p>
                                    <p className={`text-[11px] ${overdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                                      {formatCOP(inv.total)}
                                      {inv.due_date && ` · Vence ${new Date(inv.due_date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`}
                                      {overdue && ' ⚠ Vencida'}
                                    </p>
                                  </div>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${inv.status === 'sent' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {inv.status === 'sent' ? 'Enviada' : 'Borrador'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {invDropdown && invSearch.trim() && filteredInvoices.length === 0 && (
                          <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs text-gray-400">
                            Sin resultados para &quot;{invSearch}&quot;
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Título */}
                <div>
                  <label className={LABEL}>Título *</label>
                  <input
                    className={INPUT}
                    value={form.title}
                    onChange={(e) => setF('title', e.target.value)}
                    placeholder="Ej: Recordar pago factura #002"
                    autoFocus
                  />
                </div>

                {/* Mensaje */}
                <div>
                  <label className={LABEL}>Mensaje (opcional)</label>
                  <textarea
                    rows={3}
                    className={INPUT + ' resize-none'}
                    value={form.message}
                    onChange={(e) => setF('message', e.target.value)}
                    placeholder="Hola, te recuerdo que tienes un pago pendiente..."
                  />
                </div>

                {/* Fecha + cliente */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Fecha</label>
                    <input
                      type="date"
                      className={INPUT}
                      value={form.scheduled_date}
                      onChange={(e) => setF('scheduled_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Cliente (opcional)</label>
                    <select
                      className={INPUT}
                      value={form.client_id}
                      onChange={(e) => setF('client_id', e.target.value)}
                    >
                      <option value="">— Todos —</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <label className={LABEL}>Estado</label>
                  <div className="flex gap-2">
                    {Object.entries(STATUS).map(([key, s]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setF('status', key)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition ${
                          form.status === key
                            ? `${s.color} border-current`
                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold text-sm transition disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : (modal.mode === 'add' ? 'Crear recordatorio' : 'Actualizar')}
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
