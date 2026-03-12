-- Adiciona saldo_credito em fornecedor só se a coluna ainda não existir (evita "Duplicate column" em ambientes que já têm)
SET @add_col = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'saldo_credito') = 0,
  'ALTER TABLE `fornecedor` ADD COLUMN `saldo_credito` DECIMAL(10, 2) NULL',
  'SELECT 1'
));
PREPARE stmt FROM @add_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
