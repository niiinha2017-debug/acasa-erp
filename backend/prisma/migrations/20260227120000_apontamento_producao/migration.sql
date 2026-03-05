-- CreateTable
CREATE TABLE `apontamento_producao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agenda_fabrica_id` INTEGER NULL,
    `venda_id` INTEGER NULL,
    `funcionario_id` INTEGER NOT NULL,
    `categoria` VARCHAR(60) NULL,
    `data` DATE NOT NULL,
    `inicio_em` DATETIME(3) NOT NULL,
    `fim_em` DATETIME(3) NOT NULL,
    `horas` DECIMAL(6, 2) NULL,
    `custo_calculado` DECIMAL(12, 2) NULL,
    `observacao` VARCHAR(500) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `apontamento_producao_agenda_fabrica_id_idx`(`agenda_fabrica_id`),
    INDEX `apontamento_producao_venda_id_idx`(`venda_id`),
    INDEX `apontamento_producao_funcionario_id_idx`(`funcionario_id`),
    INDEX `apontamento_producao_data_idx`(`data`),
    INDEX `apontamento_producao_categoria_idx`(`categoria`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `apontamento_producao` ADD CONSTRAINT `apontamento_producao_agenda_fabrica_id_fkey` FOREIGN KEY (`agenda_fabrica_id`) REFERENCES `agenda_fabrica`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `apontamento_producao` ADD CONSTRAINT `apontamento_producao_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `apontamento_producao` ADD CONSTRAINT `apontamento_producao_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
