/*
  Warnings:

  - You are about to drop the column `forma_pagamento_chave` on the `vendas` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `contas_receber` DROP FOREIGN KEY `contas_receber_fornecedor_id_fkey`;

-- AlterTable
ALTER TABLE `contas_receber` ADD COLUMN `cliente_id` INTEGER NULL,
    MODIFY `fornecedor_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `vendas` DROP COLUMN `forma_pagamento_chave`,
    ADD COLUMN `data_entrega` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `vendas_pagamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `venda_id` INTEGER NOT NULL,
    `forma_pagamento_chave` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `data_prevista_recebimento` DATETIME(3) NULL,
    `data_recebimento` DATETIME(3) NULL,
    `status_financeiro_chave` VARCHAR(191) NOT NULL DEFAULT 'EM_ABERTO',
    `observacao` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `vendas_pagamentos_venda_id_idx`(`venda_id`),
    INDEX `vendas_pagamentos_forma_pagamento_chave_idx`(`forma_pagamento_chave`),
    INDEX `vendas_pagamentos_status_financeiro_chave_idx`(`status_financeiro_chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendas_arquivos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `venda_id` INTEGER NOT NULL,
    `nome_original` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `tamanho` INTEGER NOT NULL,
    `caminho` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vendas_arquivos_venda_id_idx`(`venda_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `contas_receber_cliente_id_idx` ON `contas_receber`(`cliente_id`);

-- AddForeignKey
ALTER TABLE `vendas_pagamentos` ADD CONSTRAINT `vendas_pagamentos_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas_arquivos` ADD CONSTRAINT `vendas_arquivos_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_receber` ADD CONSTRAINT `contas_receber_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_receber` ADD CONSTRAINT `contas_receber_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
