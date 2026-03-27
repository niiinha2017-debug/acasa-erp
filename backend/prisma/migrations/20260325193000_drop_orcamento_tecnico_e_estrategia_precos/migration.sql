-- Remove tabelas legadas de Orçamento Técnico e Estratégia de Preços / matriz operacional.
-- Ordem: filhos antes dos pais (FK).

DROP TABLE IF EXISTS `orcamento_tecnico_itens`;
DROP TABLE IF EXISTS `orcamento_tecnico`;
DROP TABLE IF EXISTS `configuracoes_preco`;
DROP TABLE IF EXISTS `operational_matrix`;
DROP TABLE IF EXISTS `global_config`;
