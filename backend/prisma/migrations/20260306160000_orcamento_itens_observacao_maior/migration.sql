-- Aumentar limite de caracteres da observação nos itens do orçamento (melhor visualização e mais texto)
ALTER TABLE `orcamento_itens` MODIFY COLUMN `observacao` VARCHAR(2000) NOT NULL;
