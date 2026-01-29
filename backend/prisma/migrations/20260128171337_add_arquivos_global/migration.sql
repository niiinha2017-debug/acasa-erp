/*
  Warnings:

  - You are about to drop the column `logo_url` on the `empresa` table. All the data in the column will be lost.
  - You are about to drop the `funcionarios_arquivos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orcamento_arquivos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ponto_justificativas_arquivos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `producao_arquivos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vendas_arquivos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `funcionarios_arquivos` DROP FOREIGN KEY `funcionarios_arquivos_funcionario_id_fkey`;

-- DropForeignKey
ALTER TABLE `orcamento_arquivos` DROP FOREIGN KEY `orcamento_arquivos_orcamento_id_fkey`;

-- DropForeignKey
ALTER TABLE `ponto_justificativas_arquivos` DROP FOREIGN KEY `ponto_justificativas_arquivos_justificativa_id_fkey`;

-- DropForeignKey
ALTER TABLE `producao_arquivos` DROP FOREIGN KEY `producao_arquivos_projeto_id_fkey`;

-- DropForeignKey
ALTER TABLE `vendas_arquivos` DROP FOREIGN KEY `vendas_arquivos_venda_id_fkey`;

-- AlterTable
ALTER TABLE `empresa` DROP COLUMN `logo_url`;

-- DropTable
DROP TABLE `funcionarios_arquivos`;

-- DropTable
DROP TABLE `orcamento_arquivos`;

-- DropTable
DROP TABLE `ponto_justificativas_arquivos`;

-- DropTable
DROP TABLE `producao_arquivos`;

-- DropTable
DROP TABLE `vendas_arquivos`;

-- CreateTable
CREATE TABLE `arquivos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_type` VARCHAR(191) NOT NULL,
    `owner_id` INTEGER NOT NULL,
    `categoria` VARCHAR(191) NULL,
    `slot_key` VARCHAR(191) NULL,
    `url` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NULL,
    `mime_type` VARCHAR(191) NULL,
    `tamanho` INTEGER NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `arquivos_owner_type_owner_id_idx`(`owner_type`, `owner_id`),
    INDEX `arquivos_owner_type_owner_id_categoria_idx`(`owner_type`, `owner_id`, `categoria`),
    UNIQUE INDEX `arquivos_owner_type_owner_id_slot_key_key`(`owner_type`, `owner_id`, `slot_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
