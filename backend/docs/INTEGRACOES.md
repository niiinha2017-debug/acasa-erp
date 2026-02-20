# Integrações e automação do ACASA ERP

APIs **100% grátis** (ou planos free) para notificações, e-mail, gráficos e workflows.

---

## 1. Telegram Bot API (notificações no celular)

**Uso:** Notificações de "Ponto Batido" e "Espelho de ponto disponível" direto no celular do gestor (ou funcionário).

**Configuração:**

1. Crie um bot no Telegram: fale com [@BotFather](https://t.me/BotFather), envie `/newbot`, defina nome e username.
2. Copie o **token** que o BotFather retorna.
3. Obtenha o **Chat ID** do gestor: envie qualquer mensagem ao seu bot; depois acesse no navegador:
   `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates` e veja o `chat.id` na resposta.
4. No `.env` do backend:

```env
TELEGRAM_BOT_TOKEN=123456:ABCdef...
TELEGRAM_CHAT_ID=-1001234567890
```

**Comportamento:**

- Quando um funcionário **bate ponto** (PWA), o gestor recebe: *"Ponto registrado – Nome – Entrada/Saída às HH:MM"*.
- Quando um **espelho de ponto mensal** é gerado (PDF salvo), o gestor recebe: *"Espelho de ponto disponível – Nome – Ref. MM/AAAA"*.

---

## 2. Brevo (ex-Sendinblue) – e-mail espelho de ponto

**Uso:** Até **300 e-mails por dia** grátis. Envio do espelho de ponto em PDF para o e-mail do colaborador.

**Configuração:**

1. Crie conta em [brevo.com](https://www.brevo.com).
2. Em **Configurações → Chaves de API**, crie uma chave (API v3).
3. No `.env`:

```env
BREVO_API_KEY=xkeysib-...
```

Se `BREVO_API_KEY` estiver definido, o envio de espelho de ponto usa a API do Brevo (com anexo PDF). Caso contrário, o sistema usa o SMTP já configurado (Gmail, etc.).

**Comportamento:**

- Ao gerar o PDF mensal do ponto (e salvar), se o funcionário tiver **e-mail** cadastrado, o sistema envia automaticamente o espelho em PDF para esse e-mail.

---

## 3. QuickChart – gráficos em imagem via URL

**Uso:** Gráficos de desempenho (ex.: horas trabalhadas no mês, DRE despesas) em **imagem** via URL, sem biblioteca pesada de JS. Ideal para relatórios em PDF, e-mail ou n8n.

**Configuração:** Nenhuma. O backend monta a URL e o QuickChart.io gera a imagem sob demanda.

**Endpoints (backend):**

- `GET /api/analytics/chart-url?type=dre-despesas&inicio=2025-01-01&fim=2025-12-31`  
  Retorna `{ url }` com imagem do gráfico de despesas por mês.
- `GET /api/analytics/chart-url?type=horas-trabalhadas&data_ini=2025-02-01&data_fim=2025-02-28`  
  Retorna `{ url }` com gráfico de horas por funcionário.
- `GET /api/analytics/chart-url?type=status-obras`  
  Retorna `{ url }` com gráfico de status de obras.

Parâmetros opcionais: `width`, `height` (ex.: `width=1200&height=600` para relatórios maiores).

**Frontend:** A tela **Relatórios → Horas Trabalhadas** já exibe o link da imagem QuickChart para copiar e usar em e-mail/PDF/n8n.

---

## 4. n8n (self-hosted) – workflows

**Uso:** Automações como: *"Toda vez que o ponto fechar, calcule o custo da hora extra e jogue no DRE"* ou *"Quando o relatório for gerado, envie para o gestor"*.

**Configuração:**

1. Instale o n8n (Docker ou npm): [n8n.io](https://n8n.io).
2. Crie um **Webhook** no n8n (trigger “Webhook”) e copie a URL.
3. No `.env` do backend:

```env
N8N_WEBHOOK_URL_PONTO_BATIDO=https://seu-n8n.com/webhook/ponto-batido
N8N_WEBHOOK_URL_RELATORIO=https://seu-n8n.com/webhook/relatorio-gerado
```

**Payload enviado pelo ERP:**

- **Ponto batido:**  
  `POST` com body JSON:  
  `{ "evento": "ponto_batido", "registro_id", "funcionario_id", "funcionario_nome", "tipo", "data_hora", "origem" }`
- **Relatório gerado:**  
  `POST` com body JSON:  
  `{ "evento": "relatorio_ponto_gerado", "funcionario_id", "funcionario_nome", "mes", "ano", "arquivo_id" }`

No n8n você pode encadear: receber webhook → buscar fechamento folha (HTTP Request para `GET /api/ponto/relatorio/fechamento`) → calcular custos → atualizar planilha/DRE, etc. Use **JWT** do usuário/serviço nas requisições ao backend quando precisar de dados adicionais.

---

## 5. PDF.co / CloudLayer (opcional)

Para **gerar PDFs a partir de HTML** (relatórios, holerites, espelhos mais elaborados), você pode usar:

- **PDF.co** ou **CloudLayer** (planos free).
- No n8n: após montar o HTML no workflow, chame a API deles para gerar o PDF e anexar no e-mail ou salvar.

O ERP já gera espelho de ponto em PDF com **pdfkit** no backend; essas APIs são opcionais para layouts HTML mais complexos.

---

## Resumo das variáveis de ambiente

| Variável | Uso |
|----------|-----|
| `TELEGRAM_BOT_TOKEN` | Token do bot Telegram |
| `TELEGRAM_CHAT_ID` | Chat para onde enviar notificações (gestor) |
| `N8N_WEBHOOK_URL_PONTO_BATIDO` | URL do webhook n8n para evento "ponto batido" |
| `N8N_WEBHOOK_URL_RELATORIO` | URL do webhook n8n para evento "relatório gerado" |
| `BREVO_API_KEY` | Chave API Brevo (espelho de ponto por e-mail) |
| `BREVO_SENDER_EMAIL` | (Opcional) E-mail remetente Brevo; senão usa `MAIL_USER` |

Todas são opcionais: se não estiverem definidas, o ERP continua funcionando; as notificações e envios extras simplesmente não são disparados.
