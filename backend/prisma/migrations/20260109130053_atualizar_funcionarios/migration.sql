/*
  Warnings:

  - You are about to drop the column `conta_bancaria` on the `funcionarios` table. All the data in the column will be lost.
  - You are about to drop the column `horario_almoco` on the `funcionarios` table. All the data in the column will be lost.
  - You are about to drop the column `horario_entrada` on the `funcionarios` table. All the data in the column will be lost.
  - You are about to drop the column `horario_saida` on the `funcionarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `funcionarios` DROP COLUMN `conta_bancaria`,
    DROP COLUMN `horario_almoco`,
    DROP COLUMN `horario_entrada`,
    DROP COLUMN `horario_saida`,
    ADD COLUMN `agencia` VARCHAR(191) NULL,
    ADD COLUMN `banco` VARCHAR(191) NULL,
    ADD COLUMN `conta` VARCHAR(191) NULL,
    ADD COLUMN `data_nascimento` DATETIME(3) NULL,
    ADD COLUMN `horario_entrada_1` VARCHAR(191) NULL,
    ADD COLUMN `horario_entrada_2` VARCHAR(191) NULL,
    ADD COLUMN `horario_saida_1` VARCHAR(191) NULL,
    ADD COLUMN `horario_saida_2` VARCHAR(191) NULL,
    ADD COLUMN `pix_chave` VARCHAR(191) NULL,
    ADD COLUMN `pix_tipo_chave` VARCHAR(191) NULL,
    ADD COLUMN `tem_vale` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tem_vale_transporte` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `vale_transporte` DECIMAL(12, 2) NULL;
