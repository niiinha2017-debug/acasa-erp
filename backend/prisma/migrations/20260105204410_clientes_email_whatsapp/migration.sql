-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `indicacao_id` INTEGER NULL,
    `nome_completo` VARCHAR(191) NOT NULL,
    `razao_social` VARCHAR(191) NULL,
    `data_nascimento` DATETIME(3) NOT NULL,
    `cpf` VARCHAR(191) NULL,
    `rg` VARCHAR(191) NULL,
    `cnpj` VARCHAR(191) NULL,
    `ie` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `cep` VARCHAR(191) NULL,
    `endereco` VARCHAR(191) NULL,
    `numero` VARCHAR(191) NULL,
    `bairro` VARCHAR(191) NULL,
    `cidade` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `clientes_indicacao_id_idx`(`indicacao_id`),
    UNIQUE INDEX `clientes_cpf_key`(`cpf`),
    UNIQUE INDEX `clientes_cnpj_key`(`cnpj`),
    UNIQUE INDEX `clientes_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_indicacao_id_fkey` FOREIGN KEY (`indicacao_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
