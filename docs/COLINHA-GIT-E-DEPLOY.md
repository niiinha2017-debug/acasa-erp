# Colinha — Git + Deploy (A CASA ERP)

## Plataformas (quem usa o quê)

| Dispositivo | Tecnologia | Arquivo / como instalar |
|-------------|------------|--------------------------|
| **PC/notebook (Windows)** | Tauri | `AcasaSetup.exe` — instalador desktop |
| **Celular e tablet Android** | Capacitor (APK) | **ERP:** `Acasa.apk` · **Ponto:** `ponto.apk` |
| **Navegador (web)** | Vue + backend | Site ERP em aplicativo.acasamarcenaria.com.br |

**Tauri não roda no Android.** No tablet (e no celular) usa o mesmo APK do ERP ou do Ponto; não tem instalador Tauri para Android.

---

## Git (antes de fazer deploy)

```bash
cd "d:\Sistema ERP\acasa-erp"

git status
git add .
git commit -m "atualização 18"
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
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="acasa3358"
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

---

## Deploy demorando?

- **Android (ERP + Ponto):** dois builds Gradle + dois `npm run build` — costuma levar 5–15 min. Os scripts agora mostram `[HH:MM:SS]` e o tempo total no final.
- **Tauri (desktop):** compilação Rust + NSIS — pode levar 5–15 min (mais na primeira vez).
- **Dica:** se só mudou o frontend/APK, rode só `bash scripts/deploy-android.sh`. Se só mudou o instalador Windows, rode só `bash scripts/deploy-tauri.sh` (com a senha definida). Assim você não espera o que não precisa.
