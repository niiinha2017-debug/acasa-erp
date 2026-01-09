-- CreateTable
CREATE TABLE `contas_pagar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fornecedor_id` INTEGER NOT NULL,
    `fornecedor_cobrador_id` INTEGER NULL,
    `origem_tipo` VARCHAR(191) NULL,
    `origem_id` INTEGER NULL,
    `descricao` VARCHAR(191) NULL,
    `observacao` VARCHAR(191) NULL,
    `valor_original` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `valor_compensado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(191) NOT NULL,
    `forma_pagamento_chave` VARCHAR(191) NULL,
    `parcelas_total` INTEGER NULL,
    `parcela_numero` INTEGER NULL,
    `vencimento_em` DATETIME(3) NOT NULL,
    `pago_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `contas_pagar_fornecedor_id_idx`(`fornecedor_id`),
    INDEX `contas_pagar_fornecedor_cobrador_id_idx`(`fornecedor_cobrador_id`),
    INDEX `contas_pagar_status_idx`(`status`),
    INDEX `contas_pagar_vencimento_em_idx`(`vencimento_em`),
    INDEX `contas_pagar_origem_tipo_idx`(`origem_tipo`),
    INDEX `contas_pagar_origem_id_idx`(`origem_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contas_receber` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fornecedor_id` INTEGER NOT NULL,
    `origem_tipo` VARCHAR(191) NULL,
    `origem_id` INTEGER NULL,
    `descricao` VARCHAR(191) NULL,
    `observacao` VARCHAR(191) NULL,
    `valor_original` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `valor_compensado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(191) NOT NULL,
    `forma_recebimento_chave` VARCHAR(191) NULL,
    `vencimento_em` DATETIME(3) NULL,
    `recebido_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `contas_receber_fornecedor_id_idx`(`fornecedor_id`),
    INDEX `contas_receber_status_idx`(`status`),
    INDEX `contas_receber_vencimento_em_idx`(`vencimento_em`),
    INDEX `contas_receber_origem_tipo_idx`(`origem_tipo`),
    INDEX `contas_receber_origem_id_idx`(`origem_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fornecedor_compensacoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fornecedor_id` INTEGER NOT NULL,
    `conta_pagar_id` INTEGER NOT NULL,
    `conta_receber_id` INTEGER NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `data_compensacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacao` VARCHAR(191) NULL,

    INDEX `fornecedor_compensacoes_fornecedor_id_idx`(`fornecedor_id`),
    INDEX `fornecedor_compensacoes_conta_pagar_id_idx`(`conta_pagar_id`),
    INDEX `fornecedor_compensacoes_conta_receber_id_idx`(`conta_receber_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_fornecedor_cobrador_id_fkey` FOREIGN KEY (`fornecedor_cobrador_id`) REFERENCES `fornecedores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_receber` ADD CONSTRAINT `contas_receber_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fornecedor_compensacoes` ADD CONSTRAINT `fornecedor_compensacoes_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fornecedor_compensacoes` ADD CONSTRAINT `fornecedor_compensacoes_conta_pagar_id_fkey` FOREIGN KEY (`conta_pagar_id`) REFERENCES `contas_pagar`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fornecedor_compensacoes` ADD CONSTRAINT `fornecedor_compensacoes_conta_receber_id_fkey` FOREIGN KEY (`conta_receber_id`) REFERENCES `contas_receber`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
