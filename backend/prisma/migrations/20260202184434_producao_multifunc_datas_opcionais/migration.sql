/*
  Warnings:

  - You are about to drop the column `custo_hora_aplicado` on the `producao_tarefas` table. All the data in the column will be lost.
  - You are about to drop the column `funcao_aplicada` on the `producao_tarefas` table. All the data in the column will be lost.
  - You are about to drop the column `funcionario_id` on the `producao_tarefas` table. All the data in the column will be lost.
  - You are about to drop the column `titulo` on the `producao_tarefas` table. All the data in the column will be lost.
  - Added the required column `etapa` to the `producao_tarefas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `producao_tarefas` DROP FOREIGN KEY `producao_tarefas_funcionario_id_fkey`;

-- AlterTable
ALTER TABLE `producao_tarefas` DROP COLUMN `custo_hora_aplicado`,
    DROP COLUMN `funcao_aplicada`,
    DROP COLUMN `funcionario_id`,
    DROP COLUMN `titulo`,
    ADD COLUMN `etapa` VARCHAR(191) NOT NULL,
    MODIFY `inicio_em` DATETIME(3) NULL,
    MODIFY `fim_em` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `producao_tarefa_funcionarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tarefa_id` INTEGER NOT NULL,
    `funcionario_id` INTEGER NOT NULL,
    `funcao_aplicada` VARCHAR(80) NULL,
    `custo_hora_aplicado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,

    INDEX `producao_tarefa_funcionarios_funcionario_id_idx`(`funcionario_id`),
    UNIQUE INDEX `producao_tarefa_funcionarios_tarefa_id_funcionario_id_key`(`tarefa_id`, `funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `producao_tarefas_etapa_idx` ON `producao_tarefas`(`etapa`);

-- AddForeignKey
ALTER TABLE `producao_tarefa_funcionarios` ADD CONSTRAINT `producao_tarefa_funcionarios_tarefa_id_fkey` FOREIGN KEY (`tarefa_id`) REFERENCES `producao_tarefas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producao_tarefa_funcionarios` ADD CONSTRAINT `producao_tarefa_funcionarios_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
