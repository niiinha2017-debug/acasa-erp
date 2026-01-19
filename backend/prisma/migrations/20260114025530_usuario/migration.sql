/*
  Warnings:

  - You are about to drop the column `funcao` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `setor` on the `usuarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `usuarios` DROP COLUMN `funcao`,
    DROP COLUMN `setor`;
