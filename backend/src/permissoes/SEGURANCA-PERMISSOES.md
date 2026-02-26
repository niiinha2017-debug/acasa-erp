# Segurança de Permissões – ACASA ERP

## Princípios

1. **Autorização no backend** – Toda rota protegida usa `JwtAuthGuard` + `PermissionsGuard` e o decorator `@Permissoes('chave')`. O frontend usa `can()` apenas para UX (esconder botões); a API rejeita requisições sem permissão.

2. **Permissões sempre atualizadas** – O JWT não carrega a lista de permissões. Em cada requisição, o `JwtStrategy` busca o usuário no banco e as permissões via `PermissoesService.permissoesDoUsuarioPorId()`. Assim, alterações de permissão passam a valer na próxima chamada.

3. **Dois níveis de “admin”**  
   - `usuarios.is_admin = true`: acesso total (legado).  
   - Permissão `ADMIN`: acesso total.  
   O guard trata os dois da mesma forma para liberar todas as ações.

## Regras no backend

- **Rotas**: Sem `@Permissoes()` → qualquer usuário autenticado pode acessar. Com `@Permissoes('x', 'y')` → o usuário precisa ter pelo menos uma das permissões (ou ser admin).
- **Definir permissões** (`PUT /usuarios/:id/permissoes`):  
  - Só aceita IDs de permissões que existem no catálogo.  
  - Não é permitido remover a permissão `ADMIN` do último usuário que a possui (evita ficar sem nenhum admin).

## Regras no frontend

- **`can(permission)`** e **`temAcesso(chave)`**: consideram apenas `is_admin` e a lista `permissoes` (incluindo `ADMIN`). Não há bypass por login (ex.: usuário fixo).
- Após salvar permissões na tela de configuração, se o usuário editado for o logado, o frontend chama `syncMe()` para atualizar menu e `can()` sem precisar deslogar.

## Constantes

- A chave do administrador é `ADMIN` (constante `CHAVE_ADMIN` em `permissoes.service.ts`). Use-a no guard e nas regras que tratam “admin por permissão”.
