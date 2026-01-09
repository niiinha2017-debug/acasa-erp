-- AlterTable
ALTER TABLE `funcionarios` ADD COLUMN `custo_hora_producao` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE `producao_projetos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `origem_tipo` VARCHAR(191) NOT NULL,
    `origem_id` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ABERTO',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `producao_projetos_origem_tipo_idx`(`origem_tipo`),
    INDEX `producao_projetos_origem_id_idx`(`origem_id`),
    INDEX `producao_projetos_status_idx`(`status`),
    UNIQUE INDEX `producao_projetos_origem_tipo_origem_id_key`(`origem_tipo`, `origem_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `producao_tarefas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projeto_id` INTEGER NOT NULL,
    `funcionario_id` INTEGER NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `observacao` VARCHAR(191) NULL,
    `inicio_em` DATETIME(3) NOT NULL,
    `fim_em` DATETIME(3) NOT NULL,
    `custo_hora_aplicado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `custo_total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `producao_tarefas_projeto_id_idx`(`projeto_id`),
    INDEX `producao_tarefas_funcionario_id_idx`(`funcionario_id`),
    INDEX `producao_tarefas_status_idx`(`status`),
    INDEX `producao_tarefas_inicio_em_idx`(`inicio_em`),
    INDEX `producao_tarefas_fim_em_idx`(`fim_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `producao_tarefas` ADD CONSTRAINT `producao_tarefas_projeto_id_fkey` FOREIGN KEY (`projeto_id`) REFERENCES `producao_projetos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producao_tarefas` ADD CONSTRAINT `producao_tarefas_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
