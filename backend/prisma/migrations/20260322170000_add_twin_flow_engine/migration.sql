CREATE TABLE `fluxo_entidade` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `contexto` VARCHAR(191) NOT NULL,
  `cliente_id` INTEGER NULL,
  `venda_id` INTEGER NULL,
  `orcamento_id` INTEGER NULL,
  `disparado_por_fluxo_id` INTEGER NULL,
  `status` VARCHAR(191) NOT NULL,
  `subetapa` VARCHAR(191) NOT NULL,
  `macroetapa` VARCHAR(191) NULL,
  `execucao_etapa` VARCHAR(191) NULL,
  `label_etapa` VARCHAR(191) NULL,
  `ordem_etapa` INTEGER NULL,
  `terminal` BOOLEAN NOT NULL DEFAULT false,
  `origem_evento` VARCHAR(191) NULL,
  `ultimo_agendamento_tipo` VARCHAR(191) NULL,
  `ultimo_agendamento_id` INTEGER NULL,
  `ultimo_snapshot` JSON NULL,
  `iniciado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `concluido_em` DATETIME(3) NULL,
  `cancelado_em` DATETIME(3) NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `fluxo_entidade_contexto_venda_id_key`(`contexto`, `venda_id`),
  UNIQUE INDEX `fluxo_entidade_contexto_orcamento_id_key`(`contexto`, `orcamento_id`),
  INDEX `fluxo_entidade_contexto_idx`(`contexto`),
  INDEX `fluxo_entidade_cliente_id_idx`(`cliente_id`),
  INDEX `fluxo_entidade_venda_id_idx`(`venda_id`),
  INDEX `fluxo_entidade_orcamento_id_idx`(`orcamento_id`),
  INDEX `fluxo_entidade_subetapa_idx`(`subetapa`),
  INDEX `fluxo_entidade_status_idx`(`status`),
  INDEX `fluxo_entidade_disparado_por_fluxo_id_idx`(`disparado_por_fluxo_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `fluxo_entidade_historico` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `fluxo_entidade_id` INTEGER NOT NULL,
  `contexto` VARCHAR(191) NOT NULL,
  `status_anterior` VARCHAR(191) NULL,
  `subetapa_anterior` VARCHAR(191) NULL,
  `execucao_anterior` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL,
  `subetapa` VARCHAR(191) NOT NULL,
  `macroetapa` VARCHAR(191) NULL,
  `execucao_etapa` VARCHAR(191) NULL,
  `label_etapa` VARCHAR(191) NULL,
  `ordem_etapa` INTEGER NULL,
  `origem_evento` VARCHAR(191) NULL,
  `motivo` VARCHAR(191) NULL,
  `agenda_tipo` VARCHAR(191) NULL,
  `agenda_id` INTEGER NULL,
  `payload` JSON NULL,
  `criado_por_usuario_id` INTEGER NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `fluxo_entidade_historico_fluxo_entidade_id_idx`(`fluxo_entidade_id`),
  INDEX `fluxo_entidade_historico_contexto_idx`(`contexto`),
  INDEX `fluxo_entidade_historico_agenda_tipo_agenda_id_idx`(`agenda_tipo`, `agenda_id`),
  INDEX `fluxo_entidade_historico_criado_por_usuario_id_idx`(`criado_por_usuario_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `fluxo_entidade_agendamento` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `fluxo_entidade_id` INTEGER NOT NULL,
  `contexto` VARCHAR(191) NOT NULL,
  `agenda_tipo` VARCHAR(191) NOT NULL,
  `agenda_id` INTEGER NOT NULL,
  `titulo` VARCHAR(191) NULL,
  `inicio_em` DATETIME(3) NULL,
  `fim_em` DATETIME(3) NULL,
  `status` VARCHAR(191) NULL,
  `subetapa` VARCHAR(191) NULL,
  `execucao_etapa` VARCHAR(191) NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `fluxo_entidade_agendamento_agenda_tipo_agenda_id_key`(`agenda_tipo`, `agenda_id`),
  INDEX `fluxo_entidade_agendamento_fluxo_entidade_id_idx`(`fluxo_entidade_id`),
  INDEX `fluxo_entidade_agendamento_contexto_idx`(`contexto`),
  INDEX `fluxo_entidade_agendamento_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `fluxo_entidade`
  ADD CONSTRAINT `fluxo_entidade_cliente_id_fkey`
    FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fluxo_entidade_venda_id_fkey`
    FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fluxo_entidade_orcamento_id_fkey`
    FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fluxo_entidade_disparado_por_fluxo_id_fkey`
    FOREIGN KEY (`disparado_por_fluxo_id`) REFERENCES `fluxo_entidade`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `fluxo_entidade_historico`
  ADD CONSTRAINT `fluxo_entidade_historico_fluxo_entidade_id_fkey`
    FOREIGN KEY (`fluxo_entidade_id`) REFERENCES `fluxo_entidade`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `fluxo_entidade_agendamento`
  ADD CONSTRAINT `fluxo_entidade_agendamento_fluxo_entidade_id_fkey`
    FOREIGN KEY (`fluxo_entidade_id`) REFERENCES `fluxo_entidade`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;