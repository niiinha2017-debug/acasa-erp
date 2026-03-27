-- Remove permissões de telas descontinuadas (estratégia de preços, fluxo de clientes).
DELETE up FROM `usuarios_permissoes` up
INNER JOIN `permissoes` p ON p.id = up.permissao_id
WHERE p.chave IN (
  'configuracoes.estrategia_precos.ver',
  'configuracoes.estrategia_precos.editar',
  'relatorios.acompanhamento_status.ver'
);

DELETE FROM `permissoes`
WHERE chave IN (
  'configuracoes.estrategia_precos.ver',
  'configuracoes.estrategia_precos.editar',
  'relatorios.acompanhamento_status.ver'
);
