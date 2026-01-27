-- AlterTable
ALTER TABLE `despesas` ADD COLUMN `cartao_credito_id` INTEGER NULL,
    ADD COLUMN `conta_bancaria_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `contas_bancarias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ATIVO',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contas_bancarias_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cartoes_credito` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ATIVO',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cartoes_credito_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `despesas_conta_bancaria_id_idx` ON `despesas`(`conta_bancaria_id`);

-- CreateIndex
CREATE INDEX `despesas_cartao_credito_id_idx` ON `despesas`(`cartao_credito_id`);

-- AddForeignKey
ALTER TABLE `despesas` ADD CONSTRAINT `despesas_conta_bancaria_id_fkey` FOREIGN KEY (`conta_bancaria_id`) REFERENCES `contas_bancarias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `despesas` ADD CONSTRAINT `despesas_cartao_credito_id_fkey` FOREIGN KEY (`cartao_credito_id`) REFERENCES `cartoes_credito`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
