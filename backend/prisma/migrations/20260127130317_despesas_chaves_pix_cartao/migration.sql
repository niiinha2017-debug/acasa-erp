/*
  Warnings:

  - You are about to drop the column `cartao_credito_id` on the `despesas` table. All the data in the column will be lost.
  - You are about to drop the column `conta_bancaria_id` on the `despesas` table. All the data in the column will be lost.
  - You are about to drop the `cartoes_credito` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contas_bancarias` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `despesas` DROP FOREIGN KEY `despesas_cartao_credito_id_fkey`;

-- DropForeignKey
ALTER TABLE `despesas` DROP FOREIGN KEY `despesas_conta_bancaria_id_fkey`;

-- AlterTable
ALTER TABLE `despesas` DROP COLUMN `cartao_credito_id`,
    DROP COLUMN `conta_bancaria_id`,
    ADD COLUMN `cartao_credito_key` VARCHAR(50) NULL,
    ADD COLUMN `conta_bancaria_key` VARCHAR(50) NULL,
    ADD COLUMN `conta_bancaria_tipo_key` VARCHAR(50) NULL;

-- DropTable
DROP TABLE `cartoes_credito`;

-- DropTable
DROP TABLE `contas_bancarias`;

-- CreateIndex
CREATE INDEX `despesas_conta_bancaria_key_idx` ON `despesas`(`conta_bancaria_key`);

-- CreateIndex
CREATE INDEX `despesas_conta_bancaria_tipo_key_idx` ON `despesas`(`conta_bancaria_tipo_key`);

-- CreateIndex
CREATE INDEX `despesas_cartao_credito_key_idx` ON `despesas`(`cartao_credito_key`);
