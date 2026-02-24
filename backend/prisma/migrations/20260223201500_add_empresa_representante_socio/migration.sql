-- AlterTable
ALTER TABLE `empresa`
    ADD COLUMN `representante_legal_socio_nome` VARCHAR(191) NULL,
    ADD COLUMN `representante_legal_socio_cpf` VARCHAR(191) NULL,
    ADD COLUMN `representante_legal_socio_rg` VARCHAR(191) NULL;
