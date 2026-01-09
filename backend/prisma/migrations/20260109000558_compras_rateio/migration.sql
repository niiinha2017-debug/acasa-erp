/*
  Warnings:

  - You are about to drop the column `nome_ambiente` on the `compras` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `compras_venda_id_nome_ambiente_idx` ON `compras`;

-- AlterTable
ALTER TABLE `compras` DROP COLUMN `nome_ambiente`;

-- CreateTable
CREATE TABLE `compras_rateio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `compra_id` INTEGER NOT NULL,
    `nome_ambiente` VARCHAR(191) NOT NULL,
    `valor_alocado` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `compras_rateio_compra_id_idx`(`compra_id`),
    INDEX `compras_rateio_nome_ambiente_idx`(`nome_ambiente`),
    UNIQUE INDEX `compras_rateio_compra_id_nome_ambiente_key`(`compra_id`, `nome_ambiente`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `compras_rateio` ADD CONSTRAINT `compras_rateio_compra_id_fkey` FOREIGN KEY (`compra_id`) REFERENCES `compras`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
