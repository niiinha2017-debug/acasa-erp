/*
  Warnings:

  - You are about to drop the `obras` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `obras` DROP FOREIGN KEY `obras_cliente_id_fkey`;

-- DropTable
DROP TABLE `obras`;
