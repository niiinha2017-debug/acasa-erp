-- AlterTable: adiciona cargo apenas se ainda não existir (evita erro em DB que já teve 20250304_add_cargo_usuarios)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'cargo');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `usuarios` ADD COLUMN `cargo` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
