-- AlterTable
ALTER TABLE `vendas`
  ADD COLUMN `representante_venda_usuario_id` INTEGER NULL,
  ADD COLUMN `representante_venda_funcionario_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `vendas_comissoes`
  ADD COLUMN `responsavel_usuario_id` INTEGER NULL,
  ADD COLUMN `responsavel_funcionario_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `vendas_representante_venda_usuario_id_idx` ON `vendas`(`representante_venda_usuario_id`);

-- CreateIndex
CREATE INDEX `vendas_representante_venda_funcionario_id_idx` ON `vendas`(`representante_venda_funcionario_id`);

-- CreateIndex
CREATE INDEX `vendas_comissoes_responsavel_usuario_id_idx` ON `vendas_comissoes`(`responsavel_usuario_id`);

-- CreateIndex
CREATE INDEX `vendas_comissoes_responsavel_funcionario_id_idx` ON `vendas_comissoes`(`responsavel_funcionario_id`);

-- AddForeignKey
ALTER TABLE `vendas`
  ADD CONSTRAINT `vendas_representante_venda_usuario_id_fkey`
    FOREIGN KEY (`representante_venda_usuario_id`) REFERENCES `usuarios`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas`
  ADD CONSTRAINT `vendas_representante_venda_funcionario_id_fkey`
    FOREIGN KEY (`representante_venda_funcionario_id`) REFERENCES `funcionarios`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas_comissoes`
  ADD CONSTRAINT `vendas_comissoes_responsavel_usuario_id_fkey`
    FOREIGN KEY (`responsavel_usuario_id`) REFERENCES `usuarios`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas_comissoes`
  ADD CONSTRAINT `vendas_comissoes_responsavel_funcionario_id_fkey`
    FOREIGN KEY (`responsavel_funcionario_id`) REFERENCES `funcionarios`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
