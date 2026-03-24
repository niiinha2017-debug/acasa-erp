-- Tarefas concluídas passam a ter marca de arquivo (visão operacional vs arquivo).
ALTER TABLE `agenda_loja` ADD COLUMN `arquivado_em` DATETIME(3) NULL;
ALTER TABLE `agenda_fabrica` ADD COLUMN `arquivado_em` DATETIME(3) NULL;

CREATE INDEX `agenda_loja_arquivado_em_idx` ON `agenda_loja`(`arquivado_em`);
CREATE INDEX `agenda_fabrica_arquivado_em_idx` ON `agenda_fabrica`(`arquivado_em`);

-- Retrocompat: concluídas existentes entram no arquivo com a data de última atualização.
UPDATE `agenda_loja`
SET `arquivado_em` = `atualizado_em`
WHERE UPPER(COALESCE(`execucao_etapa`, '')) = 'CONCLUIDO'
   OR UPPER(COALESCE(`status`, '')) = 'CONCLUIDO';

UPDATE `agenda_fabrica`
SET `arquivado_em` = `atualizado_em`
WHERE UPPER(COALESCE(`execucao_etapa`, '')) = 'CONCLUIDO'
   OR UPPER(COALESCE(`status`, '')) = 'CONCLUIDO';
