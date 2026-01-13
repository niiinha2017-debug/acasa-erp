/*
  Warnings:

  - You are about to drop the column `criado_em` on the `usuarios_permissoes` table. All the data in the column will be lost.
  - You are about to drop the `fornecedores` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `compras` DROP FOREIGN KEY `compras_fornecedor_id_fkey`;

-- DropForeignKey
ALTER TABLE `contas_pagar` DROP FOREIGN KEY `contas_pagar_fornecedor_cobrador_id_fkey`;

-- DropForeignKey
ALTER TABLE `contas_pagar` DROP FOREIGN KEY `contas_pagar_fornecedor_id_fkey`;

-- DropForeignKey
ALTER TABLE `contas_receber` DROP FOREIGN KEY `contas_receber_fornecedor_id_fkey`;

-- DropForeignKey
ALTER TABLE `fornecedor_compensacoes` DROP FOREIGN KEY `fornecedor_compensacoes_fornecedor_id_fkey`;

-- DropForeignKey
ALTER TABLE `plano_corte` DROP FOREIGN KEY `plano_corte_fornecedor_id_fkey`;

-- DropForeignKey
ALTER TABLE `plano_corte_item` DROP FOREIGN KEY `plano_corte_item_fornecedor_id_fkey`;

-- DropForeignKey
ALTER TABLE `produtos` DROP FOREIGN KEY `produtos_fornecedor_id_fkey`;

-- DropForeignKey
ALTER TABLE `recuperacao_senha` DROP FOREIGN KEY `recuperacao_senha_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `usuarios_permissoes` DROP FOREIGN KEY `usuarios_permissoes_permissao_id_fkey`;

-- DropForeignKey
ALTER TABLE `usuarios_permissoes` DROP FOREIGN KEY `usuarios_permissoes_usuario_id_fkey`;

-- AlterTable
ALTER TABLE `usuarios_permissoes` DROP COLUMN `criado_em`;

-- DropTable
DROP TABLE `fornecedores`;

-- CreateTable
CREATE TABLE `fornecedor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `razao_social` VARCHAR(191) NOT NULL,
    `nome_fantasia` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NOT NULL,
    `ie` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `cep` VARCHAR(191) NULL,
    `endereco` VARCHAR(191) NULL,
    `numero` VARCHAR(191) NULL,
    `bairro` VARCHAR(191) NULL,
    `cidade` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NULL,
    `forma_pagamento` VARCHAR(191) NULL,
    `data_vencimento` INTEGER NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fornecedor_cnpj_key`(`cnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recuperacao_senha` ADD CONSTRAINT `recuperacao_senha_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_permissoes` ADD CONSTRAINT `usuarios_permissoes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_permissoes` ADD CONSTRAINT `usuarios_permissoes_permissao_id_fkey` FOREIGN KEY (`permissao_id`) REFERENCES `permissoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produtos` ADD CONSTRAINT `produtos_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plano_corte` ADD CONSTRAINT `plano_corte_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plano_corte_item` ADD CONSTRAINT `plano_corte_item_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_fornecedor_cobrador_id_fkey` FOREIGN KEY (`fornecedor_cobrador_id`) REFERENCES `fornecedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_receber` ADD CONSTRAINT `contas_receber_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fornecedor_compensacoes` ADD CONSTRAINT `fornecedor_compensacoes_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `recuperacao_senha` RENAME INDEX `recuperacao_senha_usuario_id_fkey` TO `recuperacao_senha_usuario_id_idx`;
