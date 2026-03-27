-- CreateTable
CREATE TABLE `ordem_servico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `data_entrega_prevista` DATETIME(3) NOT NULL,
    `origem` VARCHAR(64) NOT NULL DEFAULT 'IMPORTACAO_LEITURA',
    `observacao` VARCHAR(500) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `producao_etapas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ordem_servico_id` INTEGER NOT NULL,
    `nome_ambiente` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(64) NOT NULL DEFAULT 'PENDENTE',
    `observacao` TEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ordem_servico_cliente_id_idx` ON `ordem_servico`(`cliente_id`);

-- CreateIndex
CREATE INDEX `producao_etapas_ordem_servico_id_idx` ON `producao_etapas`(`ordem_servico_id`);

-- AddForeignKey
ALTER TABLE `ordem_servico` ADD CONSTRAINT `ordem_servico_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producao_etapas` ADD CONSTRAINT `producao_etapas_ordem_servico_id_fkey` FOREIGN KEY (`ordem_servico_id`) REFERENCES `ordem_servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
