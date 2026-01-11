/*
  Warnings:

  - A unique constraint covering the columns `[despesa_id]` on the table `contas_pagar` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `contas_pagar` ADD COLUMN `despesa_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `cheques` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(191) NOT NULL,
    `banco` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `data_emissao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_vencimento` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'EM_MAO',
    `emitente_nome` VARCHAR(191) NULL,
    `conta_pagar_id` INTEGER NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cheques_numero_key`(`numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `contas_pagar_despesa_id_key` ON `contas_pagar`(`despesa_id`);

-- AddForeignKey
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_despesa_id_fkey` FOREIGN KEY (`despesa_id`) REFERENCES `despesas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cheques` ADD CONSTRAINT `cheques_conta_pagar_id_fkey` FOREIGN KEY (`conta_pagar_id`) REFERENCES `contas_pagar`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
