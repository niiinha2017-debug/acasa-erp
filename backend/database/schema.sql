-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: acasa_erp
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `agenda_producao`
--

DROP TABLE IF EXISTS `agenda_producao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agenda_producao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plano_corte_id` int NOT NULL,
  `fornecedor_id` int NOT NULL,
  `descricao` text NOT NULL,
  `data_inicio` date DEFAULT NULL,
  `data_fim_prevista` date DEFAULT NULL,
  `status` enum('Planejado','Em Producao','Finalizado') DEFAULT 'Planejado',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `plano_corte_id` (`plano_corte_id`),
  KEY `fornecedor_id` (`fornecedor_id`),
  CONSTRAINT `agenda_producao_ibfk_1` FOREIGN KEY (`plano_corte_id`) REFERENCES `planos_corte` (`id`),
  CONSTRAINT `agenda_producao_ibfk_2` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ambientes_venda`
--

DROP TABLE IF EXISTS `ambientes_venda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ambientes_venda` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venda_id` int NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`venda_id`),
  CONSTRAINT `ambientes_venda_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `apontamento_producao`
--

DROP TABLE IF EXISTS `apontamento_producao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `apontamento_producao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `funcionario_id` int NOT NULL,
  `tarefa_id` int NOT NULL,
  `horas_trabalhadas` decimal(5,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `funcionario_id` (`funcionario_id`),
  KEY `tarefa_id` (`tarefa_id`),
  CONSTRAINT `apontamento_producao_ibfk_1` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios` (`id`),
  CONSTRAINT `apontamento_producao_ibfk_2` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `indicacao` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `endereco` text,
  `numero` varchar(20) DEFAULT NULL,
  `complemento` varchar(100) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `cpf_cnpj` varchar(20) DEFAULT NULL,
  `rg_ie` varchar(30) DEFAULT NULL,
  `observacao` text,
  `status` varchar(20) DEFAULT 'Ativo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf_cnpj` (`cpf_cnpj`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fornecedor_id` int NOT NULL,
  `cliente_id` int DEFAULT NULL,
  `data_compra` date NOT NULL,
  `data_emissao_nf` date DEFAULT NULL,
  `numero_nf` varchar(50) DEFAULT NULL,
  `valor_total_produtos` decimal(10,2) DEFAULT '0.00',
  `valor_frete` decimal(10,2) DEFAULT '0.00',
  `valor_outros` decimal(10,2) DEFAULT '0.00',
  `valor_final` decimal(10,2) NOT NULL,
  `status` varchar(20) DEFAULT 'Pendente',
  `observacao` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `venda_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fornecedor_id` (`fornecedor_id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `fk_compras_venda` (`venda_id`),
  CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores` (`id`),
  CONSTRAINT `compras_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `fk_compras_venda` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `constantes`
--

DROP TABLE IF EXISTS `constantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `constantes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grupo` varchar(50) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL,
  `valor` varchar(100) DEFAULT NULL,
  `extra` json DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_constante` (`grupo`,`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `consumo_insumos`
--

DROP TABLE IF EXISTS `consumo_insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consumo_insumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `insumo_id` int NOT NULL,
  `origem` enum('VendaCliente','PlanoCorte') NOT NULL,
  `venda_id` int DEFAULT NULL,
  `plano_corte_id` int DEFAULT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `custo_total` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `insumo_id` (`insumo_id`),
  CONSTRAINT `consumo_insumos_ibfk_1` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `despesas`
--

DROP TABLE IF EXISTS `despesas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `despesas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `descricao` varchar(255) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `data` date NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `status` varchar(20) DEFAULT 'Pendente',
  `forma_pagamento` varchar(50) DEFAULT NULL,
  `centro_custo` varchar(100) DEFAULT NULL,
  `observacao` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `data_vencimento` date DEFAULT NULL,
  `data_pagamento` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `entrada_insumos`
--

DROP TABLE IF EXISTS `entrada_insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrada_insumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `insumo_id` int NOT NULL,
  `compra_id` int DEFAULT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `insumo_id` (`insumo_id`),
  KEY `compra_id` (`compra_id`),
  CONSTRAINT `entrada_insumos_ibfk_1` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`),
  CONSTRAINT `entrada_insumos_ibfk_2` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `estoque_sobras`
--

DROP TABLE IF EXISTS `estoque_sobras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estoque_sobras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `produto_pai_id` int NOT NULL,
  `comprimento` decimal(10,2) DEFAULT NULL,
  `largura` decimal(10,2) DEFAULT NULL,
  `espessura` decimal(10,2) DEFAULT NULL,
  `quantidade` int DEFAULT '1',
  `localizacao` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Disponível',
  `data_entrada` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `produto_pai_id` (`produto_pai_id`),
  CONSTRAINT `estoque_sobras_ibfk_1` FOREIGN KEY (`produto_pai_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fornecedores`
--

DROP TABLE IF EXISTS `fornecedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fornecedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome_fantasia` varchar(150) NOT NULL,
  `razao_social` varchar(150) DEFAULT NULL,
  `cpf_cnpj` varchar(20) DEFAULT NULL,
  `inscricao_estadual` varchar(30) DEFAULT NULL,
  `telefone_loja` varchar(20) DEFAULT NULL,
  `email_loja` varchar(150) DEFAULT NULL,
  `vendedor_nome` varchar(100) DEFAULT NULL,
  `vendedor_contato` varchar(100) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `dia_fechamento` int DEFAULT NULL,
  `dia_vencimento` int DEFAULT NULL,
  `chave_pix` varchar(100) DEFAULT NULL,
  `dados_bancarios` text,
  `observacao` text,
  `status` varchar(20) DEFAULT 'Ativo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf_cnpj` (`cpf_cnpj`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `funcionarios`
--

DROP TABLE IF EXISTS `funcionarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `funcionarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `nascimento` date DEFAULT NULL,
  `sexo` varchar(20) DEFAULT NULL,
  `estado_civil` varchar(30) DEFAULT NULL,
  `escolaridade` varchar(50) DEFAULT NULL,
  `cpf` varchar(20) NOT NULL,
  `rg` varchar(20) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `endereco` varchar(200) DEFAULT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `complemento` varchar(100) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `setor` varchar(50) DEFAULT NULL,
  `funcao` varchar(50) DEFAULT NULL,
  `tipo_contrato` varchar(50) DEFAULT NULL,
  `data_admissao` date DEFAULT NULL,
  `data_demissao` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Ativo',
  `salario_base` decimal(10,2) DEFAULT NULL,
  `salario_adicional` decimal(10,2) DEFAULT NULL,
  `carga_horaria` int DEFAULT NULL,
  `custo_hora` decimal(10,2) DEFAULT NULL,
  `forma_pagamento` varchar(50) DEFAULT NULL,
  `banco` varchar(50) DEFAULT NULL,
  `agencia` varchar(20) DEFAULT NULL,
  `conta_corrente` varchar(30) DEFAULT NULL,
  `tipo_conta` varchar(30) DEFAULT NULL,
  `chave_pix` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `insumos`
--

DROP TABLE IF EXISTS `insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `unidade` varchar(20) NOT NULL,
  `estoque_atual` decimal(10,3) DEFAULT '0.000',
  `estoque_minimo` decimal(10,3) DEFAULT '0.000',
  `custo_medio` decimal(10,2) DEFAULT '0.00',
  `status` enum('Ativo','Inativo') DEFAULT 'Ativo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `insumos_plano_corte`
--

DROP TABLE IF EXISTS `insumos_plano_corte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insumos_plano_corte` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plano_corte_id` int NOT NULL,
  `produto_id` int NOT NULL,
  `unidade` varchar(20) NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `custo_unitario` decimal(10,2) NOT NULL,
  `custo_total` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_plano_corte` (`plano_corte_id`),
  KEY `idx_produto` (`produto_id`),
  CONSTRAINT `fk_insumo_plano` FOREIGN KEY (`plano_corte_id`) REFERENCES `planos_corte` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_insumo_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `itens_compra`
--

DROP TABLE IF EXISTS `itens_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens_compra` (
  `id` int NOT NULL AUTO_INCREMENT,
  `compra_id` int NOT NULL,
  `produto_id` int NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `unidade_compra` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `compra_id` (`compra_id`),
  KEY `produto_id` (`produto_id`),
  CONSTRAINT `itens_compra_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `itens_compra_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `itens_compra_rateio`
--

DROP TABLE IF EXISTS `itens_compra_rateio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens_compra_rateio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_compra_id` int NOT NULL,
  `ambiente_id` int NOT NULL,
  `percentual` decimal(5,2) DEFAULT NULL,
  `valor_alocado` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item_compra_id` (`item_compra_id`),
  KEY `ambiente_id` (`ambiente_id`),
  CONSTRAINT `itens_compra_rateio_ibfk_1` FOREIGN KEY (`item_compra_id`) REFERENCES `itens_compra` (`id`) ON DELETE CASCADE,
  CONSTRAINT `itens_compra_rateio_ibfk_2` FOREIGN KEY (`ambiente_id`) REFERENCES `ambientes_venda` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `itens_plano_corte`
--

DROP TABLE IF EXISTS `itens_plano_corte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens_plano_corte` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plano_corte_id` int NOT NULL,
  `nome` varchar(150) NOT NULL,
  `cor` varchar(100) DEFAULT NULL,
  `unidade` varchar(20) NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `plano_corte_id` (`plano_corte_id`),
  CONSTRAINT `itens_plano_corte_ibfk_1` FOREIGN KEY (`plano_corte_id`) REFERENCES `planos_corte` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `itens_venda`
--

DROP TABLE IF EXISTS `itens_venda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens_venda` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venda_id` int NOT NULL,
  `ambiente_id` int NOT NULL,
  `descricao` text NOT NULL,
  `quantidade` decimal(10,3) DEFAULT '1.000',
  `valor_unitario` decimal(10,2) DEFAULT '0.00',
  `valor_total` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `venda_id` (`venda_id`),
  KEY `ambiente_id` (`ambiente_id`),
  CONSTRAINT `itens_venda_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`),
  CONSTRAINT `itens_venda_ibfk_2` FOREIGN KEY (`ambiente_id`) REFERENCES `ambientes_venda` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lancamentos_financeiros`
--

DROP TABLE IF EXISTS `lancamentos_financeiros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lancamentos_financeiros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` enum('Pagar','Receber') NOT NULL,
  `origem` enum('VendaCliente','PlanoCorte','Compra','Despesa') DEFAULT NULL,
  `descricao` varchar(100) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `beneficiario` varchar(150) DEFAULT NULL,
  `valor` decimal(10,2) NOT NULL,
  `data_vencimento` date NOT NULL,
  `data_pagamento` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Pendente',
  `forma_pagamento` varchar(50) DEFAULT NULL,
  `numero_parcelas` int DEFAULT '1',
  `loja_local` varchar(100) DEFAULT NULL,
  `funcionario_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cliente_id` int DEFAULT NULL,
  `fornecedor_id` int DEFAULT NULL,
  `venda_id` int DEFAULT NULL,
  `plano_corte_id` int DEFAULT NULL,
  `compra_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `funcionario_id` (`funcionario_id`),
  KEY `fk_lf_cliente` (`cliente_id`),
  KEY `fk_lf_fornecedor` (`fornecedor_id`),
  KEY `fk_lf_plano_corte` (`plano_corte_id`),
  CONSTRAINT `fk_lf_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `fk_lf_fornecedor` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores` (`id`),
  CONSTRAINT `fk_lf_plano_corte` FOREIGN KEY (`plano_corte_id`) REFERENCES `planos_corte` (`id`),
  CONSTRAINT `lancamentos_financeiros_ibfk_1` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orcamento_ambientes`
--

DROP TABLE IF EXISTS `orcamento_ambientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orcamento_ambientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orcamento_id` int NOT NULL,
  `nome` varchar(100) NOT NULL,
  `ordem` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `orcamento_id` (`orcamento_id`),
  CONSTRAINT `orcamento_ambientes_ibfk_1` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orcamento_opcoes`
--

DROP TABLE IF EXISTS `orcamento_opcoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orcamento_opcoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ambiente_id` int NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descritivo` text NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `ordem` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `ambiente_id` (`ambiente_id`),
  CONSTRAINT `orcamento_opcoes_ibfk_1` FOREIGN KEY (`ambiente_id`) REFERENCES `orcamento_ambientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orcamentos`
--

DROP TABLE IF EXISTS `orcamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orcamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_nome` varchar(150) NOT NULL,
  `cliente_endereco` varchar(255) DEFAULT NULL,
  `cliente_contato` varchar(100) DEFAULT NULL,
  `data_orcamento` date NOT NULL,
  `validade_dias` int DEFAULT '7',
  `condicoes_pagamento` text,
  `prazo_entrega` text,
  `observacoes` text,
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(100) NOT NULL,
  `label` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `planos_corte`
--

DROP TABLE IF EXISTS `planos_corte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planos_corte` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fornecedor_id` int NOT NULL,
  `descricao_geral` text,
  `valor_total` decimal(10,2) DEFAULT '0.00',
  `status` enum('Rascunho','Enviado','Em Producao','Concluido','Cancelado') DEFAULT 'Rascunho',
  `data_prevista` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fornecedor_id` (`fornecedor_id`),
  CONSTRAINT `planos_corte_ibfk_1` FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ponto_justificativas`
--

DROP TABLE IF EXISTS `ponto_justificativas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ponto_justificativas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `funcionario_id` int NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `observacao` text,
  `anexo_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `funcionario_id` (`funcionario_id`),
  CONSTRAINT `ponto_justificativas_ibfk_1` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ponto_registros`
--

DROP TABLE IF EXISTS `ponto_registros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ponto_registros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `funcionario_id` int NOT NULL,
  `data_registro` date NOT NULL,
  `hora_registro` time NOT NULL,
  `tipo` varchar(20) DEFAULT NULL,
  `origem` varchar(50) DEFAULT 'Sistema',
  `editado_por` int DEFAULT NULL,
  `motivo_edicao` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `funcionario_id` (`funcionario_id`),
  CONSTRAINT `ponto_registros_ibfk_1` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `fornecedor` varchar(150) DEFAULT NULL,
  `medida` varchar(50) DEFAULT NULL,
  `cor` varchar(50) DEFAULT NULL,
  `unidade` varchar(20) DEFAULT NULL,
  `quantidade` decimal(10,2) DEFAULT NULL,
  `valor_unitario` decimal(10,2) DEFAULT NULL,
  `valor_total` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recuperacao_senha`
--

DROP TABLE IF EXISTS `recuperacao_senha`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recuperacao_senha` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(100) NOT NULL,
  `expira_em` datetime NOT NULL,
  `usado` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `recuperacao_senha_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solicitacoes_cadastro`
--

DROP TABLE IF EXISTS `solicitacoes_cadastro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitacoes_cadastro` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `nivel_acesso` int DEFAULT '2',
  `status` varchar(20) DEFAULT 'Pendente',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tarefas`
--

DROP TABLE IF EXISTS `tarefas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarefas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `origem` enum('VendaCliente','PlanoCorte','Garantia','Manutencao','ProducaoInterna','Ajuste') NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descricao` text,
  `data_inicio` datetime NOT NULL,
  `data_fim` datetime DEFAULT NULL,
  `prioridade` enum('Baixa','Normal','Alta','Urgente') DEFAULT 'Normal',
  `status` enum('Pendente','Agendada','EmProducao','Pausada','Finalizada','Cancelada') DEFAULT 'Pendente',
  `cliente_id` int DEFAULT NULL,
  `funcionario_id` int DEFAULT NULL,
  `venda_id` int DEFAULT NULL,
  `plano_corte_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `funcionario_id` (`funcionario_id`),
  CONSTRAINT `tarefas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `tarefas_ibfk_2` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tarefas_funcionarios`
--

DROP TABLE IF EXISTS `tarefas_funcionarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarefas_funcionarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tarefa_id` int NOT NULL,
  `funcionario_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tarefa_id` (`tarefa_id`),
  KEY `funcionario_id` (`funcionario_id`),
  CONSTRAINT `tarefas_funcionarios_ibfk_1` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas_producao` (`id`),
  CONSTRAINT `tarefas_funcionarios_ibfk_2` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tarefas_producao`
--

DROP TABLE IF EXISTS `tarefas_producao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarefas_producao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `descricao` text,
  `tipo` enum('VendaCliente','PlanoCorte','Manutencao','ProducaoInterna') NOT NULL,
  `data_inicio` datetime NOT NULL,
  `data_fim` datetime NOT NULL,
  `status` enum('Agendada','EmExecucao','Pausada','Finalizada','Cancelada') DEFAULT 'Agendada',
  `cliente_id` int DEFAULT NULL,
  `plano_corte_id` int DEFAULT NULL,
  `venda_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `tarefas_producao_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `role_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vendas`
--

DROP TABLE IF EXISTS `vendas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `vendedor_id` int DEFAULT NULL,
  `data_emissao` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_entrega` date DEFAULT NULL,
  `valor_total` decimal(10,2) DEFAULT NULL,
  `desconto` decimal(10,2) DEFAULT '0.00',
  `valor_final` decimal(10,2) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Aberto',
  `observacao` text,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `vendedor_id` (`vendedor_id`),
  CONSTRAINT `vendas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `vendas_ibfk_2` FOREIGN KEY (`vendedor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'acasa_erp'
--

--
-- Dumping routines for database 'acasa_erp'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-18 15:18:14
