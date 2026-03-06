-- Corrige o histórico: a migration 20250304_add_cargo_usuarios foi renomeada para 20260106000000_add_cargo_usuarios.
-- Execute este SQL no MySQL (ex: mysql -u root -p acasa_erp < prisma/fix-migration-history.sql)
-- e depois rode: npx prisma migrate resolve --applied 20260106000000_add_cargo_usuarios

DELETE FROM _prisma_migrations WHERE migration_name = '20250304_add_cargo_usuarios';
