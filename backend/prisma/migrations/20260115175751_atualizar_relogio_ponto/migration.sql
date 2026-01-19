-- CreateTable
CREATE TABLE `ponto_dispositivos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `funcionario_id` INTEGER NOT NULL,
    `device_uuid` VARCHAR(80) NOT NULL,
    `device_nome` VARCHAR(120) NULL,
    `plataforma` VARCHAR(20) NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    `ultimo_uso_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `ponto_dispositivos_funcionario_id_idx`(`funcionario_id`),
    INDEX `ponto_dispositivos_status_idx`(`status`),
    UNIQUE INDEX `ponto_dispositivos_device_uuid_key`(`device_uuid`),
    UNIQUE INDEX `ponto_dispositivos_token_hash_key`(`token_hash`),
    UNIQUE INDEX `ponto_dispositivos_funcionario_id_device_uuid_key`(`funcionario_id`, `device_uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ponto_registros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `funcionario_id` INTEGER NOT NULL,
    `dispositivo_id` INTEGER NULL,
    `tipo` ENUM('ENTRADA', 'SAIDA') NOT NULL,
    `origem` ENUM('PWA', 'WEB', 'ADMIN') NOT NULL DEFAULT 'PWA',
    `data_hora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `precisao_metros` INTEGER NULL,
    `ip` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    `observacao` VARCHAR(255) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ponto_registros_funcionario_id_data_hora_idx`(`funcionario_id`, `data_hora`),
    INDEX `ponto_registros_data_hora_idx`(`data_hora`),
    INDEX `ponto_registros_tipo_idx`(`tipo`),
    INDEX `ponto_registros_dispositivo_id_idx`(`dispositivo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ponto_dispositivos` ADD CONSTRAINT `ponto_dispositivos_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ponto_registros` ADD CONSTRAINT `ponto_registros_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ponto_registros` ADD CONSTRAINT `ponto_registros_dispositivo_id_fkey` FOREIGN KEY (`dispositivo_id`) REFERENCES `ponto_dispositivos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
