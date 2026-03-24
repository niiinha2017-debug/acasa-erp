-- AddForeignKey para clientes.criado_por_usuario_id
ALTER TABLE `clientes` ADD COLUMN `criado_por_usuario_id` INT NULL;

ALTER TABLE `clientes` ADD CONSTRAINT `clientes_criado_por_usuario_id_fkey` 
  FOREIGN KEY (`criado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL;

-- Backfill: clientes existentes sem criado_por_usuario_id mantêm NULL
-- (serão acessíveis apenas por admins e vendedores responsáveis)
