/*
  Warnings:

  - You are about to drop the `producao_projetos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `producao_tarefa_funcionarios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `producao_tarefas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `producao_projetos` DROP FOREIGN KEY `producao_projetos_plano_corte_id_fkey`;

-- DropForeignKey
ALTER TABLE `producao_projetos` DROP FOREIGN KEY `producao_projetos_venda_item_id_fkey`;

-- DropForeignKey
ALTER TABLE `producao_tarefa_funcionarios` DROP FOREIGN KEY `producao_tarefa_funcionarios_funcionario_id_fkey`;

-- DropForeignKey
ALTER TABLE `producao_tarefa_funcionarios` DROP FOREIGN KEY `producao_tarefa_funcionarios_tarefa_id_fkey`;

-- DropForeignKey
ALTER TABLE `producao_tarefas` DROP FOREIGN KEY `producao_tarefas_projeto_id_fkey`;

-- DropTable
DROP TABLE `producao_projetos`;

-- DropTable
DROP TABLE `producao_tarefa_funcionarios`;

-- DropTable
DROP TABLE `producao_tarefas`;

-- CreateTable
CREATE TABLE `projetos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(60) NOT NULL,
    `cliente_id` INTEGER NOT NULL,
    `orcamento_id` INTEGER NULL,
    `venda_id` INTEGER NULL,
    `status_atual` VARCHAR(191) NOT NULL DEFAULT 'CLIENTE_CADASTRADO',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `projetos_codigo_key`(`codigo`),
    UNIQUE INDEX `projetos_orcamento_id_key`(`orcamento_id`),
    UNIQUE INDEX `projetos_venda_id_key`(`venda_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agenda_global` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `orcamento_id` INTEGER NULL,
    `venda_id` INTEGER NULL,
    `projeto_id` INTEGER NULL,
    `plano_corte_id` INTEGER NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `inicio_em` DATETIME(3) NOT NULL,
    `fim_em` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agenda_global_orcamento_id_key`(`orcamento_id`),
    UNIQUE INDEX `agenda_global_venda_id_key`(`venda_id`),
    UNIQUE INDEX `agenda_global_plano_corte_id_key`(`plano_corte_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agenda_funcionarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agenda_id` INTEGER NOT NULL,
    `funcionario_id` INTEGER NOT NULL,

    INDEX `agenda_funcionarios_agenda_id_idx`(`agenda_id`),
    INDEX `agenda_funcionarios_funcionario_id_idx`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `projetos` ADD CONSTRAINT `projetos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projetos` ADD CONSTRAINT `projetos_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projetos` ADD CONSTRAINT `projetos_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_global` ADD CONSTRAINT `agenda_global_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_global` ADD CONSTRAINT `agenda_global_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_global` ADD CONSTRAINT `agenda_global_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_global` ADD CONSTRAINT `agenda_global_projeto_id_fkey` FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_global` ADD CONSTRAINT `agenda_global_plano_corte_id_fkey` FOREIGN KEY (`plano_corte_id`) REFERENCES `plano_corte`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_funcionarios` ADD CONSTRAINT `agenda_funcionarios_agenda_id_fkey` FOREIGN KEY (`agenda_id`) REFERENCES `agenda_global`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_funcionarios` ADD CONSTRAINT `agenda_funcionarios_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
