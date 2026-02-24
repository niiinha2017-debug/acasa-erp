-- Remove vínculos das permissões legadas de obras
DELETE up
FROM usuarios_permissoes up
INNER JOIN permissoes p ON p.id = up.permissao_id
WHERE p.chave IN ('obras.ver', 'obras.criar', 'obras.editar');

-- Remove permissões legadas de obras
DELETE FROM permissoes
WHERE chave IN ('obras.ver', 'obras.criar', 'obras.editar');
