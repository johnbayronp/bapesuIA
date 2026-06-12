import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { operationsApi, inventoryApi } from '../../../../api';
import { useCompany } from '../../../../context/CompanyContext';
import { queryKeys } from '../../../../lib/queryKeys';
import { EMPTY_ARRAY, invalidateCompanyData, unwrapSupabaseCount, unwrapSupabaseResponse } from '../../../../lib/queryUtils';

// Alias para queries puntuales que no justifican un método en la capa api aún
const PREFIX = { entrada: 'ENT', salida: 'SAL', traslado: 'TRF', conteo: 'CNT' };

const EMPTY_OP = {
  type:          'entrada',
  reference:     '',
  op_date:       new Date().toISOString().slice(0, 10),
  supplier_id:   '',
  warehouse_from: '',
  warehouse_to:  '',
  client_ref:    '',
  notes:         '',
};

const EMPTY_ITEM = { product_id: '', quantity: '', unit_cost: '', qty_counted: '', lot_number: '', expiry_date: '', notes: '' };

export const OP_TYPES = {
  entrada:  { label: 'Entrada / Recepción',   icon: '📥', color: 'from-emerald-400 to-teal-500',   accent: 'emerald', desc: 'Compras, órdenes de compra, proveedores' },
  salida:   { label: 'Salida / Despacho',     icon: '📤', color: 'from-red-400 to-rose-500',        accent: 'red',     desc: 'Ventas, consumos internos, devoluciones' },
  traslado: { label: 'Traslado entre bodegas',icon: '🔄', color: 'from-blue-400 to-indigo-500',     accent: 'blue',    desc: 'Movimientos entre sedes, control de tránsito' },
  conteo:   { label: 'Conteo físico / Ajuste',icon: '📋', color: 'from-violet-400 to-purple-500',   accent: 'violet',  desc: 'Inventario cíclico, ajustes por diferencias' },
};

