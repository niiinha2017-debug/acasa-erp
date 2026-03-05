-- AlterTable: agenda_loja - quem criou e quem alterou (regra: usuário só altera o que criou; admin altera qualquer)
ALTER TABLE `agenda_loja` ADD COLUMN `criado_por_usuario_id` INTEGER NULL,
    ADD COLUMN `alterado_por_usuario_id` INTEGER NULL,
    ADD COLUMN `alterado_em` DATETIME(3) NULL;

CREATE INDEX `agenda_loja_criado_por_usuario_id_idx` ON `agenda_loja`(`criado_por_usuario_id`);
CREATE INDEX `agenda_loja_alterado_por_usuario_id_idx` ON `agenda_loja`(`alterado_por_usuario_id`);

ALTER TABLE `agenda_loja` ADD CONSTRAINT `agenda_loja_criado_por_usuario_id_fkey` FOREIGN KEY (`criado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agenda_loja` ADD CONSTRAINT `agenda_loja_alterado_por_usuario_id_fkey` FOREIGN KEY (`alterado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: agenda_fabrica - quem criou e quem alterou
ALTER TABLE `agenda_fabrica` ADD COLUMN `criado_por_usuario_id` INTEGER NULL,
    ADD COLUMN `alterado_por_usuario_id` INTEGER NULL,
    ADD COLUMN `alterado_em` DATETIME(3) NULL;

CREATE INDEX `agenda_fabrica_criado_por_usuario_id_idx` ON `agenda_fabrica`(`criado_por_usuario_id`);
CREATE INDEX `agenda_fabrica_alterado_por_usuario_id_idx` ON `agenda_fabrica`(`alterado_por_usuario_id`);

ALTER TABLE `agenda_fabrica` ADD CONSTRAINT `agenda_fabrica_criado_por_usuario_id_fkey` FOREIGN KEY (`criado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `agenda_fabrica` ADD CONSTRAINT `agenda_fabrica_alterado_por_usuario_id_fkey` FOREIGN KEY (`alterado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
