/*
  Warnings:

  - You are about to drop the column `localidade` on the `ponto_registros` table. All the data in the column will be lost.
  - You are about to drop the `constantes` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `ponto_registros` DROP COLUMN `localidade`,
    ADD COLUMN `bairro` VARCHAR(120) NULL,
    ADD COLUMN `cidade` VARCHAR(120) NULL,
    ADD COLUMN `estado` VARCHAR(2) NULL,
    ADD COLUMN `rua` VARCHAR(150) NULL;

-- DropTable
DROP TABLE `constantes`;
