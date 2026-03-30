# WPPConnect local

Stack paralela e gratuita para testar WhatsApp fora da Meta, sem mexer na Evolution API.

## Subir

No PowerShell, na raiz do projeto:

```powershell
.\scripts\wppconnect-subir.ps1
```

Isso faz:

- baixa o repositório oficial do WPPConnect Server em `%LOCALAPPDATA%\acasa-erp\wppconnect-server`;
- copia a configuração local deste projeto;
- sobe a API em `http://127.0.0.1:21465`.

## Atualizar

```powershell
.\scripts\wppconnect-subir.ps1 -Atualizar
```

## Parar

```powershell
.\scripts\wppconnect-subir.ps1 -Parar
```

## Fluxo mínimo de teste

1. Abra `http://127.0.0.1:21465/api-docs`.
2. Gere um token para a sessão `acasa-erp`:

```powershell
curl.exe -X POST "http://127.0.0.1:21465/api/acasa-erp/15215bde60b7f098918f740b1abe0423/generate-token"
```

3. Guarde o campo `full` retornado.
4. Inicie a sessão com Bearer token:

```powershell
curl.exe -X POST "http://127.0.0.1:21465/api/acasa-erp/start-session" ^
  -H "Authorization: Bearer COLE_AQUI_O_FULL" ^
  -H "Content-Type: application/json"
```

5. Se a sessão ainda estiver iniciando, chame o mesmo endpoint novamente para receber o QR em base64.

## Observação

Ainda não há adaptação do ERP para WPPConnect. Este diretório serve para validar se a alternativa gratuita sobe e autentica melhor que a Evolution no seu ambiente.