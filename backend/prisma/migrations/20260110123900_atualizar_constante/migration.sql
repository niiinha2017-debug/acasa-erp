/*
  Warnings:

  - You are about to drop the column `tipo` on the `constantes` table. All the data in the column will be lost.
  - You are about to drop the column `valor_booleano` on the `constantes` table. All the data in the column will be lost.
  - You are about to drop the column `valor_json` on the `constantes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `constantes` DROP COLUMN `tipo`,
    DROP COLUMN `valor_booleano`,
    DROP COLUMN `valor_json`;
