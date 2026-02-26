# Auditoria: uma página por vez (rotas e permissões)

Para cada página conferimos:
1. **Frontend:** `definePage({ meta: { perm: '...' } })` existe e está correto.
2. **Seed:** A permissão existe no `backend/prisma/seed.ts`.
3. **Backend:** As APIs que a página chama estão protegidas com a permissão adequada (quando aplicável).
4. **Menu:** O item de menu (frontend NAV_SCHEMA e backend menu.schema) usa a mesma permissão.

---

## Página 1 – Index (home) `/`

| Item | Status | Observação |
|------|--------|------------|
| **Rota** | `/` | Redireciona conforme permissões. |
| **Arquivo** | `frontend/src/pages/index.vue` | |
| **definePage** | `meta: { perm: 'index.visualizar' }` | ✅ Presente e correto. |
| **No seed?** | `index.visualizar` | ✅ Sim. |
| **Chamadas API** | Nenhuma | Página só redireciona; não chama backend. |
| **Menu** | Não aparece como item (é a home) | Redirecionamento usa `can('agendamentos.ver')` e `getFirstAllowedRoute()` com NAV_SCHEMA. |

**Conclusão:** ✅ **OK.** Permissão correta, existe no seed, sem APIs para proteger.

---

## Próximas páginas (a auditar em sequência)

- [ ] 2 – Login (pública)
- [ ] 3 – Pendente
- [ ] 4 – Alterar senha
- [ ] 5 – Relatórios (index e subpáginas)
- [ ] 6 – Comercial / Orçamentos
- [ ] 7 – Vendas (fechamento, lista, detalhe, nova, editar)
- [ ] 8 – Contratos
- [ ] 9 – Agendamentos (loja, fábrica)
- [ ] 10 – Produção / Plano de corte
- [ ] 11 – Cadastros (clientes, fornecedores, produtos, funcionários)
- [ ] 12 – Financeiro (contas a pagar/receber, despesas, compras)
- [ ] 13 – Configurações (usuários, permissões, empresa)
- [ ] 14 – RH (ponto, relatório, convites)
- [ ] 15 – Arquivos
- [ ] 16 – Outras (debug, aceitar)

Quando quiser, peça: **“Auditar página 2”** (ou o número da próxima).
