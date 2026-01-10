-- CreateTable
CREATE TABLE `permissoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chave` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `permissoes_chave_key`(`chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios_permissoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `permissao_id` INTEGER NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `usuarios_permissoes_usuario_id_idx`(`usuario_id`),
    INDEX `usuarios_permissoes_permissao_id_idx`(`permissao_id`),
    UNIQUE INDEX `usuarios_permissoes_usuario_id_permissao_id_key`(`usuario_id`, `permissao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios_permissoes` ADD CONSTRAINT `usuarios_permissoes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_permissoes` ADD CONSTRAINT `usuarios_permissoes_permissao_id_fkey` FOREIGN KEY (`permissao_id`) REFERENCES `permissoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
