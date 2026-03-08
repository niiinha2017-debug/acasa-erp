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

**GitLab (CI/CD):** em **Settings → CI/CD → Variables** do repositório, configure também (para o pipeline fazer deploy e **assinar os APKs** como no GitHub):

| Variável | Tipo | O que é | Como obter |
|----------|------|---------|------------|
| `EC2_SSH_PRIVATE_KEY` | Variable (ou File) | Chave SSH da EC2 (conteúdo do .pem) | Conteúdo do mesmo arquivo que você usa em `KEY_PATH` |
| `EC2_HOST` | Variable | Acesso SSH à EC2 | Ex.: `ec2-user@54.164.55.32` |
| `ANDROID_KEYSTORE_BASE64` | Variable, **Masked** | Keystore Android em Base64 | No PC: `base64 -w0 caminho/do/seu.keystore` (ou no Git Bash: `base64 -w 0 seu.keystore`) |
| `ANDROID_KEYSTORE_PASSWORD` | Variable, **Masked** | Senha do keystore | A senha que você usa ao assinar o APK |
| `ANDROID_KEY_ALIAS` | Variable, **Masked** | Alias da chave no keystore | Ex.: `mykey` ou o alias que você criou |
| `ANDROID_KEY_PASSWORD` | Variable, **Masked** | Senha da chave (key) | Geralmente igual à senha do keystore |

Sem as variáveis `ANDROID_*`, o CI ainda roda, mas os APKs saem **unsigned** (não dá para atualizar por cima de uma versão assinada).

**GitLab (push):** na primeira vez que der `git push origin main` o Git pede usuário/senha (ou abre o navegador); depois pode guardar no Gerenciador de Credenciais do Windows. Para usar **só GitLab** (sair do GitHub), veja **scripts/GITLAB-ONLY.md**.

## 2. Usar nos scripts

Antes de rodar qualquer script de deploy, carregue o arquivo:

Todos os scripts de deploy leem `scripts/deploy.env` automaticamente (se existir). Só rodar:

**Um comando só (recomendado):** bump + commit + push + deploy Tauri (na sua máquina Windows):

```bash
cd "d:\Sistema ERP\acasa-erp"
bash scripts/deploy-tudo.sh              # ou: bash scripts/deploy-tudo.sh "release v0.1.64"
```

Isso sobe o push (o pipeline atualiza Android, site e backend na nuvem) e publica o instalador .exe na EC2.

**Scripts separados (se precisar):**

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

**Android (Capacitor):** no **PC** usa a mesma chave EC2 (`KEY_PATH`) e o `keystore.properties` local (no projeto Android) para assinar. No **GitLab CI**, use as variáveis `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD` para os APKs saírem assinados no pipeline (igual ao que você tinha no GitHub).
