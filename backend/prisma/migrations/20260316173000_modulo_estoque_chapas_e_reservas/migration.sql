-- Estoque: tabela de chapas inteiras vinculadas ao cadastro de produtos
CREATE TABLE `estoque_chapa_inteira` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `produto_id` INTEGER NOT NULL,
    `origem_entrada` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `numero_nf` VARCHAR(80) NULL,
    `fornecedor_nome` VARCHAR(180) NULL,
    `lote` VARCHAR(120) NULL,
    `quantidade_total` INTEGER NOT NULL,
    `quantidade_disponivel` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DISPONIVEL',
    `reservado_para_tipo` VARCHAR(191) NULL,
    `reservado_para_id` INTEGER NULL,
    `reservado_para_ref` VARCHAR(191) NULL,
    `reservado_em` DATETIME(3) NULL,
    `observacao` VARCHAR(800) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `estoque_chapa_inteira_produto_id_idx`(`produto_id`),
    INDEX `estoque_chapa_inteira_status_idx`(`status`),
    INDEX `estoque_chapa_inteira_origem_entrada_idx`(`origem_entrada`),
    INDEX `estoque_chapa_inteira_numero_nf_idx`(`numero_nf`),
    INDEX `estoque_chapa_inteira_reservado_para_tipo_reservado_para_id_idx`(`reservado_para_tipo`, `reservado_para_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `estoque_chapa_inteira`
  ADD CONSTRAINT `estoque_chapa_inteira_produto_id_fkey`
  FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Estoque: metadados de reserva em retalhos para vínculo com projeto/venda
ALTER TABLE `estoque_retalho` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'DISPONIVEL';
ALTER TABLE `estoque_retalho` ADD COLUMN `reservado_para_tipo` VARCHAR(191) NULL;
ALTER TABLE `estoque_retalho` ADD COLUMN `reservado_para_id` INTEGER NULL;
ALTER TABLE `estoque_retalho` ADD COLUMN `reservado_para_ref` VARCHAR(191) NULL;
ALTER TABLE `estoque_retalho` ADD COLUMN `reservado_em` DATETIME(3) NULL;
ALTER TABLE `estoque_retalho` ADD COLUMN `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE INDEX `estoque_retalho_status_idx` ON `estoque_retalho`(`status`);
CREATE INDEX `estoque_retalho_reservado_para_tipo_reservado_para_id_idx` ON `estoque_retalho`(`reservado_para_tipo`, `reservado_para_id`);
