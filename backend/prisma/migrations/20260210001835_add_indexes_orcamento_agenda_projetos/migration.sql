-- CreateIndex
CREATE INDEX `agenda_global_inicio_em_idx` ON `agenda_global`(`inicio_em`);

-- CreateIndex
CREATE INDEX `agenda_global_status_idx` ON `agenda_global`(`status`);

-- CreateIndex
CREATE INDEX `projetos_status_atual_idx` ON `projetos`(`status_atual`);

-- RenameIndex
ALTER TABLE `agenda_global` RENAME INDEX `agenda_global_cliente_id_fkey` TO `agenda_global_cliente_id_idx`;

-- RenameIndex
ALTER TABLE `orcamento_itens` RENAME INDEX `orcamento_itens_orcamento_id_fkey` TO `orcamento_itens_orcamento_id_idx`;

-- RenameIndex
ALTER TABLE `projetos` RENAME INDEX `projetos_cliente_id_fkey` TO `projetos_cliente_id_idx`;
