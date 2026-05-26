import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInventory } from './useInventory';
import ProductsTab   from './tabs/ProductsTab';
import StockTab      from './tabs/StockTab';
import PricesTab     from './tabs/PricesTab';
import CategoriesTab from './tabs/CategoriesTab';
import ProductModal      from './modals/ProductModal';
import CategoryModal     from './modals/CategoryModal';
import StockAdjustModal  from './modals/StockAdjustModal';

const TABS = [
  { id: 'products',   label: 'Ficha de producto', icon: '📦' },
  { id: 'stock',      label: 'Stock en tiempo real', icon: '📊' },
  { id: 'prices',     label: 'Precios y costos',  icon: '🏷️' },
  { id: 'categories', label: 'Categorías',        icon: '🗂️' },
];

export default function InventoryModule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.find((t) => t.id === searchParams.get('tab'))?.id ?? 'products';
  const setTab    = (id) => setSearchParams({ tab: id }, { replace: true });

  const inv = useInventory();

  const lowStock = inv.products.filter((p) => p.stock_available > 0 && p.stock_available <= (p.stock_min ?? 0)).length;
  const outStock = inv.products.filter((p) => (p.stock_available ?? 0) <= 0).length;

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-3">
            {inv.products.length} producto{inv.products.length !== 1 ? 's' : ''}
            {outStock > 0 && <span className="text-red-500 font-semibold">· {outStock} sin stock</span>}
            {lowStock > 0 && <span className="text-yellow-600 font-semibold">· {lowStock} stock bajo</span>}
          </p>
        </div>
        <button
          onClick={inv.openAddProduct}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm transition shadow-[0_4px_16px_rgba(99,102,241,0.3)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo producto
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === t.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      {inv.loading ? (
        <div className="flex items-center justify-center py-24">
          <svg className="w-7 h-7 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <>
          {activeTab === 'products' && (
            <ProductsTab
              products={inv.products}
              categories={inv.categories}
              onEdit={inv.openEditProduct}
              onDelete={inv.handleDeleteProduct}
              onAdjustStock={inv.openStockModal}
              onToggle={inv.handleToggleProduct}
              deleting={inv.deleting}
            />
          )}
          {activeTab === 'stock' && (
            <StockTab
              products={inv.products}
              movements={inv.movements}
              onAdjustStock={inv.openStockModal}
            />
          )}
          {activeTab === 'prices' && (
            <PricesTab
              products={inv.products}
              onEdit={inv.openEditProduct}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab
              categories={inv.categories}
              products={inv.products}
              onAdd={inv.openAddCategory}
              onEdit={inv.openEditCategory}
              onDelete={inv.handleDeleteCategory}
            />
          )}
        </>
      )}

      {/* Modales */}
      <ProductModal
        modal={inv.productModal}
        form={inv.productForm}
        setF={inv.setPF}
        categories={inv.categories}
        onSave={inv.handleSaveProduct}
        onClose={inv.closeProductModal}
        saving={inv.saving}
        error={inv.error}
      />
      <CategoryModal
        modal={inv.categoryModal}
        form={inv.categoryForm}
        setF={inv.setCF}
        categories={inv.categories}
        onSave={inv.handleSaveCategory}
        onClose={inv.closeCategoryModal}
        saving={inv.saving}
        error={inv.error}
      />
      <StockAdjustModal
        product={inv.stockModal}
        form={inv.stockForm}
        setSF={inv.setSF}
        onSave={inv.handleSaveStock}
        onClose={inv.closeStockModal}
        saving={inv.saving}
        error={inv.error}
      />
    </div>
  );
}
