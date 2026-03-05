-- CreateTable
CREATE TABLE `auditoria_permissoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id_alterado` INTEGER NOT NULL,
    `alterado_por_usuario_id` INTEGER NOT NULL,
    `alterado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `auditoria_permissoes_usuario_id_alterado_idx`(`usuario_id_alterado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
