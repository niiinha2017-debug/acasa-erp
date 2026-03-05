-- Quando o vendedor não preenche "Representante da venda": true = usar Sócio no contrato; false = usar Representante Legal
ALTER TABLE `empresa` ADD COLUMN `contrato_usar_socio_quando_vazio` BOOLEAN NULL DEFAULT true;
