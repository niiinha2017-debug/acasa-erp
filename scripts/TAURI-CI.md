# Build e deploy do Tauri no GitLab CI

O pipeline passa a buildar e publicar o instalador Windows (Tauri) quando há **runner Windows** e variáveis de assinatura configuradas.

## O que foi configurado

- **Job `build:tauri`** (stage `build-desktop`): roda no runner com tag `windows`, executa `scripts/ci-tauri-build.ps1`, gera `AcasaSetup.exe` e `latest.json`.
- **Job `deploy:tauri`** (stage `deploy`): usa os artefatos do `build:tauri` e envia para a EC2 em `/var/www/aplicativo/erp/AcasaSetup.exe` e `/var/www/aplicativo/updates/tauri/latest.json`.

Ambos têm `allow_failure: true` e só rodam se as variáveis de assinatura estiverem definidas. Se não houver runner Windows ou variáveis, o resto do pipeline segue normalmente (Android e deploy do site/backend).

## Variáveis no GitLab (Settings → CI/CD → Variables)

| Variável | Obrigatória para Tauri | Protegida/Mascarada |
|----------|------------------------|---------------------|
| `TAURI_SIGNING_PRIVATE_KEY` | Sim (conteúdo da chave privada) | Mascarada |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Sim | Mascarada |
| `EC2_SSH_PRIVATE_KEY` | Para deploy (já usada no pipeline) | Mascarada |
| `EC2_HOST` | Para deploy (ex.: `ec2-user@54.164.55.32`) | Não |

## Runner Windows

O GitLab.com **não oferece** runner Windows público. Para o job `build:tauri` rodar é preciso:

1. **Runner self-hosted com tag `windows`**: instale o GitLab Runner em uma máquina Windows (ou use um serviço de runner Windows) e registre com a tag `windows`.
2. Na máquina: Node.js, Rust (rustup), e dependências do Tauri para Windows (WebView2, Visual Studio Build Tools com workload C++).

Se não configurar runner Windows, o job `build:tauri` ficará em pending ou falhará (e o pipeline continua por causa do `allow_failure: true`). O deploy do .exe continua podendo ser feito manualmente no PC com:

```bash
bash scripts/deploy-tauri.sh
```

## URLs após o deploy

- Instalador: `https://aplicativo.acasamarcenaria.com.br/erp/AcasaSetup.exe`
- Atualizações (updater): `https://aplicativo.acasamarcenaria.com.br/updates/tauri/latest.json`
