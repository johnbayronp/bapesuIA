import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import {
  MagnifyingGlass, ShoppingCart, Plus, X, WhatsappLogo, Image as ImageIcon,
  ChatCircleDots, SealCheck, Truck, Storefront, ArrowCounterClockwise,
} from '@phosphor-icons/react';
import { storeApi } from '../../api/store';
import { STORE_COMPANY_ID } from '../../lib/storeConfig';
import { useEcommerce } from '../../context/EcommerceContext';
import useSeo from '../../hooks/useSeo';
import { waLink } from '../home/LandingSections';
import StoreCart from './StoreCart';
import { EASE_CLASS, FOCUS, PRIMARY_BTN, GHOST_BTN, formatCOP } from './storeUi';

const EASE = [0.32, 0.72, 0, 1];
const ALL = 'todos';
const SORTS = [
  { id: 'name', label: 'Nombre (A a Z)' },
  { id: 'price-asc', label: 'Precio: menor a mayor' },
  { id: 'price-desc', label: 'Precio: mayor a menor' },
];

const toStoreProduct = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  price: Number(row.sale_price) || 0,
  image: row.photo_url || '',
  stock: Number(row.stock_available) || 0,
  lowStock: Number(row.stock_available) > 0 && Number(row.stock_available) <= Number(row.stock_min || 0),
  unit: row.unit || 'unidad',
  categoryId: row.bapesu_inventory_categories?.id || row.category_id || null,
  categoryName: row.bapesu_inventory_categories?.name || 'Otros',
});

const trust = [
  { Icon: ChatCircleDots, title: 'Asesoría antes de comprar', text: 'Te ayudamos a elegir el material o repuesto correcto para tu impresora.' },
  { Icon: SealCheck, title: 'Pagas al confirmar', text: 'Revisamos disponibilidad contigo por WhatsApp antes de cualquier cobro.' },
  { Icon: Truck, title: 'Envíos a Colombia', text: 'Cotizamos el envío a tu ciudad junto con la confirmación del pedido.' },
];

function StockBadge({ product }) {
  if (product.stock <= 0) return <span className="rounded-full bg-gray-900/80 px-3 py-1 text-xs font-semibold text-white">Agotado</span>;
  if (product.lowStock) return <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">Últimas unidades</span>;
  return null;
}

