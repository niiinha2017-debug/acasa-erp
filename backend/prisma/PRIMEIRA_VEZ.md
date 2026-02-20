# Prisma – Migração (atualização)

**Nada é excluído.** Tudo já está configurado. Só é preciso rodar a migração para atualizar o banco.

## 1. MySQL rodando

- **Docker:** na pasta `acasa-erp`: `docker-compose up -d`
- **XAMPP/WAMP:** inicie o serviço MySQL na porta **3306**

Confirme o `.env` do backend: `DATABASE_URL` com `localhost:3306`, banco `acasa_erp`, usuário/senha corretos.

## 2. Rodar a migração (atualização)

Na pasta **backend**:

```bash
cd "d:\Sistema ERP\acasa-erp\backend"

npx prisma migrate deploy
```

Ou use o script:

```bash
npm run db:atualizacao
```

Isso aplica as migrações pendentes (atualiza o banco) **sem excluir** configurações nem dados.

---

## Resumo

| Comando | O que faz |
|--------|------------|
| `npm run db:atualizacao` | Roda a migração (atualização) – `prisma migrate deploy` |
| `npx prisma migrate deploy` | Mesmo que acima |

Depois, suba o backend (`npm run start:dev`) e use o sistema normalmente.
