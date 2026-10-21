-- =====================================================================
-- Tienda en línea pública (bapesuia.com/tienda)
--
-- Los productos de la tienda salen del módulo de Inventario del panel.
-- Solo se publican los productos de UNA empresa (la tienda de Bapesu)
-- que estén activos y marcados con "Mostrar en la tienda".
--
-- ANTES DE EJECUTAR: reemplaza 00000000-0000-0000-0000-000000000000
-- por el id de tu empresa (tabla bapesu_companies). Usa el mismo valor
-- en la variable VITE_STORE_COMPANY_ID del client (.env y Vercel).
--
-- Para ver el id:  SELECT id, name FROM public.bapesu_companies;
-- =====================================================================

ALTER TABLE public.bapesu_products
    ADD COLUMN IF NOT EXISTS show_in_store BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_store
    ON public.bapesu_products(company_id)
    WHERE show_in_store AND is_active;

-- Empresa dueña de la tienda pública
CREATE OR REPLACE FUNCTION public.store_company_id()
RETURNS UUID LANGUAGE sql IMMUTABLE AS $$
    SELECT '00000000-0000-0000-0000-000000000000'::uuid
$$;
GRANT EXECUTE ON FUNCTION public.store_company_id() TO anon, authenticated;

-- Cualquier visitante puede LEER los productos publicados de la tienda.
-- No da permiso de escritura; las políticas existentes siguen igual.
DROP POLICY IF EXISTS "store_products_public_read" ON public.bapesu_products;
CREATE POLICY "store_products_public_read" ON public.bapesu_products
    FOR SELECT TO anon, authenticated
    USING (company_id = public.store_company_id() AND show_in_store AND is_active);

-- Y las categorías de la empresa de la tienda (para los filtros).
DROP POLICY IF EXISTS "store_categories_public_read" ON public.bapesu_inventory_categories;
CREATE POLICY "store_categories_public_read" ON public.bapesu_inventory_categories
    FOR SELECT TO anon, authenticated
    USING (company_id = public.store_company_id());

GRANT SELECT ON public.bapesu_products TO anon;
GRANT SELECT ON public.bapesu_inventory_categories TO anon;
