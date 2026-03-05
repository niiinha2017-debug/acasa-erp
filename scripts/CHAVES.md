# Chaves e configuração (uma vez)

Só precisa configurar **uma vez**. Depois os scripts usam tudo daqui.

## 1. Arquivo único

```bash
cd scripts
cp deploy.env.example deploy.env
```

Abra `deploy.env` e preencha:

| Variável | O que é | Onde achar |
|----------|---------|------------|
| `KEY_PATH` | Caminho da chave SSH da EC2 | Você já usa: `~/.ssh/acasa_key` |
| `EC2_HOST` | usuário@IP da EC2 | Ex.: `ec2-user@54.164.55.32` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Senha da chave que assina o .exe do Tauri | A que você criou ao gerar a chave |
| `TAURI_SIGNING_PRIVATE_KEY_PATH` | Caminho do arquivo da chave Tauri | Ex.: `~/.ssh/tauri_private.key` |

**GitLab:** não vai nesse arquivo. Na primeira vez que der `git push gitlab main` o Git pede usuário/senha (ou abre o navegador); depois pode guardar no Gerenciador de Credenciais do Windows. Para usar **só GitLab** (sair do GitHub), veja **scripts/GITLAB-ONLY.md**.

## 2. Usar nos scripts

Antes de rodar qualquer script de deploy, carregue o arquivo:

Todos os scripts de deploy leem `scripts/deploy.env` automaticamente (se existir). Só rodar:

```bash
cd "d:\Sistema ERP\acasa-erp"
bash scripts/upload-update.sh          # 1. Git (bump + build + push)
bash scripts/publicar-ec2-do-pc.sh     # 2. Site (frontend na EC2)
bash scripts/deploy-android.sh         # 3. Android (APK ERP + Ponto → EC2)
bash scripts/deploy-tauri.sh           # 4. Desktop (instalador .exe → EC2)
```

## Resumo: quantas chaves?

- **1 chave SSH** (acasa_key) → EC2 e publicar site / Tauri
- **1 chave + senha Tauri** → só para gerar e publicar o instalador .exe
- **GitLab** → usuário + senha (ou token) na primeira vez; depois o sistema guarda

Ou seja: **2 arquivos de chave** (acasa_key + tauri_private.key) e **1 senha** (Tauri) no `deploy.env`. GitLab é login normal.

**Android (Capacitor):** usa a mesma chave EC2 (`KEY_PATH`); não precisa de chave extra. O script `deploy-android.sh` gera os APKs (ERP + Ponto) e envia para a EC2.
