-- Corregir la función RPC para eliminar la ambigüedad de product_id
DROP FUNCTION IF EXISTS get_products_rating_stats(BIGINT[]);

CREATE OR REPLACE FUNCTION get_products_rating_stats(product_ids BIGINT[])
RETURNS TABLE (
    product_id BIGINT,
    average_rating NUMERIC(3,2),
    total_ratings INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.product_id,
        COALESCE(AVG(pr.rating)::NUMERIC(3,2), 0.00) as average_rating,
        COALESCE(COUNT(pr.id)::INTEGER, 0) as total_ratings
    FROM product_ratings pr
    WHERE pr.product_id = ANY(product_ids)
    AND pr.is_approved = true
    GROUP BY pr.product_id;
    
    -- Incluir productos sin calificaciones con valores por defecto
    RETURN QUERY
    SELECT 
        p.id as product_id,
        0.00 as average_rating,
        0 as total_ratings
    FROM products p
    WHERE p.id = ANY(product_ids)
    AND p.id NOT IN (
        SELECT DISTINCT pr_inner.product_id 
        FROM product_ratings pr_inner
        WHERE pr_inner.product_id = ANY(product_ids) 
        AND pr_inner.is_approved = true
    );
END;
$$;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_products_rating_stats(BIGINT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_products_rating_stats(BIGINT[]) TO service_role;

-- Probar la función corregida
SELECT '=== PRUEBA FUNCIÓN RPC CORREGIDA ===' as info;
SELECT * FROM get_products_rating_stats(ARRAY[1,2,3,4]); 