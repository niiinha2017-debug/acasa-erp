/*
  Warnings:

  - You are about to drop the column `data_pagamento` on the `funcionarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `funcionarios` DROP COLUMN `data_pagamento`,
    ADD COLUMN `dia_pagamento` INTEGER NULL;
