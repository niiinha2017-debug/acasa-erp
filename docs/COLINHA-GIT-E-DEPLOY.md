# Colinha — Git + Deploy (A CASA ERP)

## Git (antes de fazer deploy)

```bash
cd "d:\Sistema ERP\acasa-erp"

git status
git add .
git commit -m "Descrição do que mudou"
git push
```

**Ordem:** sempre **commit + push** primeiro; depois rode o script de deploy.

---

## Scripts de deploy (raiz do projeto)

| Comando | O que faz |
|--------|------------|
| `npm run deploy:apps` | **Só apps:** APKs (ERP + Ponto) + instalador Windows (Tauri). Não mexe no site web. |
| `npm run deploy:all` | **Tudo:** o mesmo que acima + publica `index.html` (página de downloads) + atualiza o **ERP Web** no servidor (git pull no EC2, build, rsync). |

### Só Android (APKs)

```bash
bash scripts/deploy-android.sh
```

- Sobe `versionCode` nos dois projetos Android.
- Gera e envia: `Acasa.apk` → `/erp/`, `ponto.apk` → subdomínio Ponto.

### Só Desktop (Tauri)

```bash
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="sua_senha_da_tauri_private_key"
bash scripts/deploy-tauri.sh
```

- Sobe a versão em `frontend/package.json` e `tauri.conf.json`.
- Gera o `.exe`, assina e envia para o servidor (updater).

---

## Variáveis / requisitos

| Deploy | O que precisa |
|--------|----------------|
| **Tauri** | `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (senha do arquivo `tauri_private.key`). Chave em: `C:\Users\Julyana Duarte\.ssh\tauri_private.key` |
| **SSH** | Chave: `C:\Users\Julyana Duarte\.ssh\acasa_key` (já usada nos scripts) |
| **Android** | `keystore.properties` em `frontend/android/` e `frontend-ponto/android/` (já configurado) |

---

## Onde fica a versão

- **Número que o usuário vê (ex.: 0.1.17):** `frontend/package.json` e `frontend/src-tauri/tauri.conf.json`.
- **Desktop:** sobe automaticamente no `deploy-tauri.sh` (bump antes do build).
- **Android:** `versionCode` sobe no `deploy-android.sh`; o `versionName` é lido do `package.json` no build.

---

## Resumo rápido

1. **Só publicar app (celular + desktop):**  
   `npm run deploy:apps` (definir senha do Tauri antes, se for rodar o Tauri).
2. **Publicar app + site web + página de downloads:**  
   `npm run deploy:all`.
3. **Só APKs:**  
   `bash scripts/deploy-android.sh`.
