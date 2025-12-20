[dotenv@17.2.3] injecting env (8) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
-- CreateTable
CREATE TABLE `agenda_producao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plano_corte_id` INTEGER NOT NULL,
    `fornecedor_id` INTEGER NOT NULL,
    `descricao` TEXT NOT NULL,
    `data_inicio` DATE NULL,
    `data_fim_prevista` DATE NULL,
    `status` ENUM('Planejado', 'Em Producao', 'Finalizado') NULL DEFAULT 'Planejado',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fornecedor_id`(`fornecedor_id`),
    INDEX `plano_corte_id`(`plano_corte_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ambientes_venda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `venda_id` INTEGER NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,

    INDEX `pedido_id`(`venda_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `apontamento_producao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `funcionario_id` INTEGER NOT NULL,
    `tarefa_id` INTEGER NOT NULL,
    `horas_trabalhadas` DECIMAL(5, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `funcionario_id`(`funcionario_id`),
    INDEX `tarefa_id`(`tarefa_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `indicacao` VARCHAR(150) NULL,
    `email` VARCHAR(150) NULL,
    `telefone` VARCHAR(20) NULL,
    `cep` VARCHAR(10) NULL,
    `endereco` TEXT NULL,
    `numero` VARCHAR(20) NULL,
    `complemento` VARCHAR(100) NULL,
    `bairro` VARCHAR(100) NULL,
    `cidade` VARCHAR(100) NULL,
    `estado` VARCHAR(2) NULL,
    `cpf_cnpj` VARCHAR(20) NULL,
    `rg_ie` VARCHAR(30) NULL,
    `observacao` TEXT NULL,
    `status` VARCHAR(20) NULL DEFAULT 'Ativo',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `cpf_cnpj`(`cpf_cnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fornecedor_id` INTEGER NOT NULL,
    `cliente_id` INTEGER NULL,
    `data_compra` DATE NOT NULL,
    `data_emissao_nf` DATE NULL,
    `numero_nf` VARCHAR(50) NULL,
    `valor_total_produtos` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `valor_frete` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `valor_outros` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `valor_final` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(20) NULL DEFAULT 'Pendente',
    `observacao` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `venda_id` INTEGER NULL,

    INDEX `cliente_id`(`cliente_id`),
    INDEX `fk_compras_venda`(`venda_id`),
    INDEX `fornecedor_id`(`fornecedor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `constantes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `grupo` VARCHAR(50) NOT NULL,
    `codigo` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `valor` VARCHAR(100) NULL,
    `extra` JSON NULL,
    `ativo` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_constante`(`grupo`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consumo_insumos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `insumo_id` INTEGER NOT NULL,
    `origem` ENUM('VendaCliente', 'PlanoCorte') NOT NULL,
    `venda_id` INTEGER NULL,
    `plano_corte_id` INTEGER NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `insumo_id`(`insumo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `despesas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(255) NOT NULL,
    `categoria` VARCHAR(100) NULL,
    `data` DATE NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(20) NULL DEFAULT 'Pendente',
    `forma_pagamento` VARCHAR(50) NULL,
    `centro_custo` VARCHAR(100) NULL,
    `observacao` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `data_vencimento` DATE NULL,
    `data_pagamento` DATE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entrada_insumos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `insumo_id` INTEGER NOT NULL,
    `compra_id` INTEGER NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `valor_unitario` DECIMAL(10, 2) NOT NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `compra_id`(`compra_id`),
    INDEX `insumo_id`(`insumo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estoque_sobras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `produto_pai_id` INTEGER NOT NULL,
    `comprimento` DECIMAL(10, 2) NULL,
    `largura` DECIMAL(10, 2) NULL,
    `espessura` DECIMAL(10, 2) NULL,
    `quantidade` INTEGER NULL DEFAULT 1,
    `localizacao` VARCHAR(50) NULL,
    `status` VARCHAR(20) NULL DEFAULT 'Disponível',
    `data_entrada` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `produto_pai_id`(`produto_pai_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fornecedores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_fantasia` VARCHAR(150) NOT NULL,
    `razao_social` VARCHAR(150) NULL,
    `cpf_cnpj` VARCHAR(20) NULL,
    `inscricao_estadual` VARCHAR(30) NULL,
    `telefone_loja` VARCHAR(20) NULL,
    `email_loja` VARCHAR(150) NULL,
    `vendedor_nome` VARCHAR(100) NULL,
    `vendedor_contato` VARCHAR(100) NULL,
    `cep` VARCHAR(10) NULL,
    `endereco` VARCHAR(255) NULL,
    `numero` VARCHAR(20) NULL,
    `bairro` VARCHAR(100) NULL,
    `cidade` VARCHAR(100) NULL,
    `estado` VARCHAR(2) NULL,
    `dia_fechamento` INTEGER NULL,
    `dia_vencimento` INTEGER NULL,
    `chave_pix` VARCHAR(100) NULL,
    `dados_bancarios` TEXT NULL,
    `observacao` TEXT NULL,
    `status` VARCHAR(20) NULL DEFAULT 'Ativo',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `cpf_cnpj`(`cpf_cnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funcionarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `nascimento` DATE NULL,
    `sexo` VARCHAR(20) NULL,
    `estado_civil` VARCHAR(30) NULL,
    `escolaridade` VARCHAR(50) NULL,
    `cpf` VARCHAR(20) NOT NULL,
    `rg` VARCHAR(20) NULL,
    `cep` VARCHAR(10) NULL,
    `endereco` VARCHAR(200) NULL,
    `numero` VARCHAR(20) NULL,
    `complemento` VARCHAR(100) NULL,
    `bairro` VARCHAR(100) NULL,
    `cidade` VARCHAR(100) NULL,
    `estado` VARCHAR(2) NULL,
    `email` VARCHAR(150) NULL,
    `telefone` VARCHAR(20) NULL,
    `setor` VARCHAR(50) NULL,
    `funcao` VARCHAR(50) NULL,
    `tipo_contrato` VARCHAR(50) NULL,
    `data_admissao` DATE NULL,
    `data_demissao` DATE NULL,
    `status` VARCHAR(20) NULL DEFAULT 'Ativo',
    `salario_base` DECIMAL(10, 2) NULL,
    `salario_adicional` DECIMAL(10, 2) NULL,
    `carga_horaria` INTEGER NULL,
    `custo_hora` DECIMAL(10, 2) NULL,
    `forma_pagamento` VARCHAR(50) NULL,
    `banco` VARCHAR(50) NULL,
    `agencia` VARCHAR(20) NULL,
    `conta_corrente` VARCHAR(30) NULL,
    `tipo_conta` VARCHAR(30) NULL,
    `chave_pix` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `cpf`(`cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insumos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `unidade` VARCHAR(20) NOT NULL,
    `estoque_atual` DECIMAL(10, 3) NULL DEFAULT 0.000,
    `estoque_minimo` DECIMAL(10, 3) NULL DEFAULT 0.000,
    `custo_medio` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `status` ENUM('Ativo', 'Inativo') NULL DEFAULT 'Ativo',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insumos_plano_corte` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plano_corte_id` INTEGER NOT NULL,
    `produto_id` INTEGER NOT NULL,
    `unidade` VARCHAR(20) NOT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `custo_unitario` DECIMAL(10, 2) NOT NULL,
    `custo_total` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_plano_corte`(`plano_corte_id`),
    INDEX `idx_produto`(`produto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_compra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `compra_id` INTEGER NOT NULL,
    `produto_id` INTEGER NOT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `valor_unitario` DECIMAL(10, 2) NOT NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL,
    `unidade_compra` VARCHAR(20) NULL,

    INDEX `compra_id`(`compra_id`),
    INDEX `produto_id`(`produto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_compra_rateio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_compra_id` INTEGER NOT NULL,
    `ambiente_id` INTEGER NOT NULL,
    `percentual` DECIMAL(5, 2) NULL,
    `valor_alocado` DECIMAL(10, 2) NULL,

    INDEX `ambiente_id`(`ambiente_id`),
    INDEX `item_compra_id`(`item_compra_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_plano_corte` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plano_corte_id` INTEGER NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `cor` VARCHAR(100) NULL,
    `unidade` VARCHAR(20) NOT NULL,
    `quantidade` DECIMAL(10, 3) NOT NULL,
    `valor_unitario` DECIMAL(10, 2) NOT NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL,

    INDEX `plano_corte_id`(`plano_corte_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_venda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `venda_id` INTEGER NOT NULL,
    `ambiente_id` INTEGER NOT NULL,
    `descricao` TEXT NOT NULL,
    `quantidade` DECIMAL(10, 3) NULL DEFAULT 1.000,
    `valor_unitario` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `valor_total` DECIMAL(10, 2) NULL DEFAULT 0.00,

    INDEX `ambiente_id`(`ambiente_id`),
    INDEX `venda_id`(`venda_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lancamentos_financeiros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('Pagar', 'Receber') NOT NULL,
    `origem` ENUM('VendaCliente', 'PlanoCorte', 'Compra', 'Despesa') NULL,
    `descricao` VARCHAR(100) NULL,
    `categoria` VARCHAR(100) NULL,
    `beneficiario` VARCHAR(150) NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `data_vencimento` DATE NOT NULL,
    `data_pagamento` DATE NULL,
    `status` VARCHAR(20) NULL DEFAULT 'Pendente',
    `forma_pagamento` VARCHAR(50) NULL,
    `numero_parcelas` INTEGER NULL DEFAULT 1,
    `loja_local` VARCHAR(100) NULL,
    `funcionario_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `cliente_id` INTEGER NULL,
    `fornecedor_id` INTEGER NULL,
    `venda_id` INTEGER NULL,
    `plano_corte_id` INTEGER NULL,
    `compra_id` INTEGER NULL,

    INDEX `fk_lf_cliente`(`cliente_id`),
    INDEX `fk_lf_fornecedor`(`fornecedor_id`),
    INDEX `fk_lf_plano_corte`(`plano_corte_id`),
    INDEX `funcionario_id`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamento_ambientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orcamento_id` INTEGER NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `ordem` INTEGER NULL DEFAULT 0,

    INDEX `orcamento_id`(`orcamento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamento_opcoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ambiente_id` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `descritivo` TEXT NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `ordem` INTEGER NULL DEFAULT 0,

    INDEX `ambiente_id`(`ambiente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_nome` VARCHAR(150) NOT NULL,
    `cliente_endereco` VARCHAR(255) NULL,
    `cliente_contato` VARCHAR(100) NULL,
    `data_orcamento` DATE NOT NULL,
    `validade_dias` INTEGER NULL DEFAULT 7,
    `condicoes_pagamento` TEXT NULL,
    `prazo_entrega` TEXT NULL,
    `observacoes` TEXT NULL,
    `criado_em` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `atualizado_em` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `label` VARCHAR(150) NOT NULL,

    UNIQUE INDEX `codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planos_corte` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fornecedor_id` INTEGER NOT NULL,
    `descricao_geral` TEXT NULL,
    `valor_total` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `status` ENUM('Rascunho', 'Enviado', 'Em Producao', 'Concluido', 'Cancelado') NULL DEFAULT 'Rascunho',
    `data_prevista` DATE NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fornecedor_id`(`fornecedor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ponto_justificativas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `funcionario_id` INTEGER NOT NULL,
    `data_inicio` DATE NOT NULL,
    `data_fim` DATE NOT NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `observacao` TEXT NULL,
    `anexo_url` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `funcionario_id`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ponto_registros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `funcionario_id` INTEGER NOT NULL,
    `data_registro` DATE NOT NULL,
    `hora_registro` TIME(0) NOT NULL,
    `tipo` VARCHAR(20) NULL,
    `origem` VARCHAR(50) NULL DEFAULT 'Sistema',
    `editado_por` INTEGER NULL,
    `motivo_edicao` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `funcionario_id`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produtos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `fornecedor` VARCHAR(150) NULL,
    `medida` VARCHAR(50) NULL,
    `cor` VARCHAR(50) NULL,
    `unidade` VARCHAR(20) NULL,
    `quantidade` DECIMAL(10, 2) NULL,
    `valor_unitario` DECIMAL(10, 2) NULL,
    `valor_total` DECIMAL(10, 2) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recuperacao_senha` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token` VARCHAR(100) NOT NULL,
    `expira_em` DATETIME(0) NOT NULL,
    `usado` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,

    INDEX `permission_id`(`permission_id`),
    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `ativo` BOOLEAN NULL DEFAULT true,

    UNIQUE INDEX `codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitacoes_cadastro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `usuario` VARCHAR(50) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `nivel_acesso` INTEGER NULL DEFAULT 2,
    `status` VARCHAR(20) NULL DEFAULT 'Pendente',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarefas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `origem` ENUM('VendaCliente', 'PlanoCorte', 'Garantia', 'Manutencao', 'ProducaoInterna', 'Ajuste') NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `data_inicio` DATETIME(0) NOT NULL,
    `data_fim` DATETIME(0) NULL,
    `prioridade` ENUM('Baixa', 'Normal', 'Alta', 'Urgente') NULL DEFAULT 'Normal',
    `status` ENUM('Pendente', 'Agendada', 'EmProducao', 'Pausada', 'Finalizada', 'Cancelada') NULL DEFAULT 'Pendente',
    `cliente_id` INTEGER NULL,
    `funcionario_id` INTEGER NULL,
    `venda_id` INTEGER NULL,
    `plano_corte_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `cliente_id`(`cliente_id`),
    INDEX `funcionario_id`(`funcionario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarefas_funcionarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tarefa_id` INTEGER NOT NULL,
    `funcionario_id` INTEGER NOT NULL,

    INDEX `funcionario_id`(`funcionario_id`),
    INDEX `tarefa_id`(`tarefa_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarefas_producao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `tipo` ENUM('VendaCliente', 'PlanoCorte', 'Manutencao', 'ProducaoInterna') NOT NULL,
    `data_inicio` DATETIME(0) NOT NULL,
    `data_fim` DATETIME(0) NOT NULL,
    `status` ENUM('Agendada', 'EmExecucao', 'Pausada', 'Finalizada', 'Cancelada') NULL DEFAULT 'Agendada',
    `cliente_id` INTEGER NULL,
    `plano_corte_id` INTEGER NULL,
    `venda_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `cliente_id`(`cliente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `role_id` INTEGER NULL,

    UNIQUE INDEX `IDX_97672ac88f789774dd47f7c8be`(`email`),
    INDEX `role_id`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `vendedor_id` INTEGER NULL,
    `data_emissao` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `data_entrega` DATE NULL,
    `valor_total` DECIMAL(10, 2) NULL,
    `desconto` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `valor_final` DECIMAL(10, 2) NULL,
    `status` VARCHAR(20) NULL DEFAULT 'Aberto',
    `observacao` TEXT NULL,

    INDEX `cliente_id`(`cliente_id`),
    INDEX `vendedor_id`(`vendedor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agenda_producao` ADD CONSTRAINT `agenda_producao_ibfk_1` FOREIGN KEY (`plano_corte_id`) REFERENCES `planos_corte`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agenda_producao` ADD CONSTRAINT `agenda_producao_ibfk_2` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ambientes_venda` ADD CONSTRAINT `ambientes_venda_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `apontamento_producao` ADD CONSTRAINT `apontamento_producao_ibfk_1` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `apontamento_producao` ADD CONSTRAINT `apontamento_producao_ibfk_2` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `fk_compras_venda` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `consumo_insumos` ADD CONSTRAINT `consumo_insumos_ibfk_1` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `entrada_insumos` ADD CONSTRAINT `entrada_insumos_ibfk_1` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `entrada_insumos` ADD CONSTRAINT `entrada_insumos_ibfk_2` FOREIGN KEY (`compra_id`) REFERENCES `compras`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `estoque_sobras` ADD CONSTRAINT `estoque_sobras_ibfk_1` FOREIGN KEY (`produto_pai_id`) REFERENCES `produtos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `insumos_plano_corte` ADD CONSTRAINT `fk_insumo_plano` FOREIGN KEY (`plano_corte_id`) REFERENCES `planos_corte`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `insumos_plano_corte` ADD CONSTRAINT `fk_insumo_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `itens_compra` ADD CONSTRAINT `itens_compra_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compras`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `itens_compra` ADD CONSTRAINT `itens_compra_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `itens_compra_rateio` ADD CONSTRAINT `itens_compra_rateio_ibfk_1` FOREIGN KEY (`item_compra_id`) REFERENCES `itens_compra`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `itens_compra_rateio` ADD CONSTRAINT `itens_compra_rateio_ibfk_2` FOREIGN KEY (`ambiente_id`) REFERENCES `ambientes_venda`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `itens_plano_corte` ADD CONSTRAINT `itens_plano_corte_ibfk_1` FOREIGN KEY (`plano_corte_id`) REFERENCES `planos_corte`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `itens_venda` ADD CONSTRAINT `itens_venda_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `vendas`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `itens_venda` ADD CONSTRAINT `itens_venda_ibfk_2` FOREIGN KEY (`ambiente_id`) REFERENCES `ambientes_venda`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lancamentos_financeiros` ADD CONSTRAINT `fk_lf_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lancamentos_financeiros` ADD CONSTRAINT `fk_lf_fornecedor` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lancamentos_financeiros` ADD CONSTRAINT `fk_lf_plano_corte` FOREIGN KEY (`plano_corte_id`) REFERENCES `planos_corte`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lancamentos_financeiros` ADD CONSTRAINT `lancamentos_financeiros_ibfk_1` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `orcamento_ambientes` ADD CONSTRAINT `orcamento_ambientes_ibfk_1` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `orcamento_opcoes` ADD CONSTRAINT `orcamento_opcoes_ibfk_1` FOREIGN KEY (`ambiente_id`) REFERENCES `orcamento_ambientes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `planos_corte` ADD CONSTRAINT `planos_corte_ibfk_1` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ponto_justificativas` ADD CONSTRAINT `ponto_justificativas_ibfk_1` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ponto_registros` ADD CONSTRAINT `ponto_registros_ibfk_1` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `recuperacao_senha` ADD CONSTRAINT `recuperacao_senha_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tarefas` ADD CONSTRAINT `tarefas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tarefas` ADD CONSTRAINT `tarefas_ibfk_2` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tarefas_funcionarios` ADD CONSTRAINT `tarefas_funcionarios_ibfk_1` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas_producao`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tarefas_funcionarios` ADD CONSTRAINT `tarefas_funcionarios_ibfk_2` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tarefas_producao` ADD CONSTRAINT `tarefas_producao_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_ibfk_2` FOREIGN KEY (`vendedor_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

