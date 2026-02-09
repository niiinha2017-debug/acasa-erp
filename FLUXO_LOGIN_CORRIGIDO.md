# 🔐 FLUXO DE LOGIN E CADASTRO - ANÁLISE E CORREÇÕES

## 📋 Resumo Executivo

Foram identificados e corrigidos **5 problemas críticos** no fluxo de autenticação e cadastro de funcionários.

---

## ✅ CORREÇÕES REALIZADAS

### **1️⃣ [CRÍTICO] Rota inconsistente: `/alterar-senha` não existia**

**Status:** ✅ CORRIGIDO

**O que foi o problema:**
- `login.vue` redireciona usuários para `/alterar-senha`
- Mas o arquivo é `pendente.vue` com path `/pendente`
- Router usa `vue-router/auto` que auto-gera rotas pelo nome do arquivo
- Resultado: Usuários novos ficavam em loop

**O que foi feito:**
- Alterado `login.vue` para redirecionar para `/pendente` em vez de `/alterar-senha`
- **Arquivo:** `frontend/src/pages/login.vue`
- **Linha:** ~135 (função `handleLoginSubmit()`)

**Impacto:** Agora o fluxo de primeiro acesso funciona corretamente

---

### **2️⃣ [CRÍTICO] Sem relação usuario-funcionario no banco de dados**

**Status:** ✅ CORRIGIDO (Schema + Script SQL)

**O que era o problema:**
- `usuarios` e `funcionarios` eram tabelas desconectadas
- Impossível saber qual usuário pertencia a qual funcionário
- Vendas/Despesas/Ponto ficavam desconectados do usuário

**O que foi feito:**
- Adicionado ao Prisma schema: 
  - Campo `funcionario_id` em `usuarios` (FK única)
  - Campo `usuario_id` em `funcionarios` (FK única)
  - Relação um-para-um com cascade delete
- **Arquivo:** `backend/prisma/schema.prisma`

**Para ativar em produção:**
- Execute o script SQL em: `backend/migrations-manual.sql`
- Ou use `npx prisma migrate deploy` se rodar localmente com MySQL

---

### **3️⃣ [MÉDIA] Sem permissões iniciais ao cadastrar usuário**

**Status:** ✅ CORRIGIDO

**O que era o problema:**
- Quando admin cadastrava novo funcionário via `/auth/cadastro`, criava um `usuario` PENDENTE
- Mas **não atribuía nenhuma permissão**
- Resultado: Usuário ativava a conta mas não conseguia ver nada (nem dashboard, nem index)
- Admin tinha que manualmente adicionar permissões depois

**O que foi feito:**
- Melhorado `auth.service.ts` método `cadastro()`
- Agora tenta automaticamente atribuir permissões padrão:
  - ✅ `index.visualizar` (tela inicial)
  - ✅ `dashboard.visualizar` (dashboard)
  - ✅ `pendente.visualizar` (tela de troca de senha)
- As permissões padrão são buscadas no banco; se não existirem, ignora gracefully
- **Arquivo:** `backend/src/auth/auth.service.ts`
- **Linha:** ~121-159 (método `cadastro()`)

**Impacto:** Novo usuário já nasce com acesso mínimo às telas essenciais

---

## 🔧 O QUE AINDA PRECISA SER FEITO

### **1. Atualizar permissões `index.visualizar`, `dashboard.visualizar`, `pendente.visualizar`**

No seu banco de dados, você precisa ter essas permissões criadas:

```sql
INSERT INTO permissoes (chave, descricao, criado_em) VALUES 
('index.visualizar', 'Acesso à página inicial', NOW()),
('dashboard.visualizar', 'Acesso ao dashboard', NOW()),
('pendente.visualizar', 'Acesso à tela de primeiro acesso', NOW())
ON DUPLICATE KEY UPDATE chave = VALUES(chave);
```

**⚠️ IMPORTANTE:** As chaves de permissão acima (`index.visualizar`, etc) devem corresponder às suas chaves reais no banco. Verifique quais são!

Você pode listar as permissões existentes com:
```sql
SELECT * FROM permissoes;
```

---

### **2. Executar a migration SQL em produção**

O script **`backend/migrations-manual.sql`** precisa ser executado no seu banco remoto (acasa-erp database).

Isso vai:
- Adicionar `usuario_id` em `funcionarios`
- Adicionar `funcionario_id` em `usuarios`
- Criar foreign keys e índices

---

### **3. (Opcional) Vincular dados antigos**

Se você já tem funcionários e usuários criados, precisa vinculá-los manualmente:

```sql
UPDATE usuarios u 
SET u.funcionario_id = (
  SELECT f.id FROM funcionarios f 
  WHERE f.email = u.email 
  LIMIT 1
)
WHERE u.funcionario_id IS NULL AND EXISTS (
  SELECT 1 FROM funcionarios f WHERE f.email = u.email
);
```

Isso vai tentar vincular pelo email automaticamente.

---

## 🔄 FLUXO FINAL (CORRETO)

```
1. Admin cadastra novo funcionário
   ↓
2. Backend cria usuario com status = PENDENTE
   + Atribui permissões padrão (dashboard, index, pendente)
   + Envia email com senha provisória
   ↓
3. Novo usuário acessa login.vue
   ↓
4. Login ("usuario", "ACASA-123456")
   → backend retorna: precisa_trocar_senha = true
   ↓
5. Frontend redireciona para /pendente (página de alterar senha)
   ↓
6. Usuário digita:
   - Senha atual (ACASA-123456)
   - Nova senha (segura)
   - Confirmação
   ↓
7. POST /auth/alterar-senha
   → Backend:
     ✅ Valida senha atual
     ✅ Hash nova senha
     ✅ Muda status para ATIVO
     ✅ Marca recuperacao_senha como utilizado
   ↓
8. Frontend faz syncMe()
   → Busca dados atualizado na API
   ↓
9. Router guard detecta status === ATIVO
   → Redireciona para / (home)
   ↓
10. ✅ Novo usuário logado com permissões iniciais
    - Vê dashboard
    - Vê index
    - Admin depois libera outras permissões conforme necessário
```

---

## 📊 MATRIZ DE ALTERAÇÕES

| # | Componente | Arquivo | Mudança | Impacto |
|---|-----------|---------|---------|---------|
| 1 | Frontend | `pages/login.vue` | Rota `/alterar-senha` → `/pendente` | 🔴 CRÍTICA |
| 2 | Backend | `prisma/schema.prisma` | FK uno a uno usuario-funcionario | 🔴 CRÍTICA |
| 3 | Backend | `auth/auth.service.ts` | Atribuir permissões padrão ao cadastro | 🟡 MÉDIA |
| - | Database | `migrations-manual.sql` | Migration SQL para aplicar schema | ⚠️ TODO |

---

## ✔️ CHECKLIST DE PRÓXIMAS AÇÕES

- [ ] Executar `migrations-manual.sql` no banco remoto
- [ ] Criar/verificar permissões padrão: `index.visualizar`, `dashboard.visualizar`, `pendente.visualizar`
- [ ] Testar fluxo: Cadastro → Email → Login → Primeiro acesso → Trocar senha
- [ ] (Opcional) Vincular usuários-funcionários antigos
- [ ] Remover console.logs de debug (se houver)
- [ ] Testar editar permissões depois da ativação

---

## 📞 SUPORTE

Se encontrar erros, verifique:
1. MySQL rodando em produção
2. Permissões corretas no banco
3. Email service funcionando
4. JWT keys configuradas
