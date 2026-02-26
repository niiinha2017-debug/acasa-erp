-- Split agenda_global into agenda_loja and agenda_fabrica (with data migration)

-- 1) Create new tables
CREATE TABLE `agenda_loja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NULL,
    `fornecedor_id` INTEGER NULL,
    `orcamento_id` INTEGER NULL,
    `venda_id` INTEGER NULL,
    `projeto_id` INTEGER NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `inicio_em` DATETIME(3) NOT NULL,
    `fim_em` DATETIME(3) NOT NULL,
    `categoria` VARCHAR(191) NULL,
    `origem_fluxo` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `status_source` VARCHAR(191) NULL,
    `status_aplicado_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agenda_loja_orcamento_id_key`(`orcamento_id`),
    INDEX `agenda_loja_cliente_id_idx`(`cliente_id`),
    INDEX `agenda_loja_fornecedor_id_idx`(`fornecedor_id`),
    INDEX `agenda_loja_venda_id_idx`(`venda_id`),
    INDEX `agenda_loja_inicio_em_idx`(`inicio_em`),
    INDEX `agenda_loja_categoria_idx`(`categoria`),
    INDEX `agenda_loja_origem_fluxo_idx`(`origem_fluxo`),
    INDEX `agenda_loja_status_idx`(`status`),
    INDEX `agenda_loja_status_source_idx`(`status_source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `agenda_loja_funcionarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agenda_loja_id` INTEGER NOT NULL,
    `funcionario_id` INTEGER NOT NULL,

    INDEX `agenda_loja_funcionarios_agenda_loja_id_idx`(`agenda_loja_id`),
    INDEX `agenda_loja_funcionarios_funcionario_id_idx`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `agenda_loja_apontamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agenda_loja_id` INTEGER NOT NULL,
    `funcionario_id` INTEGER NOT NULL,
    `inicio_em` DATETIME(3) NOT NULL,
    `fim_em` DATETIME(3) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `agenda_loja_apontamentos_agenda_loja_id_idx`(`agenda_loja_id`),
    INDEX `agenda_loja_apontamentos_funcionario_id_idx`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `agenda_fabrica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NULL,
    `fornecedor_id` INTEGER NULL,
    `orcamento_id` INTEGER NULL,
    `venda_id` INTEGER NULL,
    `projeto_id` INTEGER NULL,
    `plano_corte_id` INTEGER NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `inicio_em` DATETIME(3) NOT NULL,
    `fim_em` DATETIME(3) NOT NULL,
    `categoria` VARCHAR(191) NULL,
    `origem_fluxo` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `status_source` VARCHAR(191) NULL,
    `status_aplicado_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agenda_fabrica_orcamento_id_key`(`orcamento_id`),
    UNIQUE INDEX `agenda_fabrica_plano_corte_id_key`(`plano_corte_id`),
    INDEX `agenda_fabrica_cliente_id_idx`(`cliente_id`),
    INDEX `agenda_fabrica_fornecedor_id_idx`(`fornecedor_id`),
    INDEX `agenda_fabrica_venda_id_idx`(`venda_id`),
    INDEX `agenda_fabrica_plano_corte_id_idx`(`plano_corte_id`),
    INDEX `agenda_fabrica_inicio_em_idx`(`inicio_em`),
    INDEX `agenda_fabrica_categoria_idx`(`categoria`),
    INDEX `agenda_fabrica_origem_fluxo_idx`(`origem_fluxo`),
    INDEX `agenda_fabrica_status_idx`(`status`),
    INDEX `agenda_fabrica_status_source_idx`(`status_source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `agenda_fabrica_funcionarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agenda_fabrica_id` INTEGER NOT NULL,
    `funcionario_id` INTEGER NOT NULL,

    INDEX `agenda_fabrica_funcionarios_agenda_fabrica_id_idx`(`agenda_fabrica_id`),
    INDEX `agenda_fabrica_funcionarios_funcionario_id_idx`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `agenda_fabrica_apontamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agenda_fabrica_id` INTEGER NOT NULL,
    `funcionario_id` INTEGER NOT NULL,
    `inicio_em` DATETIME(3) NOT NULL,
    `fim_em` DATETIME(3) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `agenda_fabrica_apontamentos_agenda_fabrica_id_idx`(`agenda_fabrica_id`),
    INDEX `agenda_fabrica_apontamentos_funcionario_id_idx`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2) Migrate data: LOJA -> agenda_loja (preserve id for junction mapping)