export function useOperations() {
  const { user, company } = useCompany();

  const [error,      setError]      = useState('');
  const queryClient = useQueryClient();

  const [opModal, setOpModal]     = useState(null);
  const [opForm,  setOpForm]      = useState(EMPTY_OP);
  const [items,   setItems]       = useState([{ ...EMPTY_ITEM }]);

  // Modales proveedores / bodegas
  const [suppModal, setSuppModal] = useState(null); // null | { mode:'add'|'edit', id? }
  const [suppForm,  setSuppForm]  = useState({ name:'', nit:'', contact:'', email:'', phone:'', address:'', notes:'' });
  const [whModal,   setWhModal]   = useState(null);
  const [whForm,    setWhForm]    = useState({ name:'', address:'', description:'' });

  const operationsQuery = useQuery({
    queryKey: queryKeys.company.inventory.operations(company?.id),
    enabled: Boolean(company?.id),
    queryFn: async () => {
      const [opsRes, suppRes, whRes, invRes, facRes] = await Promise.all([
        operationsApi.list(company.id),
        operationsApi.listSuppliers(company.id),
        operationsApi.listWarehouses(company.id),
        operationsApi.listPendingInvoices(company.id),
        operationsApi.listPendingFacturas(company.id),
      ]);
      const invoices = unwrapSupabaseResponse(invRes).map((d) => ({ id: d.id, label: `CC #${d.number} ? ${d.client_name}`, amount: d.total, type: 'cuenta' }));
      const facturas = unwrapSupabaseResponse(facRes).map((d) => ({ id: d.id, label: `FAC ${d.prefix ?? ''}${d.number} ? ${d.client_name}`, amount: d.total, type: 'factura' }));
      return {
        ops: unwrapSupabaseResponse(opsRes),
        suppliers: unwrapSupabaseResponse(suppRes),
        warehouses: unwrapSupabaseResponse(whRes),
        pendingDocs: [...invoices, ...facturas],
      };
    },
  });

  const ops = operationsQuery.data?.ops ?? EMPTY_ARRAY;
  const suppliers = operationsQuery.data?.suppliers ?? EMPTY_ARRAY;
  const warehouses = operationsQuery.data?.warehouses ?? EMPTY_ARRAY;
  const pendingDocs = operationsQuery.data?.pendingDocs ?? EMPTY_ARRAY;
  const load = () => operationsQuery.refetch();

  const actionMutation = useMutation({
    mutationFn: (fn) => fn(),
    onSuccess: async () => {
      await invalidateCompanyData(queryClient, company?.id);
      await operationsQuery.refetch();
    },
  });

  const saving = actionMutation.isPending;
  const loading = operationsQuery.isLoading;
  // ── Helpers form ─────────────────────────────────────────
  const setOF = (k, v) => setOpForm((p) => ({ ...p, [k]: v }));

  const addItem    = ()  => setItems((p) => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i));
  const setItem    = (i, k, v) => setItems((p) => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  // ── Modal ────────────────────────────────────────────────
  const openNewOp = async (type = 'entrada') => {
    // Auto-generar referencia: ENT-2026-003
    const year = new Date().getFullYear();
    const count = await queryClient.fetchQuery({
      queryKey: [...queryKeys.company.inventory.operations(company?.id), 'count', type],
      queryFn: () => operationsApi.countByType(company.id, type).then(unwrapSupabaseCount),
    });
    const seq = String((count ?? 0) + 1).padStart(3, '0');
    const autoRef = `${PREFIX[type]}-${year}-${seq}`;

    setOpForm({ ...EMPTY_OP, type, op_date: new Date().toISOString().slice(0, 10), reference: autoRef });
    setItems([{ ...EMPTY_ITEM }]);
    setError('');
    setOpModal({ mode: 'add', type });
  };

  const openEditOp = async (op) => {
    setOpForm({
      type:          op.type,
      reference:     op.reference ?? '',
      op_date:       op.op_date ?? new Date().toISOString().slice(0, 10),
      supplier_id:   op.supplier_id ?? '',
      warehouse_from: op.warehouse_from ?? '',
      warehouse_to:  op.warehouse_to ?? '',
      client_ref:    op.client_ref ?? '',
      notes:         op.notes ?? '',
    });
    const its = await queryClient.fetchQuery({
      queryKey: queryKeys.company.inventory.opItems(op.id),
      queryFn: () => operationsApi.listRawItemsOrdered(op.id).then(unwrapSupabaseResponse),
    });
    setItems(its?.length ? its.map((it) => ({
      product_id:  it.product_id,
      quantity:    String(it.quantity),
      unit_cost:   String(it.unit_cost ?? ''),
      qty_counted: String(it.qty_counted ?? ''),
      lot_number:  it.lot_number ?? '',
      expiry_date: it.expiry_date ?? '',
      notes:       it.notes ?? '',
    })) : [{ ...EMPTY_ITEM }]);
    setError('');
    setOpModal({ mode: 'edit', type: op.type, id: op.id });
  };

  const closeOpModal = () => { setOpModal(null); setError(''); };

  // ── Guardar operación (sin confirmar aún) ────────────────
  const handleSaveOp = async (confirm = false) => {
    if (items.every((it) => !it.product_id)) { setError('Agrega al menos un producto'); return; } setError('');
    try {
      const payload = {
        type:          opForm.type,
        reference:     opForm.reference.trim() || null,
        op_date:       opForm.op_date || new Date().toISOString().slice(0, 10),
        supplier_id:   opForm.supplier_id  || null,
        warehouse_from: opForm.warehouse_from || null,
        warehouse_to:  opForm.warehouse_to  || null,
        client_ref:    opForm.client_ref.trim() || null,
        notes:         opForm.notes.trim()   || null,
        status:        'borrador', // siempre borrador; applyStockEffects lo marca confirmado
        updated_at:    new Date().toISOString(),
      };

      let opId = opModal.id;

      if (opModal.mode === 'add') {
        const { data: newOp, error: e } = await operationsApi.create({ ...payload, company_id: company.id, created_by: user?.id ?? null });
        if (e) throw e;
        opId = newOp.id;
      } else {
        const { error: e } = await operationsApi.update(opId, payload);
        if (e) throw e;
        const removeRes = await operationsApi.removeItems(opId);
        if (removeRes.error) throw removeRes.error;
      }

      // Insertar items
      const validItems = items.filter((it) => it.product_id);
      if (validItems.length) {
        const { error: ei } = await operationsApi.addItems(
          validItems.map((it, idx) => ({
            op_id:       opId,
            product_id:  it.product_id,
            quantity:    parseFloat(it.quantity) || 0,
            unit_cost:   parseFloat(String(it.unit_cost).replace(/\./g,'').replace(/,/g,'')) || 0,
            qty_counted: parseFloat(it.qty_counted) || 0,
            lot_number:  it.lot_number || null,
            expiry_date: it.expiry_date || null,
            notes:       it.notes || null,
            position:    idx,
          }))
        );
        if (ei) throw ei;
      }

      // Si confirmar → aplicar movimientos de stock
      if (confirm) await applyStockEffects(opId, opForm.type, validItems);

      await load();
      closeOpModal();
    } catch (e) { setError(e.message ?? 'Error al guardar'); }
  };

  // ── Aplicar efectos de stock al confirmar ────────────────
  // Si `revert` = true, invierte el efecto (sumar lo que se restó y viceversa)
  const applyStockEffects = async (opId, type, validItems, revert = false) => {
    if (!validItems?.length) throw new Error('La operación no tiene productos con cantidad.');

    for (const it of validItems) {
      const qty       = Number(it.quantity)    || 0;
      const counted   = Number(it.qty_counted) || 0;
      // En conteo lo relevante es qty_counted (no quantity)
      const relevant  = type === 'conteo' ? counted : qty;
      if (!relevant && type !== 'conteo') continue;

      const { data: prod, error: pe } = await inventoryApi.getProductStock(it.product_id);
      if (pe || !prod) throw new Error(`No se encontró el producto (${it.product_id.slice(0, 8)})`);

      const cur = Number(prod.stock_available) || 0;
      let newStock = cur;
      let mvType   = 'ajuste';
      let mvQty    = 0;

      if (type === 'entrada') {
        const delta = revert ? -qty : qty;
        newStock = Math.max(+(cur + delta).toFixed(3), 0);
        mvType   = revert ? 'salida' : 'entrada';
        mvQty    = +delta.toFixed(3);
      }
      if (type === 'salida') {
        const delta = revert ? qty : -qty;
        newStock = Math.max(+(cur + delta).toFixed(3), 0);
        mvType   = revert ? 'entrada' : 'salida';
        mvQty    = +delta.toFixed(3);
      }
      if (type === 'traslado') {
        newStock = cur;
        mvType   = 'ajuste';
        mvQty    = 0;
      }
      if (type === 'conteo') {
        if (revert) {
          newStock = cur;
          mvType   = 'ajuste';
          mvQty    = 0;
        } else {
          newStock = Math.max(+counted.toFixed(3), 0);
          mvType   = 'ajuste';
          mvQty    = +((newStock - cur).toFixed(3));
        }
      }

      const { error: ue } = await inventoryApi.updateProduct(it.product_id, { stock_available: newStock, updated_at: new Date().toISOString() });
      if (ue) throw new Error(`Error actualizando stock de "${prod.name}": ${ue.message}`);

      if (mvQty !== 0 || type === 'conteo') {
        const { error: me } = await inventoryApi.addMovement({
          company_id: company.id,
          product_id: it.product_id,
          type:       mvType,
          quantity:   +mvQty.toFixed(3),
          notes:      `${revert ? 'Reversa ' : ''}Op. ${type} #${opId.slice(0, 8)}`,
          created_by: user?.id ?? null,
        });
        if (me) throw new Error(`Error registrando movimiento: ${me.message}`);
      }
    }

    if (!revert) {
      const { error: ce } = await operationsApi.update(opId, { status: 'confirmado', confirmed_at: new Date().toISOString(), confirmed_by: user?.id ?? null });
      if (ce) throw new Error(`Error confirmando operación: ${ce.message}`);
    }
  };

  // ── Re-aplicar stock a una operación ya confirmada ──────
  const handleReapplyStock = async (op) => {
    if (!window.confirm(`¿Re-aplicar stock para "${OP_TYPES[op.type]?.label} ${op.reference}"?\n\nEsto volverá a aplicar el efecto sobre el stock. Úsalo sólo si el stock no se actualizó al confirmar.`)) return;
    try {
      const its = await queryClient.fetchQuery({
        queryKey: queryKeys.company.inventory.opItems(op.id),
        queryFn: () => operationsApi.listRawItems(op.id).then(unwrapSupabaseResponse),
      });
      if (!its?.length) { alert('Esta operación no tiene productos registrados.'); return; }
      await applyStockEffects(op.id, op.type, its);
      alert('Stock re-aplicado correctamente.');
      await load();
    } catch (e) { alert('Error: ' + (e.message ?? 'intenta de nuevo')); }
  };

  // ── Confirmar operación borrador ─────────────────────────
  const handleConfirmOp = async (op) => {
    if (!window.confirm(`¿Confirmar esta ${OP_TYPES[op.type]?.label}? Se actualizará el stock de todos los productos.`)) return;
    try {
      const its = await queryClient.fetchQuery({
        queryKey: queryKeys.company.inventory.opItems(op.id),
        queryFn: () => operationsApi.listRawItems(op.id).then(unwrapSupabaseResponse),
      });
      await applyStockEffects(op.id, op.type, its ?? []);
      await load();
    } catch (e) { alert('Error: ' + (e.message ?? 'intenta de nuevo')); }
  };

  // ── Anular operación: si estaba confirmada, revierte el stock ──
  const handleCancelOp = async (op) => {
    const willRevert = op.status === 'confirmado';
    const msg = willRevert
      ? `¿Anular ${op.reference}?\n\nSe REVERTIRÁ el efecto sobre el stock (lo que sumó se restará y viceversa).`
      : '¿Anular esta operación?';
    if (!window.confirm(msg)) return;
    try {
      if (willRevert) {
        const its = await queryClient.fetchQuery({
          queryKey: queryKeys.company.inventory.opItems(op.id),
          queryFn: () => operationsApi.listRawItems(op.id).then(unwrapSupabaseResponse),
        });
        if (its?.length) await applyStockEffects(op.id, op.type, its, true);
      }
      await operationsApi.update(op.id, { status: 'anulado', updated_at: new Date().toISOString() });
      await load();
    } catch (e) { alert('Error: ' + (e.message ?? 'intenta de nuevo')); }
  };

  const handleDeleteOp = async (op) => {
    if (op.status === 'confirmado') {
      alert('No puedes eliminar una operación confirmada. Anúlala primero.');
      return;
    }
    if (!window.confirm('¿Eliminar esta operación?')) return;
    await operationsApi.removeItems(op.id);
    await operationsApi.remove(op.id);
    await load();
  };

  // ── Proveedores CRUD ────────────────────────────────────────
  const openAddSupplier  = () => { setSuppForm({ name:'', nit:'', contact:'', email:'', phone:'', address:'', notes:'' }); setSuppModal({ mode:'add' }); };
  const openEditSupplier = (s) => { setSuppForm({ name: s.name, nit: s.nit??'', contact: s.contact??'', email: s.email??'', phone: s.phone??'', address: s.address??'', notes: s.notes??'' }); setSuppModal({ mode:'edit', id: s.id }); };
  const closeSuppModal   = () => setSuppModal(null);
  const setSF = (k, v) => setSuppForm((p) => ({ ...p, [k]: v }));

  const handleSaveSupplier = async () => {
    if (!suppForm.name.trim()) return;
    const { error: e } = suppModal.mode === 'add'
      ? await operationsApi.createSupplier({ ...suppForm, company_id: company.id, is_active: true })
      : await operationsApi.updateSupplier(suppModal.id, { ...suppForm, updated_at: new Date().toISOString() });
    if (e) { alert('Error al guardar proveedor: ' + e.message); return; }
    await load(); closeSuppModal();
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('¿Eliminar proveedor?')) return;
    await operationsApi.deleteSupplier(id);
    await load();
  };

  // ── Bodegas CRUD ─────────────────────────────────────────────
  const openAddWarehouse  = () => { setWhForm({ name:'', address:'', description:'' }); setWhModal({ mode:'add' }); };
  const openEditWarehouse = (w) => { setWhForm({ name: w.name, address: w.address??'', description: w.description??'' }); setWhModal({ mode:'edit', id: w.id }); };
  const closeWhModal      = () => setWhModal(null);
  const setWF = (k, v) => setWhForm((p) => ({ ...p, [k]: v }));

  const handleSaveWarehouse = async () => {
    if (!whForm.name.trim()) return;
    const { error: e } = whModal.mode === 'add'
      ? await operationsApi.createWarehouse({ ...whForm, company_id: company.id, is_active: true })
      : await operationsApi.updateWarehouse(whModal.id, { ...whForm, updated_at: new Date().toISOString() });
    if (e) { alert('Error al guardar bodega: ' + e.message); return; }
    await load(); closeWhModal();
  };

  const handleDeleteWarehouse = async (id) => {
    if (!window.confirm('¿Eliminar bodega?')) return;
    await operationsApi.deleteWarehouse(id);
    await load();
  };

  return {
    ops, suppliers, warehouses, pendingDocs, loading, saving, error,
    opModal, opForm, setOF, items, setItem, addItem, removeItem,
    openNewOp, openEditOp, closeOpModal,
    handleSaveOp, handleConfirmOp, handleCancelOp, handleDeleteOp, handleReapplyStock,
    // Proveedores
    suppModal, suppForm, setSF, openAddSupplier, openEditSupplier, closeSuppModal, handleSaveSupplier, handleDeleteSupplier,
    // Bodegas
    whModal, whForm, setWF, openAddWarehouse, openEditWarehouse, closeWhModal, handleSaveWarehouse, handleDeleteWarehouse,
  };
}
