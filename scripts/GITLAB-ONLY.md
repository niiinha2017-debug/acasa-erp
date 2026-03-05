# Usar só GitLab (sair do GitHub)

Repositório oficial: **GitLab**. O GitHub deixa de ser usado.

## 1. Configurar o remote GitLab (uma vez)

Se ainda não tiver o remote `gitlab`:

```bash
git remote add gitlab https://gitlab.com/SEU_GRUPO/acasa-erp.git
# ou com SSH:
# git remote add gitlab git@gitlab.com:SEU_GRUPO/acasa-erp.git
```

Substitua `SEU_GRUPO/acasa-erp` pela URL do seu projeto no GitLab.

## 2. Usar só o GitLab no dia a dia

- **Sempre dar push no GitLab:**
  ```bash
  git push gitlab main
  ```

- **Sempre puxar do GitLab:**
  ```bash
  git pull gitlab main
  ```

## 3. Opcional: remover o GitHub

Se quiser remover o remote do GitHub para não enviar nada para lá:

```bash
# Ver remotes
git remote -v

# Remover o origin (se for o GitHub)
git remote remove origin

# Deixar o GitLab como “origin” (mais prático)
git remote rename gitlab origin
```

Depois disso: `git push origin main` e `git pull origin main` usam o GitLab.

## 4. O que o push atualiza (CI)

Ao dar **push na branch `main`**, o GitLab CI (arquivo `.gitlab-ci.yml` na raiz do projeto):

- Faz **build Android** (ERP + Ponto) e **publica os APKs na EC2**.
- **Tauri (instalador .exe):** não é buildado no CI (precisa de Windows). Siga buildando e publicando no seu PC com `bash scripts/deploy-tauri.sh` quando quiser atualizar o desktop.

Resumo: **push no GitLab → Android atualizado na EC2**. Tauri continua manual no seu PC.

---

## 5. Variáveis do GitLab CI (para o pipeline publicar na EC2)

No GitLab: **Settings → CI/CD → Variables**. Crie:

| Nome           | Valor              | Tipo   | Protegida |
|----------------|--------------------|--------|-----------|
| `EC2_SSH_PRIVATE_KEY` | Conteúdo da chave SSH da EC2 (arquivo `acasa_key`) | Variable | ✓ |
| `EC2_HOST`     | `ec2-user@54.164.55.32` (ou o IP/host que você usa) | Variable | ✓ |

- **EC2_SSH_PRIVATE_KEY:** em “Type” escolha **File**; no valor, cole o conteúdo da chave privada (o que você usa em `ssh -i acasa_key`). O GitLab guarda em um arquivo e usa no job.
- **EC2_HOST:** usuário e host para SSH na EC2.

Sem essas variáveis, o estágio **deploy** do pipeline falha (o build Android pode ter rodado; a falha será só no envio para a EC2).
