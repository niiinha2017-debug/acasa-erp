/*
  Warnings:

  - You are about to drop the `cheques` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `cheques` DROP FOREIGN KEY `cheques_conta_pagar_id_fkey`;

-- DropTable
DROP TABLE `cheques`;

-- CreateTable
CREATE TABLE `titulos_financeiros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `despesa_id` INTEGER NULL,
    `conta_pagar_id` INTEGER NULL,
    `conta_receber_id` INTEGER NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(191) NOT NULL,
    `vencimento_em` DATETIME(3) NOT NULL,
    `pago_em` DATETIME(3) NULL,
    `parcelas_total` INTEGER NULL,
    `parcela_numero` INTEGER NULL,
    `meta` JSON NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `titulos_financeiros_status_idx`(`status`),
    INDEX `titulos_financeiros_vencimento_em_idx`(`vencimento_em`),
    INDEX `titulos_financeiros_despesa_id_idx`(`despesa_id`),
    INDEX `titulos_financeiros_conta_pagar_id_idx`(`conta_pagar_id`),
    INDEX `titulos_financeiros_conta_receber_id_idx`(`conta_receber_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `titulos_financeiros` ADD CONSTRAINT `titulos_financeiros_despesa_id_fkey` FOREIGN KEY (`despesa_id`) REFERENCES `despesas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `titulos_financeiros` ADD CONSTRAINT `titulos_financeiros_conta_pagar_id_fkey` FOREIGN KEY (`conta_pagar_id`) REFERENCES `contas_pagar`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `titulos_financeiros` ADD CONSTRAINT `titulos_financeiros_conta_receber_id_fkey` FOREIGN KEY (`conta_receber_id`) REFERENCES `contas_receber`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