INSERT INTO `agenda_loja` (
    `id`, `cliente_id`, `fornecedor_id`, `orcamento_id`, `venda_id`, `projeto_id`,
    `titulo`, `inicio_em`, `fim_em`, `categoria`, `origem_fluxo`, `status`, `status_source`, `status_aplicado_em`, `criado_em`, `atualizado_em`
)
SELECT
    `id`, `cliente_id`, `fornecedor_id`, `orcamento_id`, `venda_id`, `projeto_id`,
    `titulo`, `inicio_em`, `fim_em`, `categoria`, `origem_fluxo`, `status`, `status_source`, `status_aplicado_em`, `criado_em`, `atualizado_em`
FROM `agenda_global`
WHERE COALESCE(NULLIF(TRIM(`setor_destino`), ''), 'LOJA') = 'LOJA';

-- FABRICA/PRODUCAO -> agenda_fabrica (add temp column for mapping)
ALTER TABLE `agenda_fabrica` ADD COLUMN `_mig_old_id` INTEGER NULL UNIQUE;

INSERT INTO `agenda_fabrica` (
    `cliente_id`, `fornecedor_id`, `orcamento_id`, `venda_id`, `projeto_id`, `plano_corte_id`,
    `titulo`, `inicio_em`, `fim_em`, `categoria`, `origem_fluxo`, `status`, `status_source`, `status_aplicado_em`, `criado_em`, `atualizado_em`, `_mig_old_id`
)
SELECT
    `cliente_id`, `fornecedor_id`, `orcamento_id`, `venda_id`, `projeto_id`, `plano_corte_id`,
    `titulo`, `inicio_em`, `fim_em`, `categoria`, `origem_fluxo`, `status`, `status_source`, `status_aplicado_em`, `criado_em`, `atualizado_em`, `id`
FROM `agenda_global`
WHERE `setor_destino` IN ('FABRICA', 'PRODUCAO');

-- Junction: agenda_loja_funcionarios
INSERT INTO `agenda_loja_funcionarios` (`agenda_loja_id`, `funcionario_id`)
SELECT af.`agenda_id`, af.`funcionario_id`
FROM `agenda_funcionarios` af
INNER JOIN `agenda_global` ag ON ag.`id` = af.`agenda_id`
WHERE COALESCE(NULLIF(TRIM(ag.`setor_destino`), ''), 'LOJA') = 'LOJA';

-- Junction: agenda_fabrica_funcionarios
INSERT INTO `agenda_fabrica_funcionarios` (`agenda_fabrica_id`, `funcionario_id`)
SELECT ab.`id`, af.`funcionario_id`
FROM `agenda_funcionarios` af
INNER JOIN `agenda_fabrica` ab ON ab.`_mig_old_id` = af.`agenda_id`;

-- Apontamentos loja
INSERT INTO `agenda_loja_apontamentos` (`agenda_loja_id`, `funcionario_id`, `inicio_em`, `fim_em`, `criado_em`)
SELECT aa.`agenda_id`, aa.`funcionario_id`, aa.`inicio_em`, aa.`fim_em`, aa.`criado_em`
FROM `agenda_apontamentos` aa
INNER JOIN `agenda_global` ag ON ag.`id` = aa.`agenda_id`
WHERE COALESCE(NULLIF(TRIM(ag.`setor_destino`), ''), 'LOJA') = 'LOJA';

