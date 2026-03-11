# Segurança de rotas e filtros de erro – Auditoria

## Resumo

- **Filtro global de erros**: ✅ `HttpExceptionFilter` em `backend/src/common/http-exception.filter.ts` está registrado em `main.ts` e trata todas as exceções (log + resposta HTTP padronizada).
- **Rotas protegidas**: A maioria dos controllers usa `@UseGuards(JwtAuthGuard, PermissionsGuard)`; rotas públicas são intencionais e documentadas abaixo.

---

## 1. Filtro de erros global

| Item | Status |
|------|--------|
| Registro em `main.ts` | ✅ `app.useGlobalFilters(new HttpExceptionFilter())` |
| Captura todas exceções | ✅ `@Catch()` sem argumento |
| Resposta padronizada | ✅ `{ statusCode, message }` em JSON |
| Produção: não vazar detalhes | ✅ Em produção, erros não‑HTTP retornam "Erro interno do servidor." |
| Log de erros | ✅ Logger com método, URL e stack |
| Erros Prisma | ✅ P2025 → 404, P2002 → 409, P2003 → 400; demais erros Prisma não expõem detalhes em produção |

**Arquivo:** `backend/src/common/http-exception.filter.ts`

---

## 2. Rotas por controller

### Rotas públicas (intencionais)

| Controller | Rotas | Motivo |
|------------|--------|--------|
| **auth** | `POST /api/auth/login`, `POST refresh`, `POST cadastro`, `POST esqueci-senha`, `POST logout` | Login, refresh, cadastro e recuperação de senha |
| **contratos-publico** | `GET :token/pdf`, `GET :token/info`, `POST :token/incluir-assinado`, `POST :token/aceitar` | Acesso por token do link (sem JWT) |
| **ponto** (PontoAppController) | `POST /api/ponto/ativar` | Ativação do app de ponto (gera credenciais) |
| **webhooks** | (nenhuma rota definida) | Reservado para integrações externas |

### Rotas protegidas por JWT + permissões

Todos os controllers abaixo usam `@UseGuards(JwtAuthGuard, PermissionsGuard)` (e onde aplicável `@Permissoes(...)`):

- fornecedores, agenda (3), arquivos, vendas, permissoes, usuarios, utils, analytics  
- clientes, produtos, funcionarios, despesas, orcamentos, contratos (admin), compras  
- financeiro (contas-pagar, contas-receber, fechamento)  
- plano-corte (3), apontamento-producao, mail, empresa  
- ponto: relatorio, justificativas, registros, admin (convites)

### Rotas protegidas só por JWT

- **auth**: `POST reenviar-senha-provisoria` (exige permissão), `POST alterar-senha`, `GET me` (só JWT)

### Rotas protegidas por guard específico (Ponto)

- **ponto** (PontoAppController): `GET hoje`, `POST registrar`, `GET ultimo`, `GET me`, `GET comprovante/:id` → `@UseGuards(PontoAuthGuard)` (token do app de ponto, não JWT ERP)

---

## 3. Checklist de segurança

- [x] Filtro global de exceções ativo
- [x] Rotas de negócio protegidas com JWT (e PermissionsGuard onde há permissões)
- [x] Rotas públicas documentadas e com justificativa (auth, contratos por token, ativar ponto)
- [x] Validação global: `ValidationPipe` com `whitelist: true` em `main.ts`
- [x] Decorator `@Public()` criado e aplicado nas rotas públicas (auth, contratos-publico, webhooks, ponto/ativar); `JwtAuthGuard` respeita `@Public()`.
- [x] **Guard global JWT ativo:** em `app.module` está registrado `APP_GUARD` com `JwtAuthGuard`. Toda rota exige JWT por padrão; rotas com `@Public()` continuam acessíveis. Controllers usam apenas `@UseGuards(PermissionsGuard)` quando precisam checar permissões.

---

## 4. Tratamento de erros nos controllers

Vários controllers tratam erros em try/catch e repassam `HttpException` ou lançam `BadRequestException` / `ForbiddenException` / `InternalServerErrorException`, que o filtro global converte em resposta HTTP correta. Exemplos:

- **contratos-publico**: try/catch em todas as rotas; repasse de `HttpException` e `InternalServerErrorException` para erros genéricos.
- **contas-pagar / contas-receber**: validação de id e tratamento de erros do serviço.
- **arquivos, mail, agenda, vendas**: uso de exceções HTTP onde necessário.

Nenhuma rota expõe stack trace ou mensagem interna em produção; o filtro global garante mensagem genérica para erros não‑HTTP em produção.

---

## 5. Manutenção

- Ao criar **novo controller**: usar `@UseGuards(JwtAuthGuard, PermissionsGuard)` (e `@Permissoes(...)` se houver permissões) ou, se for rota pública, documentar aqui e considerar uso de `@Public()` quando o guard global for adotado.
- Ao criar **nova rota pública**: documentar em "Rotas públicas" e garantir que não haja dados sensíveis sem outro mecanismo de autorização (ex.: token no path para contratos).
