-- Migration: 20260327190000_add_automoveis_e_rotas_custo_viagem
-- Cria tabelas de frota (automoveis) e registro de rotas com custo por viagem.

-- ===========================================================================
-- AUTOMÓVEIS / FROTA
-- ===========================================================================
CREATE TABLE `automoveis` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `placa`       VARCHAR(10)   NOT NULL,
  `descricao`   VARCHAR(200)  NOT NULL,
  `marca`       VARCHAR(60)   NULL,
  `modelo`      VARCHAR(80)   NULL,
  `ano`         INT           NULL,
  `cor`         VARCHAR(40)   NULL,
  `renavam`     VARCHAR(20)   NULL,
  `chassi`      VARCHAR(30)   NULL,
  `combustivel` VARCHAR(30)   NULL,
  `custo_km`    DECIMAL(10,4) NULL,
  `observacoes` TEXT          NULL,
  `status`      VARCHAR(20)   NOT NULL DEFAULT 'ATIVO',
  `criado_em`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `automoveis_placa_key` (`placa`),
  INDEX `automoveis_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ===========================================================================
-- ROTAS / CUSTO DE VIAGEM
-- ===========================================================================
CREATE TABLE `rotas_custo_viagem` (
  `id`                  INT           NOT NULL AUTO_INCREMENT,
  `agenda_loja_id`      INT           NOT NULL,
  `funcionario_id`      INT           NOT NULL,
  `automovel_id`        INT           NULL,
  `cliente_id`          INT           NULL,
  `km_ida`              DECIMAL(10,2) NULL,
  `km_volta`            DECIMAL(10,2) NULL,
  `km_total`            DECIMAL(10,2) NULL,
  `custo_km_utilizado`  DECIMAL(10,4) NULL,
  `custo_total`         DECIMAL(12,2) NULL,
  `endereco_destino`    VARCHAR(400)  NULL,
  `origem_registro`     VARCHAR(20)   NOT NULL DEFAULT 'MANUAL',
  `observacoes`         TEXT          NULL,
  `registrado_em`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em`       DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `rotas_custo_viagem_agenda_loja_id_idx`  (`agenda_loja_id`),
  INDEX `rotas_custo_viagem_funcionario_id_idx`  (`funcionario_id`),
  INDEX `rotas_custo_viagem_automovel_id_idx`    (`automovel_id`),
  INDEX `rotas_custo_viagem_cliente_id_idx`      (`cliente_id`),
  INDEX `rotas_custo_viagem_registrado_em_idx`   (`registrado_em`),
  CONSTRAINT `rotas_custo_viagem_agenda_loja_id_fkey`
    FOREIGN KEY (`agenda_loja_id`) REFERENCES `agenda_loja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `rotas_custo_viagem_funcionario_id_fkey`
    FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `rotas_custo_viagem_automovel_id_fkey`
    FOREIGN KEY (`automovel_id`) REFERENCES `automoveis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rotas_custo_viagem_cliente_id_fkey`
    FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
