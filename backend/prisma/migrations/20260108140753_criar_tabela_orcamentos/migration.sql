-- CreateTable
CREATE TABLE `orcamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `cliente_nome_snapshot` VARCHAR(191) NOT NULL,
    `cliente_cpf_snapshot` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `orcamentos_cliente_id_idx`(`cliente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamento_itens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orcamento_id` INTEGER NOT NULL,
    `nome_ambiente` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `valor_unitario` DECIMAL(10, 2) NOT NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamento_arquivos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orcamento_id` INTEGER NOT NULL,
    `nome_original` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `tamanho` INTEGER NOT NULL,
    `caminho` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orcamentos` ADD CONSTRAINT `orcamentos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento_itens` ADD CONSTRAINT `orcamento_itens_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento_arquivos` ADD CONSTRAINT `orcamento_arquivos_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
