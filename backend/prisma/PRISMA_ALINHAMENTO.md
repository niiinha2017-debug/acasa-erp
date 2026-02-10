# Prisma – Alinhamento ao sistema (ACASA-ERP)

## Convenções do schema (já em uso)

| Aspecto | Padrão |
|--------|--------|
| **Tabelas** | `@@map("snake_case")` – nomes em português, snake_case (ex.: `orcamento_itens`, `agenda_global`). |
| **Models** | Maioria `snake_case` (ex.: `orcamentos`, `agenda_global`). Exceções em PascalCase: `Cliente`, `Fornecedor`, `Empresa` (tabelas `clientes`, `fornecedor`, `empresa`). |
| **FKs** | Sempre `_id` (ex.: `cliente_id`, `orcamento_id`). |
| **Datas** | `criado_em`, `atualizado_em` com `@default(now())` / `@updatedAt`. |
| **Índices** | Em colunas usadas em `where` / `orderBy` (listagens, filtros, joins). |

## Índices adicionados (só estrutura, sem novas colunas)

- **orcamento_itens**: `@@index([orcamento_id])` – listagem/filtro por orçamento.
- **projetos**: `@@index([cliente_id])`, `@@index([status_atual])` – listagem por cliente e status.
- **agenda_global**: `@@index([cliente_id])`, `@@index([inicio_em])`, `@@index([status])` – listagem por período e status (agenda.service).

## Trechos do schema alterados

### orcamento_itens
```prisma
  criado_em DateTime @default(now())

  @@index([orcamento_id])
  @@map("orcamento_itens")
}
```

### projetos
```prisma
  criado_em     DateTime @default(now())
  atualizado_em DateTime @updatedAt

  @@index([cliente_id])
  @@index([status_atual])
  @@map("projetos")
}
```

### agenda_global
```prisma
  criado_em     DateTime @default(now())
  atualizado_em DateTime @updatedAt

  @@index([cliente_id])
  @@index([inicio_em])
  @@index([status])
  @@map("agenda_global")
}
```

## Migration e comandos

- **Nome da migration:** `add_indexes_orcamento_agenda_projetos`

**Comandos exatos:**

```bash
cd backend
npx prisma migrate dev --name add_indexes_orcamento_agenda_projetos
```

Para só gerar o SQL sem aplicar:

```bash
cd backend
npx prisma migrate dev --name add_indexes_orcamento_agenda_projetos --create-only
```

Depois aplicar em produção (quando for o caso):

```bash
cd backend
npx prisma migrate deploy
```

---

*Nenhuma coluna nem tabela nova foi criada; apenas índices para consultas já usadas no sistema.*
