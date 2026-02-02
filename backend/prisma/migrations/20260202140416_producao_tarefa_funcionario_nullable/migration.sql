-- DropForeignKey
ALTER TABLE `producao_tarefas` DROP FOREIGN KEY `producao_tarefas_funcionario_id_fkey`;

-- AlterTable
ALTER TABLE `producao_tarefas` MODIFY `funcionario_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `producao_tarefas` ADD CONSTRAINT `producao_tarefas_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
