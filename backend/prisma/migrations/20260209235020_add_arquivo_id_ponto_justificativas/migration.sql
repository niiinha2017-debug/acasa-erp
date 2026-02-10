-- AlterTable
ALTER TABLE `ponto_justificativas` ADD COLUMN `arquivo_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ponto_justificativas` ADD CONSTRAINT `ponto_justificativas_arquivo_id_fkey` FOREIGN KEY (`arquivo_id`) REFERENCES `arquivos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
