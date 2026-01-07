/*
  Warnings:

  - You are about to drop the `formas_pagamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `status_financeiro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tipos_despesa` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `formas_pagamento`;

-- DropTable
DROP TABLE `status_financeiro`;

-- DropTable
DROP TABLE `tipos_despesa`;

-- CreateTable
CREATE TABLE `constantes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoria` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(191) NOT NULL,
    `rotulo` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `valor_texto` VARCHAR(191) NULL,
    `valor_numero` DECIMAL(12, 2) NULL,
    `valor_booleano` BOOLEAN NULL,
    `valor_json` JSON NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `constantes_categoria_ativo_ordem_idx`(`categoria`, `ativo`, `ordem`),
    UNIQUE INDEX `constantes_categoria_chave_key`(`categoria`, `chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
