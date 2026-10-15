import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { facturasApi, inventoryApi } from '../../../api';
import { useCompany } from '../../../context/CompanyContext';
import { queryKeys } from '../../../lib/queryKeys';
import { invalidateCompanyData, unwrapSupabaseCount, unwrapSupabaseResponse } from '../../../lib/queryUtils';

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

const inputClass = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400 transition';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo' },
  { id: 'card', label: 'Tarjeta' },
  { id: 'transfer', label: 'Transferencia' },
  { id: 'mixed', label: 'Mixto' },
];

const DEFAULT_TABLES = [
  { id: 'puff-izq-4', label: 'PUFF IZQ 4', x: 2, y: 5, type: 'table' },
  { id: 'puff-izq-9', label: 'PUFF IZQ 9', x: 14, y: 5, type: 'table' },
  { id: 'camino-izq-2', label: 'CAMINO IZQ 2', x: 26, y: 5, type: 'table' },
  { id: 'camino-der-5', label: 'CAMINO DER 5', x: 50, y: 5, type: 'table' },
  { id: 'mesa-3', label: 'MESA 3', x: 62, y: 5, type: 'table' },
  { id: 'mesa-6', label: 'MESA 6', x: 74, y: 5, type: 'table' },
  { id: 'puff-izq-3', label: 'PUFF IZQ 3', x: 2, y: 25, type: 'table' },
  { id: 'puff-izq-8', label: 'PUFF IZQ 8', x: 14, y: 25, type: 'table' },
  { id: 'camino-izq-1', label: 'CAMINO IZQ 1', x: 26, y: 25, type: 'table' },
  { id: 'camino-der-4', label: 'CAMINO DER 4', x: 50, y: 25, type: 'table' },
  { id: 'mesa-2', label: 'MESA 2', x: 62, y: 25, type: 'table' },
  { id: 'mesa-5', label: 'MESA 5', x: 74, y: 25, type: 'table' },
  { id: 'puff-izq-2', label: 'PUFF IZQ 2', x: 2, y: 45, type: 'table' },
  { id: 'puff-izq-7', label: 'PUFF IZQ 7', x: 14, y: 45, type: 'table' },
  { id: 'mesa-1', label: 'MESA 1', x: 62, y: 45, type: 'table' },
  { id: 'mesa-4', label: 'MESA 4', x: 74, y: 45, type: 'table' },
  { id: 'puff-izq-1', label: 'PUFF IZQ 1', x: 2, y: 65, type: 'table' },
  { id: 'puff-izq-6', label: 'PUFF IZQ 6', x: 14, y: 65, type: 'table' },
  { id: 'bolirana-camino', label: 'BOLIRANA CAMINO', x: 62, y: 65, type: 'table' },
  { id: 'bolirana-palmas', label: 'BOLIRANA PALMAS', x: 74, y: 65, type: 'table' },
];

const TABLE_TYPES = [
  { id: 'table', label: 'Mesa' },
  { id: 'bar', label: 'Barra' },
  { id: 'patio', label: 'Patio' },
  { id: 'delivery', label: 'Domicilio' },
];

const colorPool = ['#10b981', '#f59e0b', '#3b82f6', '#e11d48', '#8b5cf6', '#14b8a6', '#f97316'];

const normalizeTables = (tables) => {
  const source = Array.isArray(tables) && tables.length >= 4 ? tables : DEFAULT_TABLES;
  return source.map((table, idx) => ({
    id: table.id || `mesa-${idx + 1}`,
    label: table.label || table.name || `Mesa ${idx + 1}`,
    type: table.type || 'table',
    x: Number.isFinite(Number(table.x)) ? Number(table.x) : 8 + ((idx * 22) % 74),
    y: Number.isFinite(Number(table.y)) ? Number(table.y) : 12 + (Math.floor(idx / 4) * 26),
  }));
};

