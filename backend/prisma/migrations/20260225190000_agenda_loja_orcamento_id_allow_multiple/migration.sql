-- Drop unique constraint on agenda_loja.orcamento_id so multiple agenda items can link to the same orcamento (e.g. medida + apresentação + contrato)
-- MySQL requires dropping the FK first because it uses the unique index
ALTER TABLE `agenda_loja` DROP FOREIGN KEY `agenda_loja_orcamento_id_fkey`;
DROP INDEX `agenda_loja_orcamento_id_key` ON `agenda_loja`;
CREATE INDEX `agenda_loja_orcamento_id_idx` ON `agenda_loja`(`orcamento_id`);
ALTER TABLE `agenda_loja` ADD CONSTRAINT `agenda_loja_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
