-- Garantir categoria_base preenchida antes de tornar obrigatoria
UPDATE `produtos`
SET `categoria_base` = 'PRIMARIA'
WHERE `categoria_base` IS NULL OR TRIM(`categoria_base`) = '';

-- Remover indice legado de tipo_aplicacao
DROP INDEX `produtos_tipo_aplicacao_idx` ON `produtos`;

-- Remover colunas legadas e consolidar categoria_base
ALTER TABLE `produtos`
  DROP COLUMN `categoria`,
  DROP COLUMN `tipo_aplicacao`,
  MODIFY `categoria_base` VARCHAR(191) NOT NULL DEFAULT 'PRIMARIA';