function ProductCard({ product, onAdd, onOpen, index }) {
  const reduced = useReducedMotion();
  const soldOut = product.stock <= 0;
  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 64, filter: 'blur(12px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, delay: (index % 4) * 0.06, ease: EASE }}
      className={`group flex flex-col rounded-2xl border border-gray-200 bg-white p-2 hover:-translate-y-1 hover:border-indigo-300 dark:border-white/10 dark:bg-[#181818] dark:hover:border-indigo-400/40 ${EASE_CLASS}`}
    >
      <button type="button" onClick={() => onOpen(product)} aria-label={`Ver detalles de ${product.name}`} className={`relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-[#272727] ${FOCUS}`}>
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" className={`h-full w-full object-cover group-hover:scale-105 ${EASE_CLASS} ${soldOut ? 'opacity-60' : ''}`} />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-gray-400"><ImageIcon size={40} weight="duotone" aria-hidden="true" /></span>
        )}
        <span className="absolute left-2 top-2"><StockBadge product={product} /></span>
      </button>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">{product.categoryName}</p>
        <h3 className="mt-1 text-base font-semibold text-gray-950 [text-wrap:balance] dark:text-white">{product.name}</h3>
        {product.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{product.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className="text-lg font-semibold text-gray-950 dark:text-white">{formatCOP(product.price)}</p>
          <button type="button" disabled={soldOut} onClick={() => onAdd(product)} aria-label={`Agregar ${product.name} al carrito`} className={`${PRIMARY_BTN} text-sm`}>
            <Plus size={16} weight="bold" aria-hidden="true" />{soldOut ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </motion.li>
  );
}

function ProductSkeleton() {
  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-[#181818]" aria-hidden="true">
      <div className="aspect-square animate-pulse rounded-lg bg-gray-100 dark:bg-[#272727]" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-16 animate-pulse rounded bg-gray-100 dark:bg-[#272727]" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-[#272727]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-[#272727]" />
        <div className="flex justify-between pt-4"><div className="h-6 w-20 animate-pulse rounded bg-gray-100 dark:bg-[#272727]" /><div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-[#272727]" /></div>
      </div>
    </li>
  );
}

function ProductDialog({ product, onClose, onAdd }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!product) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [product]);
  if (!product) return null;
  const soldOut = product.stock <= 0;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" className="relative grid max-h-[90vh] w-full max-w-3xl gap-6 overflow-y-auto rounded-2xl bg-white p-4 outline-none dark:bg-[#181818] sm:grid-cols-2 sm:p-6">
        <button type="button" onClick={onClose} aria-label="Cerrar" className={`absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-gray-700 hover:bg-white dark:bg-black/60 dark:text-white ${EASE_CLASS} ${FOCUS}`}>
          <X size={20} aria-hidden="true" />
        </button>
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-[#272727]">
          {product.image
            ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            : <span className="flex h-full w-full items-center justify-center text-gray-400"><ImageIcon size={48} weight="duotone" aria-hidden="true" /></span>}
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">{product.categoryName}</p>
          <h2 id="product-dialog-title" className="mt-1 text-2xl font-semibold text-gray-950 [text-wrap:balance] dark:text-white">{product.name}</h2>
          <p className="mt-4 text-3xl font-semibold text-gray-950 dark:text-white">{formatCOP(product.price)}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {soldOut ? 'Sin unidades disponibles por ahora' : `${product.stock} ${product.unit === 'unidad' ? (product.stock === 1 ? 'unidad disponible' : 'unidades disponibles') : product.unit + ' disponibles'}`}
          </p>
          {product.description && <p className="mt-4 whitespace-pre-line text-sm text-gray-700 [text-wrap:pretty] dark:text-gray-300">{product.description}</p>}
          <div className="mt-auto flex flex-wrap gap-3 pt-6">
            <button type="button" disabled={soldOut} onClick={() => { onAdd(product); onClose(); }} className={PRIMARY_BTN}>
              <ShoppingCart size={20} aria-hidden="true" />Agregar al carrito
            </button>
            <a href={waLink(`Hola Bapesu, tengo una pregunta sobre el producto "${product.name}".`)} target="_blank" rel="noopener noreferrer" className={GHOST_BTN}>
              <WhatsappLogo size={20} aria-hidden="true" />Preguntar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreMessage({ Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-[#181818]">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
        <Icon size={32} weight="duotone" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-xl font-semibold text-gray-950 [text-wrap:balance] dark:text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-gray-600 [text-wrap:pretty] dark:text-gray-300">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  );
}

export default function StorePage() {
  const { cart, addToCart, isCartOpen, setCartOpen } = useEcommerce();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL);
  const [sort, setSort] = useState('name');
  const [selected, setSelected] = useState(null);
  const cartCount = cart.reduce((n, item) => n + item.quantity, 0);

  const { data: products = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['store', 'products', STORE_COMPANY_ID],
    enabled: Boolean(STORE_COMPANY_ID),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await storeApi.listProducts();
      if (error) throw error;
      return (data || []).map(toStoreProduct);
    },
  });

  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => { if (!map.has(p.categoryName)) map.set(p.categoryName, 0); map.set(p.categoryName, map.get(p.categoryName) + 1); });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [products]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = products.filter((p) =>
      (category === ALL || p.categoryName === category) &&
      (!term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)));
    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return sorted.sort((a, b) => (a.stock <= 0) - (b.stock <= 0));
  }, [products, search, category, sort]);

  const handleAdd = (product) => {
    const inCart = cart.find((item) => item.id === product.id)?.quantity || 0;
    if (inCart >= product.stock) return;
    addToCart(product);
  };

  useSeo({
    title: 'Tienda 3D Bapesu | Filamentos, resinas, repuestos e impresoras 3D en Colombia',
    description: 'Compra filamento PLA, PETG y TPU, resinas, boquillas, repuestos e impresoras 3D en Colombia. Precios en pesos, asesoría experta y pedido rápido por WhatsApp.',
    path: '/tienda',
    jsonLd: products.length ? {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Tienda 3D Bapesu',
      itemListElement: products.slice(0, 30).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          ...(p.description && { description: p.description }),
          ...(p.image && { image: p.image }),
          category: p.categoryName,
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: 'COP',
            availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: 'https://bapesuia.com/tienda',
          },
        },
      })),
    } : undefined,
  });

  const clearFilters = () => { setSearch(''); setCategory(ALL); };
  const chip = (active) => `shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${active ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 dark:bg-[#181818] dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/10'} ${EASE_CLASS} ${FOCUS}`;

  return (
    <div className="pb-16">
      {/* Encabezado */}
      <header className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300"><Storefront size={20} weight="duotone" aria-hidden="true" />Tienda Bapesu</p>
          <h1 className="mt-3 max-w-[680px] bg-gradient-to-r from-black to-[#666666] bg-clip-text text-4xl font-semibold tracking-tight text-transparent [text-wrap:balance] dark:from-white dark:to-[#9B9B9B] sm:text-5xl">
            Todo para imprimir en 3D, en un solo carrito
          </h1>
          <p className="mt-4 max-w-[680px] text-base text-gray-600 [text-wrap:pretty] dark:text-gray-300 sm:text-lg">
            Filamentos, resinas, repuestos e impresoras con precio en pesos. Arma tu pedido y confírmalo por WhatsApp en minutos.
          </p>
        </div>
        <ul className="grid gap-3">
          {trust.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#181818]">
              <Icon size={24} weight="duotone" className="shrink-0 text-indigo-500" aria-hidden="true" />
              <div><p className="text-sm font-semibold text-gray-950 dark:text-white">{title}</p><p className="text-xs text-gray-600 dark:text-gray-400">{text}</p></div>
            </li>
          ))}
        </ul>
      </header>

      {/* Barra de búsqueda y filtros */}
      <div className="sticky top-16 z-30 -mx-4 mt-10 border-y border-gray-200 bg-[#f7f8fc]/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-black/80">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[200px] flex-1">
            <span className="sr-only">Buscar productos</span>
            <MagnifyingGlass size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar filamento, boquilla, resina…" className={`w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 dark:border-white/15 dark:bg-[#181818] dark:text-white ${FOCUS}`} />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="hidden sm:inline">Ordenar</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={`rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/15 dark:bg-[#181818] dark:text-white ${FOCUS}`}>
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => setCartOpen(true)} className={`${PRIMARY_BTN} relative`} aria-label={`Abrir carrito, ${cartCount} productos`}>
            <ShoppingCart size={20} aria-hidden="true" /><span className="hidden sm:inline">Carrito</span>
            {cartCount > 0 && <span className="rounded-full bg-white px-2 text-xs font-semibold text-indigo-600">{cartCount}</span>}
          </button>
        </div>
        {categories.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por categoría">
            <button type="button" aria-pressed={category === ALL} onClick={() => setCategory(ALL)} className={chip(category === ALL)}>Todos ({products.length})</button>
            {categories.map(([name, count]) => (
              <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)} className={chip(category === name)}>{name} ({count})</button>
            ))}
          </div>
        )}
      </div>

      {/* Catálogo */}
      <section aria-label="Productos" className="mt-8">
        {!STORE_COMPANY_ID || (!isLoading && !isError && products.length === 0) ? (
          <StoreMessage Icon={Storefront} title="Estamos preparando el catálogo" text="Muy pronto verás aquí filamentos, resinas, repuestos e impresoras 3D. Mientras tanto, pídenos lo que necesitas por WhatsApp.">
            <a href={waLink('Hola Bapesu, quiero consultar productos de la tienda 3D.')} target="_blank" rel="noopener noreferrer" className={PRIMARY_BTN}><WhatsappLogo size={20} weight="fill" aria-hidden="true" />Pedir por WhatsApp</a>
          </StoreMessage>
        ) : isError ? (
          <StoreMessage Icon={ArrowCounterClockwise} title="No pudimos cargar los productos" text="Revisa tu conexión e inténtalo de nuevo. Si el problema sigue, escríbenos por WhatsApp.">
            <button type="button" onClick={() => refetch()} disabled={isFetching} className={PRIMARY_BTN}>{isFetching ? 'Cargando…' : 'Intentar de nuevo'}</button>
          </StoreMessage>
        ) : isLoading ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => <ProductSkeleton key={i} />)}
          </ul>
        ) : visible.length === 0 ? (
          <StoreMessage Icon={MagnifyingGlass} title="No encontramos productos con ese filtro" text={search ? `No hay resultados para "${search}". Prueba con otra palabra o pregúntanos si lo conseguimos.` : 'Esta categoría no tiene productos por ahora.'}>
            <button type="button" onClick={clearFilters} className={GHOST_BTN}>Limpiar filtros</button>
            <a href={waLink(`Hola Bapesu, busco "${search || category}" en la tienda 3D.`)} target="_blank" rel="noopener noreferrer" className={PRIMARY_BTN}><WhatsappLogo size={20} weight="fill" aria-hidden="true" />Preguntar si lo tienen</a>
          </StoreMessage>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400" aria-live="polite">{visible.length} {visible.length === 1 ? 'producto' : 'productos'}</p>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((product, index) => <ProductCard key={product.id} product={product} index={index} onAdd={handleAdd} onOpen={setSelected} />)}
            </ul>
          </>
        )}
      </section>

      {/* Llamado final */}
      <section aria-labelledby="store-cta-title" className="mt-16 rounded-3xl bg-[#181818] px-6 py-12 text-center text-white sm:mt-24 sm:px-10">
        <h2 id="store-cta-title" className="mx-auto max-w-[680px] text-3xl font-semibold tracking-tight [text-wrap:balance]">¿No encuentras lo que buscas?</h2>
        <p className="mx-auto mt-3 max-w-[680px] text-base text-gray-300 [text-wrap:pretty]">Conseguimos filamentos, repuestos y equipos bajo pedido. Cuéntanos la referencia y te cotizamos.</p>
        <a href={waLink('Hola Bapesu, busco un producto que no está en la tienda.')} target="_blank" rel="noopener noreferrer" className={`${PRIMARY_BTN} mt-8 focus-visible:ring-offset-[#181818]`}>
          <WhatsappLogo size={20} weight="fill" aria-hidden="true" />Pedir un producto
        </a>
      </section>

      <ProductDialog product={selected} onClose={() => setSelected(null)} onAdd={handleAdd} />
      <StoreCart open={isCartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
