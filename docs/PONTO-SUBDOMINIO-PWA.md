# Ponto: abrir landing (e APK) em vez do PWA no celular

Se ao abrir **ponto.acasamarcenaria.com.br** no celular ainda aparece o PWA do relógio em vez da página de ativação + "Baixar APK", faça o seguinte.

---

## 1. No celular: desinstalar o PWA (relógio) instalado

Quando o Ponto era só PWA, você pode ter **adicionado à tela inicial** ou **instalado como app**. O sistema continua abrindo essa versão em vez do site.

**Android:**
- **Configurações** → **Aplicativos** → procure por **"Ponto"**, **"A CASA Ponto"** ou pelo nome do navegador (Chrome, etc.) se o PWA estiver como atalho.
- Se aparecer um app do Ponto: **Desinstalar** ou **Remover**.
- No **Chrome**: menu (⋮) → **Apps instalados** / **Página inicial** → remova o Ponto se estiver listado.

**iPhone (Safari):**
- Segure o ícone do Ponto na tela inicial → **Remover App** → **Remover**.

Depois, abra de novo no navegador: **https://ponto.acasamarcenaria.com.br** (sem instalar). Deve aparecer a landing (código de ativação + botão Baixar APK).

---

## 2. No servidor: conferir o que o subdomínio está servindo

O vhost **ponto.acasamarcenaria.com.br** deve apontar para **uma pasta que tenha só**:

- **index.html** = nossa landing (ativação + Baixar APK), vinda do `aplicativo-site/index-ponto.html`
- **ponto.apk** = arquivo do app

**Não** deve haver build do Vue (frontend-ponto/dist) nessa pasta, senão o navegador pode servir o PWA.

**O que verificar no servidor (SSH):**

```bash
ls -la /var/www/ponto/
```

Deve ter algo como:

- `index.html` (a landing)
- `ponto.apk`

Se existir pasta `assets`, `index-*.js`, ou vários arquivos do build do Vue, **remova** (ou mova para outro lugar) e deixe só `index.html` e `ponto.apk`. O deploy (script ou GitHub Actions) já envia só a landing e o APK para `/var/www/ponto/`.

**Nginx:** o `root` do server block do Ponto deve ser exatamente essa pasta, por exemplo:

```nginx
server {
    server_name ponto.acasamarcenaria.com.br;
    root /var/www/ponto;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    # ... (SSL, etc.)
}
```

Assim, a raiz do subdomínio é a landing e **/ponto.apk** é o arquivo para download.

---

## 3. Limpar cache do navegador (se ainda abrir o PWA)

Depois de desinstalar o PWA e conferir o servidor:

- Abra **https://ponto.acasamarcenaria.com.br** em **aba anônima/privada**, ou
- No Chrome: **Configurações** → **Privacidade** → **Limpar dados de navegação** (cache e cookies do site).

Assim o celular carrega a landing nova em vez da versão antiga em cache.
