-- CreateTable
CREATE TABLE `vendas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `orcamento_id` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,
    `data_venda` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacao` VARCHAR(191) NULL,
    `forma_pagamento_chave` VARCHAR(191) NULL,
    `valor_bruto` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `taxa_pagamento_percentual_aplicado` DECIMAL(5, 2) NULL,
    `valor_taxa_pagamento` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `taxa_nota_fiscal_percentual_aplicado` DECIMAL(5, 2) NULL,
    `valor_nota_fiscal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `valor_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `vendas_cliente_id_idx`(`cliente_id`),
    INDEX `vendas_orcamento_id_idx`(`orcamento_id`),
    INDEX `vendas_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendas_itens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `venda_id` INTEGER NOT NULL,
    `nome_ambiente` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    `valor_unitario` DECIMAL(10, 2) NOT NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vendas_itens_venda_id_idx`(`venda_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendas_comissoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `venda_id` INTEGER NOT NULL,
    `tipo_comissao_chave` VARCHAR(191) NOT NULL,
    `percentual_aplicado` DECIMAL(5, 2) NOT NULL,
    `valor_comissao` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `responsavel_nome` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vendas_comissoes_venda_id_idx`(`venda_id`),
    INDEX `vendas_comissoes_tipo_comissao_chave_idx`(`tipo_comissao_chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas_itens` ADD CONSTRAINT `vendas_itens_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas_comissoes` ADD CONSTRAINT `vendas_comissoes_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
