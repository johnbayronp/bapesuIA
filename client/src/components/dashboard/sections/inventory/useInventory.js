import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../../../../api';
import { useCompany } from '../../../../context/CompanyContext';
import { queryKeys } from '../../../../lib/queryKeys';
import { EMPTY_ARRAY, invalidateCompanyData, unwrapSupabaseResponse } from '../../../../lib/queryUtils';
import { EMPTY_PRODUCT, EMPTY_CATEGORY } from './constants';

export function useInventory() {
  const { user, company } = useCompany();
  const queryClient = useQueryClient();

  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [error,      setError]      = useState('');

  // Modales
  const [productModal,  setProductModal]  = useState(null); // null | { mode, id? }
  const [categoryModal, setCategoryModal] = useState(null);
  const [stockModal,    setStockModal]    = useState(null); // { product }

  // Formularios
  const [productForm,  setProductForm]  = useState(EMPTY_PRODUCT);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [stockForm,    setStockForm]    = useState({ type: 'entrada', quantity: '', notes: '' });

  // ── Carga ───────────────────────────────────────────────────
  const productsQuery = useQuery({
    queryKey: queryKeys.company.inventory.products(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => inventoryApi.listProducts(company.id).then(unwrapSupabaseResponse),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.company.inventory.categories(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => inventoryApi.listCategories(company.id).then(unwrapSupabaseResponse),
  });

  const movementsQuery = useQuery({
    queryKey: queryKeys.company.inventory.movements(company?.id),
    enabled: Boolean(company?.id),
    queryFn: () => inventoryApi.listMovements(company.id).then(unwrapSupabaseResponse),
  });

  const products = productsQuery.data ?? EMPTY_ARRAY;
  const categories = categoriesQuery.data ?? EMPTY_ARRAY;
  const movements = movementsQuery.data ?? EMPTY_ARRAY;
  const loading = productsQuery.isLoading || categoriesQuery.isLoading || movementsQuery.isLoading;
  const load = () => invalidateCompanyData(queryClient, company?.id);

  const productMutation = useMutation({
    mutationFn: async ({ action, id, payload }) => {
      const response = action === 'create'
        ? await inventoryApi.createProduct(payload)
        : action === 'delete'
        ? await inventoryApi.deleteProduct(id)
        : await inventoryApi.updateProduct(id, payload);
      if (response.error) throw response.error;
      return response.data ?? null;
    },
    onSuccess: load,
  });

  const categoryMutation = useMutation({
    mutationFn: async ({ action, id, payload }) => {
      const response = action === 'create'
        ? await inventoryApi.createCategory(payload)
        : action === 'delete'
        ? await inventoryApi.deleteCategory(id)
        : await inventoryApi.updateCategory(id, payload);
      if (response.error) throw response.error;
      return response.data ?? null;
    },
    onSuccess: load,
  });

  const stockMutation = useMutation({
    mutationFn: async ({ productId, stockPayload, movementPayload }) => {
      const productResponse = await inventoryApi.updateProduct(productId, stockPayload);
      if (productResponse.error) throw productResponse.error;
      const movementResponse = await inventoryApi.addMovement(movementPayload);
      if (movementResponse.error) throw movementResponse.error;
    },
    onSuccess: load,
  });

  // ── Helpers de form ─────────────────────────────────────────
  const setPF = (k, v) => setProductForm((p)  => ({ ...p, [k]: v }));
  const setCF = (k, v) => setCategoryForm((p) => ({ ...p, [k]: v }));
  const setSF = (k, v) => setStockForm((p)    => ({ ...p, [k]: v }));

  // ── Modal Producto ──────────────────────────────────────────
  const openAddProduct = () => {
    setProductForm(EMPTY_PRODUCT);
    setError('');
    setProductModal({ mode: 'add' });
  };
  const openEditProduct = (p) => {
    setProductForm({
      name:             p.name,
      sku:              p.sku ?? '',
      barcode:          p.barcode ?? '',
      description:      p.description ?? '',
      category_id:      p.category_id ?? '',
      unit:             p.unit ?? 'unidad',
      photo_url:        p.photo_url ?? '',
      is_active:        p.is_active ?? true,
      stock_available:  p.stock_available ?? 0,
      stock_reserved:   p.stock_reserved ?? 0,
      stock_in_transit: p.stock_in_transit ?? 0,
      stock_min:        p.stock_min ?? 0,
      stock_location:   p.stock_location ?? '',
      supplier_id:      p.supplier_id ?? '',
      purchase_price:   String(p.purchase_price ?? ''),
      sale_price:       String(p.sale_price ?? ''),
      tax_rate:         p.tax_rate ?? 19,
    });
    setError('');
    setProductModal({ mode: 'edit', id: p.id });
  };
  const closeProductModal = () => { setProductModal(null); setError(''); };

  // ── Guardar producto ────────────────────────────────────────
  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name:             productForm.name.trim(),
        sku:              productForm.sku.trim() || null,
        barcode:          productForm.barcode.trim() || null,
        description:      productForm.description.trim() || null,
        category_id:      productForm.category_id || null,
        unit:             productForm.unit || 'unidad',
        photo_url:        productForm.photo_url.trim() || null,
        is_active:        productForm.is_active,
        stock_available:  Number(productForm.stock_available) || 0,
        stock_reserved:   Number(productForm.stock_reserved)  || 0,
        stock_in_transit: Number(productForm.stock_in_transit) || 0,
        stock_min:        Number(productForm.stock_min)        || 0,
        stock_location:   productForm.stock_location.trim() || null,
        supplier_id:      productForm.supplier_id || null,
        purchase_price:   parseFloat(String(productForm.purchase_price).replace(/\./g,'').replace(/,/g,'')) || 0,
        sale_price:       parseFloat(String(productForm.sale_price).replace(/\./g,'').replace(/,/g,''))     || 0,
        tax_rate:         Number(productForm.tax_rate) || 19,
        updated_at:       new Date().toISOString(),
      };
      if (productModal.mode === 'add') {
        await productMutation.mutateAsync({
          action: 'create',
          payload: { ...payload, company_id: company.id, created_by: user?.id ?? null },
        });
      } else {
        await productMutation.mutateAsync({ action: 'update', id: productModal.id, payload });
      }
      closeProductModal();
    } catch (e) { setError(e.message ?? 'Error al guardar'); }
    setSaving(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    setDeleting(id);
    await productMutation.mutateAsync({ action: 'delete', id });
    setDeleting(null);
  };

  const handleToggleProduct = async (p) => {
    await productMutation.mutateAsync({ action: 'update', id: p.id, payload: { is_active: !p.is_active } });
  };

  // ── Modal Categoría ─────────────────────────────────────────
  const openAddCategory = () => {
    setCategoryForm(EMPTY_CATEGORY);
    setError('');
    setCategoryModal({ mode: 'add' });
  };
  const openEditCategory = (c) => {
    setCategoryForm({ name: c.name, description: c.description ?? '', color: c.color ?? '#6366f1', parent_id: c.parent_id ?? '' });
    setError('');
    setCategoryModal({ mode: 'edit', id: c.id });
  };
  const closeCategoryModal = () => { setCategoryModal(null); setError(''); };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name:        categoryForm.name.trim(),
        description: categoryForm.description.trim() || null,
        color:       categoryForm.color,
        parent_id:   categoryForm.parent_id || null,
      };
      if (categoryModal.mode === 'add') {
        await categoryMutation.mutateAsync({ action: 'create', payload: { ...payload, company_id: company.id } });
      } else {
        await categoryMutation.mutateAsync({ action: 'update', id: categoryModal.id, payload });
      }
      closeCategoryModal();
    } catch (e) { setError(e.message ?? 'Error al guardar'); }
    setSaving(false);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría? Los productos vinculados quedarán sin categoría.')) return;
    await categoryMutation.mutateAsync({ action: 'delete', id });
  };

  // ── Modal Stock ─────────────────────────────────────────────
  const openStockModal = (product) => {
    setStockForm({ type: 'entrada', quantity: '', notes: '' });
    setError('');
    setStockModal(product);
  };
  const closeStockModal = () => { setStockModal(null); setError(''); };

  const handleSaveStock = async () => {
    const qty = parseFloat(stockForm.quantity);
    if (!qty || qty <= 0) { setError('Ingresa una cantidad válida'); return; }
    setSaving(true); setError('');
    try {
      const p        = stockModal;
      const current  = Number(p.stock_available) || 0;
      const newStock = stockForm.type === 'entrada'
        ? +((current + qty).toFixed(3))
        : stockForm.type === 'salida'
        ? Math.max(+((current - qty).toFixed(3)), 0)
        : +qty.toFixed(3); // ajuste directo

      await stockMutation.mutateAsync({
        productId: p.id,
        stockPayload: { stock_available: newStock, updated_at: new Date().toISOString() },
        movementPayload: {
          company_id: company.id,
          product_id: p.id,
          type:       stockForm.type,
          quantity:   stockForm.type === 'salida' ? -qty : qty,
          notes:      stockForm.notes.trim() || null,
          created_by: user?.id ?? null,
        },
      });
      closeStockModal();
    } catch (e) { setError(e.message ?? 'Error al ajustar stock'); }
    setSaving(false);
  };

  return {
    products, categories, movements, loading, saving, deleting, error,
    // product modal
    productModal, productForm, setPF,
    openAddProduct, openEditProduct, closeProductModal,
    handleSaveProduct, handleDeleteProduct, handleToggleProduct,
    // category modal
    categoryModal, categoryForm, setCF,
    openAddCategory, openEditCategory, closeCategoryModal,
    handleSaveCategory, handleDeleteCategory,
    // stock modal
    stockModal, stockForm, setSF,
    openStockModal, closeStockModal, handleSaveStock,
  };
}
