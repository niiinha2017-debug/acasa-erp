-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `usuario` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `setor` VARCHAR(191) NOT NULL,
    `funcao` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_usuario_key`(`usuario`),
    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recuperacao_senha` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha_antiga` VARCHAR(191) NULL,
    `senha_nova` VARCHAR(191) NULL,
    `token` VARCHAR(191) NULL,
    `utilizado` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recuperacao_senha` ADD CONSTRAINT `recuperacao_senha_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