-- Apontamentos fabrica
INSERT INTO `agenda_fabrica_apontamentos` (`agenda_fabrica_id`, `funcionario_id`, `inicio_em`, `fim_em`, `criado_em`)
SELECT ab.`id`, aa.`funcionario_id`, aa.`inicio_em`, aa.`fim_em`, aa.`criado_em`
FROM `agenda_apontamentos` aa
INNER JOIN `agenda_fabrica` ab ON ab.`_mig_old_id` = aa.`agenda_id`;

-- Remove temp column
ALTER TABLE `agenda_fabrica` DROP COLUMN `_mig_old_id`;

-- 3) Drop old tables (drop FK first)
ALTER TABLE `agenda_apontamentos` DROP FOREIGN KEY `agenda_apontamentos_agenda_id_fkey`;
ALTER TABLE `agenda_apontamentos` DROP FOREIGN KEY `agenda_apontamentos_funcionario_id_fkey`;
ALTER TABLE `agenda_funcionarios` DROP FOREIGN KEY `agenda_funcionarios_agenda_id_fkey`;
ALTER TABLE `agenda_funcionarios` DROP FOREIGN KEY `agenda_funcionarios_funcionario_id_fkey`;

DROP TABLE `agenda_apontamentos`;
DROP TABLE `agenda_funcionarios`;
DROP TABLE `agenda_global`;

-- 4) Add foreign keys for new tables
ALTER TABLE `agenda_loja` ADD CONSTRAINT `agenda_loja_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agenda_loja` ADD CONSTRAINT `agenda_loja_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agenda_loja` ADD CONSTRAINT `agenda_loja_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agenda_loja` ADD CONSTRAINT `agenda_loja_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agenda_loja` ADD CONSTRAINT `agenda_loja_projeto_id_fkey` FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `agenda_loja_funcionarios` ADD CONSTRAINT `agenda_loja_funcionarios_agenda_loja_id_fkey` FOREIGN KEY (`agenda_loja_id`) REFERENCES `agenda_loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `agenda_loja_funcionarios` ADD CONSTRAINT `agenda_loja_funcionarios_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `agenda_loja_apontamentos` ADD CONSTRAINT `agenda_loja_apontamentos_agenda_loja_id_fkey` FOREIGN KEY (`agenda_loja_id`) REFERENCES `agenda_loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `agenda_loja_apontamentos` ADD CONSTRAINT `agenda_loja_apontamentos_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `agenda_fabrica` ADD CONSTRAINT `agenda_fabrica_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agenda_fabrica` ADD CONSTRAINT `agenda_fabrica_fornecedor_id_fkey` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agenda_fabrica` ADD CONSTRAINT `agenda_fabrica_orcamento_id_fkey` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agenda_fabrica` ADD CONSTRAINT `agenda_fabrica_venda_id_fkey` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agenda_fabrica` ADD CONSTRAINT `agenda_fabrica_projeto_id_fkey` FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agenda_fabrica` ADD CONSTRAINT `agenda_fabrica_plano_corte_id_fkey` FOREIGN KEY (`plano_corte_id`) REFERENCES `plano_corte`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `agenda_fabrica_funcionarios` ADD CONSTRAINT `agenda_fabrica_funcionarios_agenda_fabrica_id_fkey` FOREIGN KEY (`agenda_fabrica_id`) REFERENCES `agenda_fabrica`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `agenda_fabrica_funcionarios` ADD CONSTRAINT `agenda_fabrica_funcionarios_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `agenda_fabrica_apontamentos` ADD CONSTRAINT `agenda_fabrica_apontamentos_agenda_fabrica_id_fkey` FOREIGN KEY (`agenda_fabrica_id`) REFERENCES `agenda_fabrica`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `agenda_fabrica_apontamentos` ADD CONSTRAINT `agenda_fabrica_apontamentos_funcionario_id_fkey` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
