import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useCompany } from '../../../../context/CompanyContext';
import { EMPTY_PRODUCT, EMPTY_CATEGORY } from './constants';

export function useInventory() {
  const { user, company } = useCompany();

  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements,  setMovements]  = useState([]);
  const [loading,    setLoading]    = useState(true);
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
  const load = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    const [prod, cat, mov] = await Promise.all([
      supabase
        .from('bapesu_products')
        .select('*, bapesu_inventory_categories(id,name,color)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('bapesu_inventory_categories')
        .select('*')
        .eq('company_id', company.id)
        .order('name'),
      supabase
        .from('bapesu_stock_movements')
        .select('*, bapesu_products(name)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    setProducts(prod.data  ?? []);
    setCategories(cat.data ?? []);
    setMovements(mov.data  ?? []);
    setLoading(false);
  }, [company]);

  useEffect(() => { load(); }, [load]);

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
        purchase_price:   parseFloat(String(productForm.purchase_price).replace(/\./g,'').replace(/,/g,'')) || 0,
        sale_price:       parseFloat(String(productForm.sale_price).replace(/\./g,'').replace(/,/g,''))     || 0,
        tax_rate:         Number(productForm.tax_rate) || 19,
        updated_at:       new Date().toISOString(),
      };
      if (productModal.mode === 'add') {
        const { error: e } = await supabase
          .from('bapesu_products')
          .insert({ ...payload, company_id: company.id, created_by: user?.id ?? null });
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('bapesu_products').update(payload).eq('id', productModal.id);
        if (e) throw e;
      }
      await load();
      closeProductModal();
    } catch (e) { setError(e.message ?? 'Error al guardar'); }
    setSaving(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    setDeleting(id);
    await supabase.from('bapesu_products').delete().eq('id', id);
    await load();
    setDeleting(null);
  };

  const handleToggleProduct = async (p) => {
    await supabase.from('bapesu_products').update({ is_active: !p.is_active }).eq('id', p.id);
    await load();
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
        const { error: e } = await supabase.from('bapesu_inventory_categories').insert({ ...payload, company_id: company.id });
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('bapesu_inventory_categories').update(payload).eq('id', categoryModal.id);
        if (e) throw e;
      }
      await load();
      closeCategoryModal();
    } catch (e) { setError(e.message ?? 'Error al guardar'); }
    setSaving(false);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría? Los productos vinculados quedarán sin categoría.')) return;
    await supabase.from('bapesu_inventory_categories').delete().eq('id', id);
    await load();
  };

  // ── Modal Stock ─────────────────────────────────────────────
  const openStockModal = (product) => {
    setStockForm({ type: 'entrada', quantity: '', notes: '' });
    setError('');
    setStockModal(product);
  };
  const closeStockModal = () => { setStockModal(null); setError(''); };

  const handleSaveStock = async () => {
    const qty = parseInt(stockForm.quantity);
    if (!qty || qty <= 0) { setError('Ingresa una cantidad válida'); return; }
    setSaving(true); setError('');
    try {
      const p        = stockModal;
      const current  = p.stock_available ?? 0;
      const newStock = stockForm.type === 'entrada'
        ? current + qty
        : stockForm.type === 'salida'
        ? Math.max(current - qty, 0)
        : qty; // ajuste directo

      await supabase.from('bapesu_products').update({ stock_available: newStock, updated_at: new Date().toISOString() }).eq('id', p.id);
      await supabase.from('bapesu_stock_movements').insert({
        company_id: company.id,
        product_id: p.id,
        type:       stockForm.type,
        quantity:   stockForm.type === 'salida' ? -qty : qty,
        notes:      stockForm.notes.trim() || null,
        created_by: user?.id ?? null,
      });
      await load();
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
