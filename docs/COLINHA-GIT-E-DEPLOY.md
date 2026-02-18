# Colinha — Git + Deploy (A CASA ERP)

## Os 3 pontos do sistema

| Ponto | O que é | Onde fica no servidor |
|-------|---------|------------------------|
| **1. Android** | APK do ERP + APK do Ponto | `Acasa.apk` (erp/) · `ponto.apk` (subdomínio ponto) |
| **2. Desktop** | Instalador Windows (Tauri) | `AcasaSetup.exe` + updater (erp/ + updates/tauri/) |
| **3. Web** | Site ERP + página de downloads | aplicativo.acasamarcenaria.com.br |

Para **atualizar sempre os 3 pontos**, use **GitHub Actions** (recomendado) ou o script local abaixo.

---

## Opção 1: GitHub Actions (deploy automático)

**Dê push na branch `main`** (ou `master`). O workflow faz:

- Backend (EC2)
- Frontend web + página de downloads
- **APKs (ERP + Ponto)** → `erp/Acasa.apk` e subdomínio Ponto (`ponto.apk` + landing)
- `version.json` (Android “Verificar atualização”)
- Instalador Windows (Tauri) + `latest.json` (updater no desktop)

Você **não precisa** rodar `deploy:all` na sua máquina. Os secrets (SSH, Android keystore, Tauri, certificado Windows) precisam estar configurados no GitHub.

### APK não atualiza no push?

1. **Confirme a branch**  
   O workflow só roda em push para `main` ou `master`. Se você usa outra branch, faça merge ou push para `main`.

2. **Veja se o job rodou**  
   No GitHub: **Actions** → último workflow “Deploy ACASA (EC2)” → confira se o job **deploy-android-apks** está verde. Se estiver vermelho, abra o job e veja o passo que falhou.

3. **Secrets do Android**  
   Se aparecer “Secrets faltando”, vá em **Settings** → **Secrets and variables** → **Actions** e confira:
   - `EC2_SSH_KEY`, `EC2_HOST`, `EC2_USER`
   - `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`

4. **Rodar manualmente**  
   Em **Actions** → “Deploy ACASA (EC2)” → **Run workflow** → Run. Assim você dispara o deploy (incluindo APKs) sem dar push.

5. **Versão para o app avisar “nova versão”**  
   O app Android compara com `version.json`. Para o usuário ver “Há uma nova versão”, aumente a versão em `frontend/package.json` (ex.: `0.1.21` → `0.1.22`) antes do push. O ERP abre e, em ~2s, verifica; no menu também há “Verificar atualização”.

---

## Opção 2: Deploy local (script)

Quando quiser rodar o deploy na sua máquina em vez do CI:

**1. Git (sempre antes do deploy)**

```bash
cd "d:\Sistema ERP\acasa-erp"
git add .
git commit -m "4.0"
git push
```

**2. Deploy dos 3 pontos**

Defina a senha do Tauri (só para o instalador Windows). No **Git Bash**:

```bash
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="acasa3358"
npm run deploy:all
```

No **PowerShell**:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "sua_senha"
npm run deploy:all
```

O `deploy:all` atualiza, nesta ordem: **Android (ERP + Ponto)** → **Desktop (Tauri)** → **landing Ponto** → **página de downloads** → **ERP Web** no servidor.

---

## O que você precisa ter

- **SSH:** chave `acasa_key` (já usada nos scripts).
- **Tauri:** senha do arquivo `tauri_private.key` (só para publicar o .exe).
- **Android:** `keystore.properties` em cada pasta android (já configurado).

---

## Versão do app

O número que o usuário vê (ex.: 0.1.17) está em `frontend/package.json` e `frontend/src-tauri/tauri.conf.json`. Sobe automático no deploy (Tauri faz o bump; Android usa o mesmo número).

---

## Se quiser atualizar só 1 ou 2 pontos

- **Só Android (os 2 APKs):** `bash scripts/deploy-android.sh`
- **Só Desktop (.exe):** defina a senha do Tauri e rode `bash scripts/deploy-tauri.sh`
- **Só apps (Android + Desktop), sem web:** `npm run deploy:apps` (com senha do Tauri definida)

O deploy completo leva vários minutos (Gradle + Rust); os scripts mostram `[HH:MM:SS]` e o tempo total no final.
