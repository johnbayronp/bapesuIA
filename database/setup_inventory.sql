-- ============================================================
-- MÓDULO INVENTARIO — Bapesu Platform
-- Tablas: bapesu_inventory_categories, bapesu_products
-- ============================================================

-- ── Extensión UUID ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Categorías ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_inventory_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES public.bapesu_inventory_categories(id) ON DELETE SET NULL,
  description TEXT,
  color       TEXT DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Productos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,

  -- Ficha
  name        TEXT NOT NULL,
  sku         TEXT,
  barcode     TEXT,
  description TEXT,
  category_id UUID REFERENCES public.bapesu_inventory_categories(id) ON DELETE SET NULL,
  unit        TEXT DEFAULT 'unidad',
  photo_url   TEXT,
  is_active   BOOLEAN DEFAULT TRUE,

  -- Stock
  stock_available  INTEGER DEFAULT 0,
  stock_reserved   INTEGER DEFAULT 0,
  stock_in_transit INTEGER DEFAULT 0,
  stock_min        INTEGER DEFAULT 0,   -- alerta de stock mínimo
  stock_location   TEXT,

  -- Precios y costos
  purchase_price   NUMERIC(14,2) DEFAULT 0,
  sale_price       NUMERIC(14,2) DEFAULT 0,
  tax_rate         NUMERIC(5,2)  DEFAULT 19, -- IVA %

  -- Meta
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Historial de movimientos de stock ──────────────────────
CREATE TABLE IF NOT EXISTS public.bapesu_stock_movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES public.bapesu_companies(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.bapesu_products(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('entrada','salida','ajuste','reserva')),
  quantity    INTEGER NOT NULL,
  notes       TEXT,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Índices ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inv_cat_company   ON public.bapesu_inventory_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company  ON public.bapesu_products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.bapesu_products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku      ON public.bapesu_products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_mov_product ON public.bapesu_stock_movements(product_id);

-- ── Trigger updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inv_cat_updated_at') THEN
    CREATE TRIGGER trg_inv_cat_updated_at
      BEFORE UPDATE ON public.bapesu_inventory_categories
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated_at') THEN
    CREATE TRIGGER trg_products_updated_at
      BEFORE UPDATE ON public.bapesu_products
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.bapesu_inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bapesu_stock_movements      ENABLE ROW LEVEL SECURITY;

-- Categorías
CREATE POLICY "inv_cat_select" ON public.bapesu_inventory_categories FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());
CREATE POLICY "inv_cat_insert" ON public.bapesu_inventory_categories FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "inv_cat_update" ON public.bapesu_inventory_categories FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id());
CREATE POLICY "inv_cat_delete" ON public.bapesu_inventory_categories FOR DELETE TO authenticated
  USING (company_id = public.current_user_company_id());

-- Productos
CREATE POLICY "products_select" ON public.bapesu_products FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());
CREATE POLICY "products_insert" ON public.bapesu_products FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());
CREATE POLICY "products_update" ON public.bapesu_products FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company_id());
CREATE POLICY "products_delete" ON public.bapesu_products FOR DELETE TO authenticated
  USING (company_id = public.current_user_company_id());

-- Movimientos de stock
CREATE POLICY "stock_mov_select" ON public.bapesu_stock_movements FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());
CREATE POLICY "stock_mov_insert" ON public.bapesu_stock_movements FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());
