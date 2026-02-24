-- Create replacement index required by FK before dropping unique
CREATE INDEX `agenda_global_venda_id_idx` ON `agenda_global`(`venda_id`);

-- DropIndex
DROP INDEX `agenda_global_venda_id_key` ON `agenda_global`;

-- AlterTable
ALTER TABLE `agenda_global` MODIFY `categoria` VARCHAR(191) NULL,
    MODIFY `origem_fluxo` VARCHAR(191) NULL,
    MODIFY `setor_destino` VARCHAR(191) NULL DEFAULT 'LOJA';
