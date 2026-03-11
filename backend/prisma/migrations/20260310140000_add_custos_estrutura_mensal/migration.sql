-- CreateTable
CREATE TABLE `custos_estrutura_mensal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mes` INTEGER NOT NULL,
    `ano` INTEGER NOT NULL,
    `custo_ocupacao` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `custo_operacional` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `custo_manutencao_depreciacao` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `horas_uteis_mes` DECIMAL(8, 2) NOT NULL,
    `custo_hora_estrutura` DECIMAL(10, 4) NOT NULL DEFAULT 0,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `custos_estrutura_mensal_mes_ano_key`(`mes`, `ano`),
    INDEX `custos_estrutura_mensal_mes_ano_idx`(`mes`, `ano`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