export default function POSModule() {
  const { user, company } = useCompany();
  const queryClient = useQueryClient();
  const floorRef = useRef(null);

  const companyId = company?.id;
  const restaurantCartsKey = companyId ? `bapesu-pos-restaurant-carts-${companyId}` : null;
  const restaurantTablesKey = companyId ? `bapesu-pos-restaurant-tables-${companyId}` : null;

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [restaurantCarts, setRestaurantCarts] = useState({});
  const [restaurantTables, setRestaurantTables] = useState(DEFAULT_TABLES);
  const [posView, setPosView] = useState('local');
  const [posStep, setPosStep] = useState('tables');
  const [selectedTableId, setSelectedTableId] = useState(DEFAULT_TABLES[0].id);
  const [customerName, setCustomerName] = useState('Cliente mostrador');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [discount, setDiscount] = useState('');
  const [productCategory, setProductCategory] = useState('all');
  const [newTableName, setNewTableName] = useState('');
  const [newTableType, setNewTableType] = useState('table');
  const [productModal, setProductModal] = useState(null);
  const [tableModal, setTableModal] = useState(null);
  const [tableManagerOpen, setTableManagerOpen] = useState(false);
  const [tablesLocked, setTablesLocked] = useState(true);
  const [error, setError] = useState('');
  const [lastSale, setLastSale] = useState(null);

  const usesPos = company?.uses_pos ?? true;
  const businessType = company?.pos_business_type || 'retail';
  const isRestaurant = usesPos && businessType === 'restaurant';
  const selectedTable = restaurantTables.find((table) => table.id === selectedTableId) ?? restaurantTables[0];
  const activeCart = isRestaurant && posView === 'restaurant'
    ? (restaurantCarts[selectedTable?.id] ?? [])
    : cart;

  useEffect(() => {
    if (!restaurantTablesKey) return;
    try {
      const saved = localStorage.getItem(restaurantTablesKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRestaurantTables(normalizeTables(parsed));
      }
    } catch {
      setRestaurantTables(normalizeTables(DEFAULT_TABLES));
    }
  }, [restaurantTablesKey]);

  useEffect(() => {
    if (!restaurantCartsKey) return;
    try {
      const saved = localStorage.getItem(restaurantCartsKey);
      if (saved) setRestaurantCarts(JSON.parse(saved));
    } catch {
      setRestaurantCarts({});
    }
  }, [restaurantCartsKey]);

  useEffect(() => {
    if (!restaurantTablesKey) return;
    try {
      localStorage.setItem(restaurantTablesKey, JSON.stringify(restaurantTables));
    } catch {}
  }, [restaurantTables, restaurantTablesKey]);

  useEffect(() => {
    if (!restaurantCartsKey) return;
    try {
      localStorage.setItem(restaurantCartsKey, JSON.stringify(restaurantCarts));
    } catch {}
  }, [restaurantCarts, restaurantCartsKey]);

  useEffect(() => {
    if (!selectedTable && restaurantTables.length) {
      setSelectedTableId(restaurantTables[0].id);
    }
  }, [restaurantTables, selectedTable]);

  useEffect(() => {
    if (!isRestaurant) return;
    if (!Array.isArray(restaurantTables) || restaurantTables.length < 4) {
      setRestaurantTables(normalizeTables(DEFAULT_TABLES));
    }
  }, [isRestaurant, restaurantTables]);

  const productsQuery = useQuery({
    queryKey: queryKeys.company.inventory.products(companyId),
    enabled: Boolean(companyId),
    queryFn: () => inventoryApi.listProducts(companyId).then(unwrapSupabaseResponse),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.company.inventory.categories(companyId),
    enabled: Boolean(companyId),
    queryFn: () => inventoryApi.listCategories(companyId).then(unwrapSupabaseResponse),
  });

  const nextNumberQuery = useQuery({
    queryKey: [...queryKeys.company.facturas(companyId), 'pos-next-number'],
    enabled: Boolean(companyId),
    queryFn: () => facturasApi.countByCompany(companyId).then(unwrapSupabaseCount),
  });

  const facturasQuery = useQuery({
    queryKey: [...queryKeys.company.facturas(companyId), 'pos-history'],
    enabled: Boolean(companyId),
    queryFn: () => facturasApi.list(companyId).then(unwrapSupabaseResponse),
  });

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const posHistory = useMemo(
    () => (facturasQuery.data ?? []).filter((doc) => (doc.prefix ?? '').toUpperCase() === 'POS'),
    [facturasQuery.data]
  );
  const activeProducts = useMemo(() => products.filter((p) => p.is_active !== false), [products]);
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeProducts
      .filter((p) => productCategory === 'all' || p.category_id === productCategory)
      .filter((p) => !q || [p.name, p.sku, p.barcode, p.description].some((v) => (v ?? '').toLowerCase().includes(q)))
      .slice(0, q ? 60 : 40);
  }, [activeProducts, productCategory, search]);

  const subtotal = activeCart.reduce((acc, item) => acc + item.qty * item.price, 0);
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = Math.max(subtotal - discountValue, 0);
  const received = Number(cashReceived) || 0;
  const change = paymentMethod === 'cash' ? Math.max(received - total, 0) : 0;
  const nextNumber = String((nextNumberQuery.data ?? 0) + 1).padStart(3, '0');
  const openTables = restaurantTables.filter((table) => (restaurantCarts[table.id] ?? []).length > 0);

  const setActiveCart = (updater) => {
    if (isRestaurant && posView === 'restaurant' && selectedTable?.id) {
      setRestaurantCarts((current) => {
        const previous = current[selectedTable.id] ?? [];
        const nextCart = typeof updater === 'function' ? updater(previous) : updater;
        return { ...current, [selectedTable.id]: nextCart };
      });
      return;
    }
    setCart(updater);
  };

  const addProductLine = ({ product, qty, note, skipKitchen }) => {
    const stock = Number(product.stock_available) || 0;
    if (stock <= 0) {
      setError('Este producto no tiene stock disponible.');
      return;
    }
    const safeQty = Math.min(Math.max(Number(qty) || 1, 1), stock);
    const normalizedNote = note.trim();
    setError('');
    setActiveCart((current) => {
      const existing = current.find((item) => item.id === product.id && (item.note ?? '') === normalizedNote);
      if (existing) {
        return current.map((item) =>
          item.lineId === existing.lineId
            ? { ...item, qty: Math.min(item.qty + safeQty, stock), skipKitchen }
            : item
        );
      }
      return [
        ...current,
        {
          lineId: `${product.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          unit: product.unit ?? 'unidad',
          stock,
          price: Number(product.sale_price) || 0,
          qty: safeQty,
          note: normalizedNote,
          skipKitchen,
        },
      ];
    });
  };

  const openProductModal = (product) => {
    if (Number(product.stock_available) <= 0) {
      setError('Este producto no tiene stock disponible.');
      return;
    }
    setError('');
    setProductModal({ product, qty: 1, note: '', skipKitchen: false });
  };

  const setQty = (lineId, value) => {
    const qty = Math.max(Number(value) || 0, 0);
    setActiveCart((current) =>
      current
        .map((item) => item.lineId === lineId ? { ...item, qty: Math.min(qty, item.stock) } : item)
        .filter((item) => item.qty > 0)
    );
  };

  const setPrice = (lineId, value) => {
    setActiveCart((current) =>
      current.map((item) =>
        item.lineId === lineId ? { ...item, price: Math.max(Number(value) || 0, 0) } : item
      )
    );
  };

  const resetSale = () => {
    if (isRestaurant && posView === 'restaurant' && selectedTable?.id) {
      setRestaurantCarts((current) => ({ ...current, [selectedTable.id]: [] }));
    } else {
      setCart([]);
    }
    setSearch('');
    setCashReceived('');
    setDiscount('');
    setCustomerName(isRestaurant && posView === 'restaurant' && selectedTable ? selectedTable.label : 'Cliente mostrador');
    setPaymentMethod('cash');
  };

  const createTable = () => {
    const label = newTableName.trim() || `Mesa ${restaurantTables.length + 1}`;
    const id = `mesa-${Date.now()}`;
    const x = 12 + ((restaurantTables.length * 13) % 72);
    const y = 16 + ((restaurantTables.length * 17) % 68);
    const table = { id, label, type: newTableType, x, y };
    setRestaurantTables((current) => [...current, table]);
    setSelectedTableId(id);
    setCustomerName(label);
    setNewTableName('');
  };

  const renameSelectedTable = () => {
    if (!selectedTable) return;
    const next = window.prompt('Nombre de la mesa', selectedTable.label);
    if (!next?.trim()) return;
    setRestaurantTables((current) =>
      current.map((table) => table.id === selectedTable.id ? { ...table, label: next.trim() } : table)
    );
    setCustomerName(next.trim());
  };

  const removeSelectedTable = () => {
    if (!selectedTable) return;
    if ((restaurantCarts[selectedTable.id] ?? []).length > 0) {
      setError('No puedes eliminar una mesa con cuenta abierta.');
      return;
    }
    if (!window.confirm(`Eliminar ${selectedTable.label}?`)) return;
    setRestaurantTables((current) => current.filter((table) => table.id !== selectedTable.id));
    setRestaurantCarts((current) => {
      const next = { ...current };
      delete next[selectedTable.id];
      return next;
    });
  };

  const moveTableToPointer = (tableId, clientX, clientY) => {
    if (!tableId || !floorRef.current) return;
    const rect = floorRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((clientX - rect.left - 72) / rect.width) * 100, 1), 88);
    const y = Math.min(Math.max(((clientY - rect.top - 74) / rect.height) * 100, 1), 78);
    setRestaurantTables((current) =>
      current.map((table) => table.id === tableId ? { ...table, x, y } : table)
    );
  };

  const saleMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No tienes empresa asociada.');
      if (activeCart.length === 0) throw new Error('Agrega al menos un producto.');
      if (activeCart.some((item) => item.qty <= 0)) throw new Error('Revisa las cantidades de la venta.');
      if (paymentMethod === 'cash' && received > 0 && received < total) {
        throw new Error('El efectivo recibido es menor que el total.');
      }

      const freshItems = [];
      for (const item of activeCart) {
        const response = await inventoryApi.getProductStock(item.id);
        if (response.error) throw response.error;
        const fresh = response.data;
        const available = Number(fresh?.stock_available) || 0;
        if (available < item.qty) {
          throw new Error(`${item.name} solo tiene ${available} disponible.`);
        }
        freshItems.push({ ...item, stock: available });
      }

      const now = new Date().toISOString();
      const saleNumber = nextNumber;
      const saleContext = isRestaurant && posView === 'restaurant' && selectedTable
        ? `Mesa: ${selectedTable.label}`
        : 'Venta local';
      const payload = {
        company_id: companyId,
        client_id: null,
        client_name: customerName.trim() || (selectedTable?.label ?? 'Cliente mostrador'),
        prefix: 'POS',
        number: saleNumber,
        issue_date: now.slice(0, 10),
        due_date: now.slice(0, 10),
        concept: saleContext === 'Venta local' ? 'Venta POS' : `Venta POS restaurante - ${selectedTable.label}`,
        notes: `${saleContext}. Medio de pago: ${PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label ?? paymentMethod}`,
        payment_info: null,
        include_iva: false,
        iva_rate: 0,
        include_retefuente: false,
        retefuente_rate: 0,
        include_reteiva: false,
        reteiva_rate: 0,
        include_reteica: false,
        reteica_rate: 0,
        subtotal,
        iva_amount: 0,
        retefuente_amount: 0,
        reteiva_amount: 0,
        reteica_amount: 0,
        total,
        status: 'paid',
        created_by: user?.id ?? null,
        updated_at: now,
      };

      const facturaRes = await facturasApi.createId(payload);
      if (facturaRes.error) throw facturaRes.error;
      const facturaId = facturaRes.data.id;

      const itemsPayload = freshItems.map((item, idx) => ({
        factura_id: facturaId,
        service_id: null,
        description: [item.sku ? `${item.name} (${item.sku})` : item.name, item.note].filter(Boolean).join(' - '),
        quantity: item.qty,
        price: item.price,
        position: idx,
      }));
      if (itemsPayload.length) {
        const itemsRes = await facturasApi.addItems(itemsPayload);
        if (itemsRes.error) throw itemsRes.error;
      }

      for (const item of freshItems) {
        const newStock = +((Number(item.stock) - Number(item.qty)).toFixed(3));
        const productRes = await inventoryApi.updateProduct(item.id, {
          stock_available: newStock,
          updated_at: now,
        });
        if (productRes.error) throw productRes.error;

        const movementRes = await inventoryApi.addMovement({
          company_id: companyId,
          product_id: item.id,
          type: 'salida',
          quantity: -Number(item.qty),
          notes: `Venta POS ${payload.prefix}-${saleNumber}${item.note ? ` - ${item.note}` : ''}`,
          created_by: user?.id ?? null,
        });
        if (movementRes.error) throw movementRes.error;
      }

      return {
        id: facturaId,
        number: `${payload.prefix}-${saleNumber}`,
        date: now,
        customerName: payload.client_name,
        paymentLabel: PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label ?? paymentMethod,
        contextLabel: saleContext,
        items: freshItems,
        subtotal,
        discount: discountValue,
        total,
        received,
        change,
      };
    },
    onSuccess: async (sale) => {
      setLastSale(sale);
      await invalidateCompanyData(queryClient, companyId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.company.facturas(companyId) });
      resetSale();
      window.setTimeout(() => window.print(), 150);
    },
  });

  const handleCheckout = async () => {
    setError('');
    try {
      await saleMutation.mutateAsync();
    } catch (err) {
      setError(err.message ?? 'No se pudo completar la venta.');
    }
  };

  const loading = productsQuery.isLoading || categoriesQuery.isLoading;
  const saving = saleMutation.isPending;
  const lowStockItems = activeCart.filter((item) => item.stock - item.qty <= 2);

  if (!usesPos) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
        <h1 className="text-xl font-extrabold text-gray-900">Ventas POS inactivo</h1>
        <p className="text-sm text-gray-500 mt-2">Activa el POS desde Empresa para usar ventas locales o el modo restaurante.</p>
        <a href="/dashboard/company" className="inline-flex mt-5 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition">
          Configurar empresa
        </a>
      </div>
    );
  }

  const restaurantMode = isRestaurant && posView === 'restaurant';

  return (
    <div className="max-w-7xl mx-auto" id="pos-module">
      <div className="no-print flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Ventas POS</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRestaurant ? 'Plano de mesas, ventas locales y cuentas por mesa' : 'Venta rapida con inventario y recibo imprimible'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-gray-700">Factura {`POS-${nextNumber}`}</span>
        </div>
      </div>

      {error && (
        <div className="no-print mb-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {isRestaurant && (
        <div className="no-print mb-5 flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
          {[
            { id: 'local', label: 'Ventas locales' },
            { id: 'restaurant', label: 'Restaurante' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setPosView(tab.id);
                if (tab.id === 'restaurant') setPosStep('tables');
                setCustomerName(tab.id === 'restaurant' ? selectedTable?.label ?? 'Mesa' : 'Cliente mostrador');
                setDiscount('');
                setCashReceived('');
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                posView === tab.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {restaurantMode && (
        <RestaurantStepTabs
          activeStep={posStep}
          setStep={setPosStep}
          openTables={openTables.length}
          historyCount={posHistory.length}
          selectedTable={selectedTable}
        />
      )}

      {restaurantMode && posStep === 'tables' && (
        <RestaurantFloor
          floorRef={floorRef}
          tables={restaurantTables}
          carts={restaurantCarts}
          selectedTableId={selectedTable?.id}
          newTableName={newTableName}
          setNewTableName={setNewTableName}
          newTableType={newTableType}
          setNewTableType={setNewTableType}
          tablesLocked={tablesLocked}
          setTablesLocked={setTablesLocked}
          openTableManager={() => setTableManagerOpen(true)}
          createTable={createTable}
          renameSelectedTable={renameSelectedTable}
          removeSelectedTable={removeSelectedTable}
          onSelectTable={(table) => {
            setSelectedTableId(table.id);
            setCustomerName(table.label);
            setTableModal(table);
          }}
          onMoveTable={moveTableToPointer}
        />
      )}

      {(!restaurantMode || posStep === 'products') && (
        <div className="no-print grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
          <section className="space-y-4">
            <ProductCatalog
              loading={loading}
              products={filteredProducts}
              categories={categories}
              search={search}
              setSearch={setSearch}
              category={productCategory}
              setCategory={setProductCategory}
              onProductClick={openProductModal}
            />
          </section>

          <CartPanel
            title={restaurantMode && selectedTable ? selectedTable.label : 'Carrito'}
            items={activeCart}
            customerName={customerName}
            setCustomerName={setCustomerName}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            discount={discount}
            setDiscount={setDiscount}
            cashReceived={cashReceived}
            setCashReceived={setCashReceived}
            subtotal={subtotal}
            discountValue={discountValue}
            total={total}
            change={change}
            received={received}
            saving={saving}
            lowStockItems={lowStockItems}
            setQty={setQty}
            setPrice={setPrice}
            resetSale={resetSale}
            handleCheckout={handleCheckout}
          />
        </div>
      )}

      {restaurantMode && posStep === 'history' && (
        <POSHistory docs={posHistory} loading={facturasQuery.isLoading} />
      )}

      <ProductQtyModal
        modal={productModal}
        setModal={setProductModal}
        onAccept={(payload) => {
          addProductLine(payload);
          setProductModal(null);
        }}
      />
      <TableActionModal
        table={tableModal}
        cart={tableModal ? restaurantCarts[tableModal.id] ?? [] : []}
        loading={loading}
        products={filteredProducts}
        categories={categories}
        search={search}
        setSearch={setSearch}
        category={productCategory}
        setCategory={setProductCategory}
        onProductClick={openProductModal}
        customerName={customerName}
        setCustomerName={setCustomerName}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        discount={discount}
        setDiscount={setDiscount}
        cashReceived={cashReceived}
        setCashReceived={setCashReceived}
        subtotal={subtotal}
        discountValue={discountValue}
        total={total}
        change={change}
        received={received}
        saving={saving}
        lowStockItems={lowStockItems}
        setQty={setQty}
        setPrice={setPrice}
        resetSale={resetSale}
        handleCheckout={handleCheckout}
        onClose={() => setTableModal(null)}
        onEdit={(table) => {
          setSelectedTableId(table.id);
          setTableModal(null);
          setTableManagerOpen(true);
        }}
      />
      <TableManagerModal
        open={tableManagerOpen}
        onClose={() => setTableManagerOpen(false)}
        tables={restaurantTables}
        selectedTableId={selectedTableId}
        setSelectedTableId={setSelectedTableId}
        carts={restaurantCarts}
        newTableName={newTableName}
        setNewTableName={setNewTableName}
        newTableType={newTableType}
        setNewTableType={setNewTableType}
        createTable={createTable}
        renameSelectedTable={renameSelectedTable}
        removeSelectedTable={removeSelectedTable}
      />
      <Receipt sale={lastSale} company={company} />
    </div>
  );
}

function RestaurantStepTabs({ activeStep, setStep, openTables, historyCount, selectedTable }) {
  const tabs = [
    { id: 'tables', number: 1, label: 'Mesas', sub: `${openTables} abiertas` },
    { id: 'products', number: 2, label: 'Productos', sub: selectedTable?.label ?? 'Sin mesa' },
    { id: 'history', number: 3, label: 'Historial', sub: `${historyCount} facturas` },
  ];

  return (
    <div className="no-print mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {tabs.map((tab) => {
        const active = activeStep === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStep(tab.id)}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
              active
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold ${
              active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.number}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-gray-900">{tab.label}</span>
              <span className="block text-xs text-gray-400 truncate">{tab.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function POSHistory({ docs, loading }) {
  const todayTotal = docs
    .filter((doc) => (doc.issue_date || doc.created_at || '').slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((acc, doc) => acc + Number(doc.total || 0), 0);

  if (loading) {
    return (
      <div className="no-print bg-white border border-gray-200 rounded-xl p-12 flex items-center justify-center">
        <svg className="w-7 h-7 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="no-print bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-extrabold text-gray-900">Historial POS</h2>
          <p className="text-xs text-gray-500">{docs.length} factura{docs.length !== 1 ? 's' : ''} POS registrada{docs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-gray-400">Vendido hoy</p>
          <p className="text-lg font-extrabold text-emerald-600">{formatCOP(todayTotal)}</p>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-semibold text-gray-700">Aun no hay ventas POS</p>
          <p className="text-xs text-gray-400 mt-1">Cuando cobres una mesa o venta local aparecera aqui.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {docs.map((doc) => (
            <div key={doc.id} className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-gray-50 transition">
              <div className="col-span-6 md:col-span-2">
                <p className="text-sm font-extrabold text-emerald-700">{doc.prefix ?? 'POS'}-{doc.number ?? '---'}</p>
                <p className="text-[11px] text-gray-400">{doc.status === 'paid' ? 'Pagada' : doc.status}</p>
              </div>
              <div className="col-span-6 md:col-span-3 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{doc.client_name ?? 'Cliente mostrador'}</p>
                <p className="text-[11px] text-gray-400 truncate">{doc.concept ?? 'Venta POS'}</p>
              </div>
              <div className="col-span-6 md:col-span-3 text-xs text-gray-500">
                {doc.issue_date
                  ? new Date(`${doc.issue_date}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                  : new Date(doc.created_at).toLocaleDateString('es-CO')}
              </div>
              <div className="col-span-6 md:col-span-2 text-right">
                <p className="text-sm font-extrabold text-gray-900">{formatCOP(doc.total)}</p>
              </div>
              <div className="col-span-12 md:col-span-2 flex justify-end">
                <a
                  href={`/dashboard/cobros/facturas/${doc.id}`}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Ver factura
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RestaurantFloor({
  floorRef,
  tables,
  carts,
  selectedTableId,
  newTableName,
  setNewTableName,
  newTableType,
  setNewTableType,
  tablesLocked,
  setTablesLocked,
  openTableManager,
  createTable,
  renameSelectedTable,
  removeSelectedTable,
  onSelectTable,
  onMoveTable,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const dragMovedRef = useRef(false);
  const visibleTables = normalizeTables(tables);

  const finishDrag = () => window.setTimeout(() => setDraggingId(null), 0);

  return (
    <div className="no-print mb-5 overflow-hidden bg-white">
      <div
        ref={floorRef}
        onPointerMove={(e) => {
          if (!draggingId || tablesLocked) return;
          e.preventDefault();
          dragMovedRef.current = true;
          onMoveTable(draggingId, e.clientX, e.clientY);
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        className="relative h-[760px] bg-white overflow-hidden touch-none"
      >
        <div className="absolute right-4 top-4 z-30 flex gap-2">
          <button
            type="button"
            onClick={() => setTablesLocked((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold shadow-sm transition ${
              tablesLocked
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tablesLocked ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' : 'M13.5 10.5V6.75a3.75 3.75 0 10-7.5 0v3.75m-.75 11.25h12A2.25 2.25 0 0019.5 19.5v-6.75a2.25 2.25 0 00-2.25-2.25h-12A2.25 2.25 0 003 12.75v6.75a2.25 2.25 0 002.25 2.25z'} />
            </svg>
            {tablesLocked ? 'Mesas bloqueadas' : 'Mover mesas'}
          </button>
          <button
            type="button"
            onClick={openTableManager}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar / editar mesas
          </button>
        </div>
        {visibleTables.map((table, idx) => {
          const tableCart = carts[table.id] ?? [];
          const occupied = tableCart.length > 0;
          const total = tableCart.reduce((acc, item) => acc + item.qty * item.price, 0);
          const selected = table.id === selectedTableId;
          return (
            <button
              key={table.id}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                dragMovedRef.current = false;
                if (!tablesLocked) {
                  setDraggingId(table.id);
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                }
              }}
              onPointerUp={() => {
                if ((tablesLocked || draggingId === table.id) && !dragMovedRef.current) onSelectTable(table);
                finishDrag();
              }}
              className={`absolute z-10 w-36 h-44 rounded-2xl transition focus:outline-none ${
                selected ? 'ring-2 ring-emerald-400 ring-offset-4' : 'hover:scale-[1.02]'
              } ${tablesLocked ? 'cursor-pointer' : 'cursor-move'}`}
              style={{
                left: `${Number.isFinite(Number(table.x)) ? Number(table.x) : 8}%`,
                top: `${Number.isFinite(Number(table.y)) ? Number(table.y) : 12}%`,
              }}
              title={tablesLocked ? 'Click para abrir acciones de la mesa' : 'Arrastra para mover la mesa'}
            >
              <span className="block text-center text-lg font-semibold italic text-gray-950 leading-tight truncate px-1">
                {table.label}
              </span>

              <span className="relative mx-auto mt-2 block h-24 w-28">
                <span className="absolute left-1/2 top-0 h-7 w-12 -translate-x-1/2 rounded-sm bg-gray-300" />
                <span className="absolute left-1/2 bottom-0 h-7 w-12 -translate-x-1/2 rounded-sm bg-gray-300" />
                <span className="absolute left-0 top-1/2 h-10 w-5 -translate-y-1/2 rounded-sm bg-gray-300" />
                <span className="absolute right-0 top-1/2 h-10 w-5 -translate-y-1/2 rounded-sm bg-gray-300" />
                <span className={`absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center shadow-sm ${
                  occupied ? 'bg-rose-500' : 'bg-emerald-200'
                }`}>
                  <span className={`text-xs italic ${occupied ? 'font-semibold text-white' : 'text-gray-700'}`}>
                    {occupied ? 'Ocupada' : 'Disponible'}
                  </span>
                </span>
              </span>

              <span className="block min-h-9 text-center">
                {occupied ? (
                  <>
                    <span className="block text-sm font-bold text-blue-600 underline">{formatCOP(total)}</span>
                    <span className="block text-xs italic font-semibold text-rose-600">Tickets ({tableCart.length})</span>
                  </>
                ) : (
                  <span className="block text-[11px] text-gray-300">#{idx + 1}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TableActionModal({
  table,
  cart,
  loading,
  products,
  categories,
  search,
  setSearch,
  category,
  setCategory,
  onProductClick,
  customerName,
  setCustomerName,
  paymentMethod,
  setPaymentMethod,
  discount,
  setDiscount,
  cashReceived,
  setCashReceived,
  subtotal,
  discountValue,
  total,
  change,
  received,
  saving,
  lowStockItems,
  setQty,
  setPrice,
  resetSale,
  handleCheckout,
  onClose,
  onEdit,
}) {
  if (!table) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/45" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-gray-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-900">{table.label}</h2>
            <p className="text-xs text-gray-500">Selecciona productos y administra la cuenta de la mesa.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(table)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">
              Editar mesa
            </button>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700" aria-label="Cerrar modal">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_390px]">
          <div className="min-h-0 overflow-y-auto p-5">
            <ProductCatalog
              loading={loading}
              products={products}
              categories={categories}
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              onProductClick={onProductClick}
            />
          </div>

          <div className="min-h-0 overflow-y-auto border-l border-gray-200 bg-white">
            <div className="border-t-4 border-rose-600 px-6 py-4">
              <p className="text-sm font-extrabold uppercase text-rose-600">Atendido por: Caja</p>
            </div>
            <div className="border-y border-gray-100 px-6 py-4 text-center">
              <p className="text-xl font-extrabold text-gray-950">Total: {formatCOP(total)}</p>
            </div>
            <div className="border-b border-gray-100 px-6 py-4 text-center">
              <p className="text-lg font-extrabold text-gray-950">Comensales</p>
              <input className={`${inputClass} mt-3 text-center`} placeholder="Digita la cantidad de comensales" />
            </div>

            <div className="px-4 py-4">
              <CartPanel
                title={table.label}
                items={cart}
                customerName={customerName}
                setCustomerName={setCustomerName}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                discount={discount}
                setDiscount={setDiscount}
                cashReceived={cashReceived}
                setCashReceived={setCashReceived}
                subtotal={subtotal}
                discountValue={discountValue}
                total={total}
                change={change}
                received={received}
                saving={saving}
                lowStockItems={lowStockItems}
                setQty={setQty}
                setPrice={setPrice}
                resetSale={resetSale}
                handleCheckout={handleCheckout}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableManagerModal({
  open,
  onClose,
  tables,
  selectedTableId,
  setSelectedTableId,
  carts,
  newTableName,
  setNewTableName,
  newTableType,
  setNewTableType,
  createTable,
  renameSelectedTable,
  removeSelectedTable,
}) {
  if (!open) return null;
  const selectedTable = tables.find((table) => table.id === selectedTableId);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/45" onClick={onClose} />
      <div className="relative flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Agregar / editar mesas</h2>
            <p className="text-xs text-gray-500">Crea mesas y edita la seleccionada. El orden visual se ajusta arrastrando en el plano.</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-0 md:grid-cols-[1fr_280px]">
          <div className="max-h-[60vh] overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {tables.map((table) => {
                const occupied = (carts[table.id] ?? []).length > 0;
                const active = table.id === selectedTableId;
                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => setSelectedTableId(table.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      active ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block text-sm font-extrabold text-gray-900">{table.label}</span>
                    <span className={`mt-1 block text-xs ${occupied ? 'text-rose-600' : 'text-gray-400'}`}>
                      {occupied ? 'Ocupada' : 'Disponible'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-100 p-5 md:border-l md:border-t-0">
            <h3 className="text-sm font-extrabold text-gray-900">Nueva mesa</h3>
            <div className="mt-3 space-y-2">
              <input
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className={inputClass}
                placeholder="Nombre de mesa"
              />
              <select value={newTableType} onChange={(e) => setNewTableType(e.target.value)} className={inputClass}>
                {TABLE_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
              <button onClick={createTable} className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700">
                Crear mesa
              </button>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-extrabold text-gray-900">Mesa seleccionada</h3>
              <p className="mt-1 text-xs text-gray-500">{selectedTable?.label ?? 'Selecciona una mesa'}</p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <button onClick={renameSelectedTable} disabled={!selectedTable} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  Renombrar
                </button>
                <button onClick={removeSelectedTable} disabled={!selectedTable} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 text-right">
          <button onClick={onClose} className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-gray-800">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCatalog({ loading, products, categories, search, setSearch, category, setCategory, onProductClick }) {
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre, categoria, codigo"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition"
            />
          </div>
          <button onClick={() => setSearch('')} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Limpiar
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <CategoryChip active={category === 'all'} onClick={() => setCategory('all')} label="Todos" color="#111827" />
          {categories.map((cat, idx) => (
            <CategoryChip
              key={cat.id}
              active={category === cat.id}
              onClick={() => setCategory(cat.id)}
              label={cat.name}
              color={cat.color || colorPool[idx % colorPool.length]}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-gray-200 rounded-xl">
          <svg className="w-7 h-7 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-semibold text-gray-700">No hay productos para vender</p>
          <p className="text-xs text-gray-400 mt-1">Revisa el inventario o cambia los filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4">
          {products.map((product, idx) => {
            const stock = Number(product.stock_available) || 0;
            const cat = product.bapesu_inventory_categories;
            const initial = (product.name || '?').trim()[0]?.toUpperCase() ?? '?';
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onProductClick(product)}
                disabled={stock <= 0}
                className="bg-white border border-gray-200 rounded-xl p-4 min-h-48 shadow-sm hover:shadow-md transition text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.photo_url ? (
                  <img src={product.photo_url} alt={product.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-3" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl text-white" style={{ background: cat?.color || colorPool[idx % colorPool.length] }}>
                    {initial}
                  </div>
                )}
                <p className="text-[10px] uppercase text-gray-400 font-semibold truncate">{cat?.name || 'Sin categoria'}</p>
                <p className="text-sm font-extrabold text-gray-900 mt-1 line-clamp-2 min-h-10">{product.name}</p>
                <div className="w-12 h-px bg-gray-200 mx-auto my-3" />
                <p className="text-sm font-extrabold text-gray-800">{formatCOP(product.sale_price)}</p>
                <p className={`text-[11px] mt-1 ${stock <= 0 ? 'text-red-500' : 'text-gray-400'}`}>{stock} disponible</p>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function CategoryChip({ active, onClick, label, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition ${
        active ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
      }`}
    >
      <span className="w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center" style={{ background: active ? 'rgba(255,255,255,.25)' : color }}>
        {label[0]?.toUpperCase()}
      </span>
      {label}
    </button>
  );
}

function CartPanel({
  title,
  items,
  customerName,
  setCustomerName,
  paymentMethod,
  setPaymentMethod,
  discount,
  setDiscount,
  cashReceived,
  setCashReceived,
  subtotal,
  discountValue,
  total,
  change,
  received,
  saving,
  lowStockItems,
  setQty,
  setPrice,
  resetSale,
  handleCheckout,
}) {
  return (
    <aside className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden self-start">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400">{items.length} producto{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={resetSale} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition">Vaciar</button>
      </div>

      <div className="max-h-[42vh] overflow-y-auto divide-y divide-gray-100">
        {items.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-gray-700">Agrega productos</p>
            <p className="text-xs text-gray-400 mt-1">Selecciona un producto y define la cantidad.</p>
          </div>
        ) : items.map((item) => (
          <div key={item.lineId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                {item.note && <p className="text-[11px] text-amber-700 mt-0.5 truncate">{item.note}</p>}
                <p className="text-[11px] text-gray-400">
                  Disponible despues: <span className={item.stock - item.qty <= 2 ? 'text-amber-600 font-bold' : 'text-gray-500'}>{+(item.stock - item.qty).toFixed(3)}</span>
                </p>
              </div>
              <button onClick={() => setQty(item.lineId, 0)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition" title="Quitar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-12 gap-2 mt-3 items-center">
              <input type="number" min="0" max={item.stock} step="1" value={item.qty} onChange={(e) => setQty(item.lineId, e.target.value)} className={`${inputClass} col-span-4`} aria-label="Cantidad" />
              <input type="number" min="0" step="100" value={item.price} onChange={(e) => setPrice(item.lineId, e.target.value)} className={`${inputClass} col-span-5`} aria-label="Precio" />
              <p className="col-span-3 text-right text-sm font-extrabold text-gray-900">{formatCOP(item.qty * item.price)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100 space-y-3">
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} placeholder="Cliente o mesa" />
        <div className="grid grid-cols-2 gap-2">
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
            {PAYMENT_METHODS.map((method) => <option key={method.id} value={method.id}>{method.label}</option>)}
          </select>
          <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputClass} placeholder="Descuento" />
        </div>
        {paymentMethod === 'cash' && (
          <input type="number" min="0" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className={inputClass} placeholder="Efectivo recibido" />
        )}

        <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
          <Row label="Subtotal" value={formatCOP(subtotal)} />
          <Row label="Descuento" value={`-${formatCOP(discountValue)}`} muted />
          <div className="flex items-center justify-between text-lg pt-2">
            <span className="font-extrabold text-gray-900">Total</span>
            <span className="font-extrabold text-emerald-600">{formatCOP(total)}</span>
          </div>
          {paymentMethod === 'cash' && received > 0 && <Row label="Cambio" value={formatCOP(change)} />}
        </div>

        {lowStockItems.length > 0 && (
          <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
            Stock bajo despues de vender: {lowStockItems.map((i) => i.name).join(', ')}
          </div>
        )}

        <button onClick={handleCheckout} disabled={saving || items.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed">
          {saving ? 'Procesando' : 'Cobrar e imprimir'}
        </button>
      </div>
    </aside>
  );
}

function ProductQtyModal({ modal, setModal, onAccept }) {
  if (!modal) return null;
  const product = modal.product;
  const stock = Number(product.stock_available) || 0;
  const qty = Math.min(Math.max(Number(modal.qty) || 1, 1), stock || 1);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/45" onClick={() => setModal(null)} />
      <div className="relative bg-white w-full max-w-3xl rounded-xl shadow-2xl p-7">
        <button onClick={() => setModal(null)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-lg font-extrabold text-gray-900">Observaciones - {product.name}</h2>
        <div className="h-px bg-gray-200 my-5" />

        <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
          <label className="text-sm font-bold text-gray-600">Cantidad:</label>
          <div className="flex items-center">
            <button onClick={() => setModal((p) => ({ ...p, qty: Math.max((Number(p.qty) || 1) - 1, 1) }))} className="w-12 h-9 bg-rose-600 text-white font-bold">-</button>
            <input type="number" min="1" max={stock} value={modal.qty} onChange={(e) => setModal((p) => ({ ...p, qty: e.target.value }))} className="w-48 h-9 border-y border-gray-200 text-center text-sm focus:outline-none" />
            <button onClick={() => setModal((p) => ({ ...p, qty: Math.min((Number(p.qty) || 1) + 1, stock) }))} className="w-12 h-9 bg-rose-600 text-white font-bold">+</button>
            <span className="ml-3 text-xs text-gray-400">{stock} disponible</span>
          </div>

          <label className="text-sm font-bold text-gray-600">Observacion para la comanda:</label>
          <textarea value={modal.note} onChange={(e) => setModal((p) => ({ ...p, note: e.target.value }))} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />

          <span />
          <label className="inline-flex items-center gap-2 text-sm text-gray-500">
            <input type="checkbox" checked={modal.skipKitchen} onChange={(e) => setModal((p) => ({ ...p, skipKitchen: e.target.checked }))} className="w-4 h-4 rounded border-gray-300" />
            No imprimir en la comanda
          </label>
        </div>

        <div className="h-px bg-gray-200 my-5" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setModal(null)} className="px-5 py-2 rounded-lg border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50">Cerrar</button>
          <button onClick={() => onAccept({ product, qty, note: modal.note, skipKitchen: modal.skipKitchen })} className="px-5 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700">Aceptar</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }) {
  return (
    <div className={`flex items-center justify-between ${muted ? 'text-gray-400' : 'text-gray-600'}`}>
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Receipt({ sale, company }) {
  if (!sale) return null;
  return (
    <>
      <div id="pos-receipt" className="hidden print:block bg-white text-gray-950 px-2 py-3 font-mono text-[11px] leading-tight">
        <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
          <p className="text-sm font-bold uppercase">{company?.name ?? 'Mi empresa'}</p>
          {company?.nit && <p>NIT: {company.nit}</p>}
          {company?.phone && <p>Tel: {company.phone}</p>}
          {company?.address && <p>{company.address}</p>}
        </div>
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          <p>Factura: {sale.number}</p>
          <p>Fecha: {new Date(sale.date).toLocaleString('es-CO')}</p>
          <p>Cliente: {sale.customerName}</p>
          {sale.contextLabel && <p>{sale.contextLabel}</p>}
          <p>Pago: {sale.paymentLabel}</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-dashed border-gray-400">
              <th className="text-left py-1">Item</th>
              <th className="text-right py-1">Cant</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.lineId} className="align-top">
                <td className="py-1 pr-1">
                  <p>{item.name}</p>
                  {item.note && <p>{item.note}</p>}
                  <p>{formatCOP(item.price)}</p>
                </td>
                <td className="py-1 text-right">{item.qty}</td>
                <td className="py-1 text-right">{formatCOP(item.qty * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-dashed border-gray-400 pt-2 mt-2 space-y-1">
          <Row label="Subtotal" value={formatCOP(sale.subtotal)} />
          <Row label="Descuento" value={`-${formatCOP(sale.discount)}`} />
          <div className="flex justify-between text-sm font-bold">
            <span>Total</span>
            <span>{formatCOP(sale.total)}</span>
          </div>
          {sale.received > 0 && <Row label="Recibido" value={formatCOP(sale.received)} />}
          {sale.received > 0 && <Row label="Cambio" value={formatCOP(sale.change)} />}
        </div>
        <p className="text-center mt-3 border-t border-dashed border-gray-400 pt-2">Gracias por su compra</p>
      </div>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body * { visibility: hidden !important; }
          #pos-receipt, #pos-receipt * { visibility: visible !important; }
          #pos-receipt {
            display: block !important;
            position: fixed !important;
            inset: 0 auto auto 0 !important;
            width: 72mm !important;
            min-height: auto !important;
            color: #000 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </>
  );
}
