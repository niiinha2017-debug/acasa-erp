-- Backfill categoria_base for legacy produtos rows
UPDATE `produtos`
SET `categoria_base` = CASE
    WHEN UPPER(TRIM(COALESCE(`tipo_aplicacao`, ''))) = 'INSUMO' THEN 'INSUMO'
    WHEN UPPER(TRIM(COALESCE(`categoria`, ''))) LIKE '%INSUMO%' THEN 'INSUMO'
    WHEN UPPER(TRIM(COALESCE(`categoria`, ''))) LIKE '%TERCI%' THEN 'TERCIARIA'
    WHEN UPPER(TRIM(COALESCE(`categoria`, ''))) LIKE '%PREMIUM%' THEN 'TERCIARIA'
    WHEN UPPER(TRIM(COALESCE(`categoria`, ''))) LIKE '%SECUND%' THEN 'SECUNDARIA'
    WHEN UPPER(TRIM(COALESCE(`categoria`, ''))) LIKE '%DESIGN%' THEN 'SECUNDARIA'
    WHEN UPPER(TRIM(COALESCE(`categoria`, ''))) LIKE '%PRIM%' THEN 'PRIMARIA'
    WHEN UPPER(TRIM(COALESCE(`categoria`, ''))) LIKE '%ESSENCIAL%' THEN 'PRIMARIA'
    ELSE 'PRIMARIA'
END
WHERE `categoria_base` IS NULL OR TRIM(`categoria_base`) = '';
