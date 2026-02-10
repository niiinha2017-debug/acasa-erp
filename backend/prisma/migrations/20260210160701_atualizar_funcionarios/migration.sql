-- DropForeignKey
ALTER TABLE `agenda_global` DROP FOREIGN KEY `agenda_global_cliente_id_fkey`;

-- AddForeignKey
ALTER TABLE `agenda_global` ADD CONSTRAINT `agenda_global_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
