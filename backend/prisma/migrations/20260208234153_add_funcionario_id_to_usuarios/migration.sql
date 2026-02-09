/*
  Warnings:

  - A unique constraint covering the columns `[usuario_id]` on the table `funcionarios` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[funcionario_id]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `funcionarios` ADD COLUMN `usuario_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `funcionario_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `funcionarios_usuario_id_key` ON `funcionarios`(`usuario_id`);

-- CreateIndex
CREATE UNIQUE INDEX `usuarios_funcionario_id_key` ON `usuarios`(`funcionario_id`);

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
