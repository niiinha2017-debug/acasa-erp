# Colinha — Git + Deploy (A CASA ERP)

## Os 3 pontos do sistema

| Ponto | O que é | Onde fica no servidor |
|-------|---------|------------------------|
| **1. Android** | APK do ERP + APK do Ponto | `Acasa.apk` (erp/) · `ponto.apk` (subdomínio ponto) |
| **2. Desktop** | Instalador Windows (Tauri) | `AcasaSetup.exe` + updater (erp/ + updates/tauri/) |
| **3. Web** | Site ERP + página de downloads | aplicativo.acasamarcenaria.com.br |

Para **atualizar sempre os 3 pontos**, use um comando só (veja abaixo).

---

## Ritual: Git → Deploy dos 3 pontos

**1. Git (sempre antes do deploy)**

```bash
cd "d:\Sistema ERP\acasa-erp"
git add .
git commit -m "sua mensagem"
git push
```

**2. Deploy dos 3 pontos**

Defina a senha do Tauri (só para o instalador Windows). No **Git Bash**:

```bash
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="sua_senha"
npm run deploy:all
```

No **PowerShell**:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "sua_senha"
npm run deploy:all
```

O `deploy:all` atualiza, nesta ordem: **Android (ERP + Ponto)** → **Desktop (Tauri)** → **página de downloads** → **ERP Web** no servidor.

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
