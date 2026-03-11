# Configurar Evolution API no servidor

Passo a passo para subir a Evolution API no servidor (ex.: AWS Lightsail, VPS Ubuntu).

## 1. Entrar no servidor

```bash
ssh seu_usuario@IP_DO_SERVIDOR
# ou: ssh -i sua-chave.pem ubuntu@IP_DO_SERVIDOR
```

## 2. Instalar Docker (se ainda não tiver)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
# Saia e entre de novo no SSH para o grupo ter efeito
```

## 3. Enviar a pasta evolution-api para o servidor

No seu **PC** (na pasta do projeto):

```bash
scp -r evolution-api seu_usuario@IP_DO_SERVIDOR:~/
# ou com chave: scp -i sua-chave.pem -r evolution-api ubuntu@IP_DO_SERVIDOR:~/
```

Ou clone o repositório no servidor e use a pasta `evolution-api` de lá.

## 4. No servidor: criar e editar o .env

```bash
cd ~/evolution-api
cp .env.example .env
nano .env
```

Ajuste:

| Variável | Exemplo | O que é |
|----------|---------|---------|
| `AUTHENTICATION_API_KEY` | Chave forte (ex.: `openssl rand -hex 16`) | Chave que o ERP usa para falar com a API. **Guarde igual no ERP (Configurações).** |
| `SERVER_URL` | `https://evolution.seudominio.com.br` ou `http://IP:8080` | URL pública onde a Evolution responde (IP ou domínio). |

Exemplo de `.env`:

```env
AUTHENTICATION_API_KEY=sua_chave_secreta_aqui_32_chars
SERVER_URL=https://evolution.acasamarcenaria.com.br
```

Salve (Ctrl+O, Enter, Ctrl+X no nano).

## 5. Subir os containers

A Evolution API v2 exige um banco (PostgreSQL ou MySQL). O `docker-compose.yml` do projeto já inclui PostgreSQL; basta subir:

```bash
cd ~/evolution-api
docker-compose up -d
```

Verificar se subiu (evolution_api, evolution_postgres, evolution_redis):

```bash
docker-compose ps
docker logs evolution_api
```

## 6. Firewall: liberar porta 8080

- **AWS Lightsail:** Networking → Firewall → adicionar regra TCP **8080**.
- **UFW no servidor:**

  ```bash
  sudo ufw allow 8080/tcp
  sudo ufw reload
  ```

## 7. (Opcional) HTTPS com subdomínio

Se usar domínio (ex.: `evolution.acasamarcenaria.com.br`):

1. Aponte o DNS desse subdomínio para o IP do servidor.
2. Use Nginx (ou Caddy) como proxy reverso na porta 443 e encaminhe para `http://127.0.0.1:8080`.
3. No `.env` use `SERVER_URL=https://evolution.acasamarcenaria.com.br`.

## 8. Configurar no ERP

No **ERP** (Configurações / Empresa):

- **URL:** `https://evolution.seudominio.com.br` ou `http://IP_DO_SERVIDOR:8080`
- **Chave (API Key):** o mesmo valor de `AUTHENTICATION_API_KEY` do `.env`
- **Nome da instância:** o nome que você criar na Evolution (ex.: `acasa`)

Depois, crie e conecte a instância WhatsApp pela interface da Evolution (ou pela API). O teste de conexão no ERP deve usar essa URL e chave.

## Comandos úteis

```bash
# Ver logs
docker logs -f evolution_api

# Parar
docker compose -f ~/evolution-api/docker-compose.yml down

# Reiniciar
docker compose -f ~/evolution-api/docker-compose.yml restart
```
