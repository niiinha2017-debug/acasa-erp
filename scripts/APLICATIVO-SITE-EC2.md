# Site aplicativo.acasamarcenaria.com.br na EC2

Este subdomínio serve a **página de downloads** (ERP/Ponto/Desktop) e os **APKs**. O pipeline do GitLab já publica a cada push:

- **APKs**: `/var/www/aplicativo/erp/Acasa.apk` e `/var/www/ponto/ponto.apk`
- **version.json**: `/var/www/aplicativo/updates/android/version.json` (para o app verificar atualização)
- **Página de downloads**: `/var/www/aplicativo/index.html` e `/var/www/aplicativo/downloads/index.html`

## Se o site “não existe” ou não abre

### 1. DNS

Confirme que existe um **registro A** para `aplicativo.acasamarcenaria.com.br` apontando para o **IP público da EC2** (ex.: 54.164.55.32). Sem isso o domínio não resolve.

### 2. Nginx na EC2

O Nginx precisa de um vhost para esse domínio. Na EC2:

```bash
# Ver se já existe algo para aplicativo
sudo grep -l "aplicativo" /etc/nginx/conf.d/*.conf 2>/dev/null

# Se não existir, criar a partir do exemplo (dentro do repositório acasa-erp)
cd ~/acasa-erp
sudo cp scripts/nginx-aplicativo.conf.example /etc/nginx/conf.d/aplicativo.conf
sudo nginx -t && sudo systemctl reload nginx
```

Se usar HTTPS com Let’s Encrypt:

```bash
sudo certbot --nginx -d aplicativo.acasamarcenaria.com.br
```

### 3. Conteúdo em /var/www/aplicativo

O pipeline (job `deploy:ec2`) já cria/atualiza:

- `index.html` e `downloads/index.html` (página de downloads)
- `erp/Acasa.apk`, `updates/android/version.json`, e envia `ponto.apk` para `/var/www/ponto/`

Para conferir na EC2:

```bash
ls -la /var/www/aplicativo/
ls -la /var/www/aplicativo/erp/
cat /var/www/aplicativo/updates/android/version.json
```

Se estiver vazio, rode o pipeline de novo (push na main) ou use o script completo no PC: `bash scripts/deploy-all.sh`.

### 4. Permissões

Tudo em `/var/www/aplicativo` deve ser legível pelo Nginx (ex.: `nginx:nginx`):

```bash
sudo chown -R nginx:nginx /var/www/aplicativo /var/www/ponto
```
