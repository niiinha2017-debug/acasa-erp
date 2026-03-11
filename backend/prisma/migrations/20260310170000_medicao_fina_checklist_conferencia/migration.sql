-- AlterTable: checklist de conferência (Elétrica, Hidráulica, Gás, Alvenaria)
ALTER TABLE `medicao_fina` ADD COLUMN `conferencia_eletrica_ok` BOOLEAN NULL,
    ADD COLUMN `conferencia_hidraulica_ok` BOOLEAN NULL,
    ADD COLUMN `conferencia_gas_ok` BOOLEAN NULL,
    ADD COLUMN `conferencia_alvenaria_ok` BOOLEAN NULL;
