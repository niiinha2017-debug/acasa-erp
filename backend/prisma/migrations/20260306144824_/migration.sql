/*
  Warnings:

  - You are about to drop the column `expira_em` on the `recuperacao_senha` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `recuperacao_senha_expira_em_idx` ON `recuperacao_senha`;

-- AlterTable
ALTER TABLE `recuperacao_senha` DROP COLUMN `expira_em`;
