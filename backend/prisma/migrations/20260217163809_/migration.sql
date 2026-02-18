/*
  Warnings:

  - You are about to drop the column `categoria` on the `agenda_global` table. All the data in the column will be lost.
  - You are about to drop the column `origem_fluxo` on the `agenda_global` table. All the data in the column will be lost.
  - You are about to drop the column `contato_referencia_nome` on the `funcionarios` table. All the data in the column will be lost.
  - You are about to drop the column `contato_referencia_telefone` on the `funcionarios` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `agenda_global_categoria_idx` ON `agenda_global`;

-- DropIndex
DROP INDEX `agenda_global_origem_fluxo_idx` ON `agenda_global`;

-- AlterTable
ALTER TABLE `agenda_global` DROP COLUMN `categoria`,
    DROP COLUMN `origem_fluxo`;

-- AlterTable
ALTER TABLE `funcionarios` DROP COLUMN `contato_referencia_nome`,
    DROP COLUMN `contato_referencia_telefone`;
