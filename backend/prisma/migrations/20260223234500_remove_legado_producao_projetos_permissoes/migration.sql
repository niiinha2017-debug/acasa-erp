-- Remove vínculos das permissões legadas de produção/projetos
DELETE up
FROM usuarios_permissoes up
INNER JOIN permissoes p ON p.id = up.permissao_id
WHERE p.chave IN (
  'producao.ver',
  'producao.criar',
  'producao.editar',
  'producao.excluir',
  'projetos.ver',
  'projetos.criar',
  'projetos.editar',
  'projetos.excluir'
);

-- Remove permissões legadas de produção/projetos
DELETE FROM permissoes
WHERE chave IN (
  'producao.ver',
  'producao.criar',
  'producao.editar',
  'producao.excluir',
  'projetos.ver',
  'projetos.criar',
  'projetos.editar',
  'projetos.excluir'
);
