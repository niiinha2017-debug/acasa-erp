/*
  Warnings:

  - Added the required column `ano_referencia` to the `contas_pagar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mes_referencia` to the `contas_pagar` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `contas_pagar` ADD COLUMN `ano_referencia` INTEGER NOT NULL,
    ADD COLUMN `mes_referencia` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `empresa` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `razao_social` VARCHAR(191) NULL,
    `nome_fantasia` VARCHAR(191) NULL,
    `cnpj` VARCHAR(191) NULL,
    `ie` VARCHAR(191) NULL,
    `logradouro` VARCHAR(191) NULL,
    `numero` VARCHAR(191) NULL,
    `bairro` VARCHAR(191) NULL,
    `cidade` VARCHAR(191) NULL,
    `uf` VARCHAR(2) NULL,
    `cep` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `logo_url` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `empresa_cnpj_key`(`cnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
