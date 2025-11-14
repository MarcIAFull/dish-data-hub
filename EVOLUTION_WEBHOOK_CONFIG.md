# Configuração do Webhook Evolution API

## ❌ Problema Identificado

A edge function não está recebendo as mensagens dos usuários porque o evento `MESSAGES_UPSERT` não está habilitado no webhook da Evolution API.

**Eventos recebidos atualmente:**
- ✅ `send.message` - Quando o bot envia mensagens
- ✅ `messages.update` - Atualizações de status de mensagens
- ✅ `chats.upsert` - Informações de chats
- ❌ `messages.upsert` - **MENSAGENS RECEBIDAS (FALTA HABILITAR)**

## ✅ Solução

Você precisa atualizar a configuração do webhook da instância Evolution API para incluir o evento `MESSAGES_UPSERT`.

### Opção 1: Via Painel Evolution API

1. Acesse o painel da Evolution API: `https://evolution.fullbpo.com`
2. Localize a instância: `convergy`
3. Vá em Configurações → Webhooks
4. Certifique-se que os seguintes eventos estão **HABILITADOS**:
   - ✅ `MESSAGES_UPSERT` ← **CRÍTICO**
   - ✅ `MESSAGES_UPDATE`
   - ✅ `SEND_MESSAGE`
   - ✅ `CONNECTION_UPDATE`

### Opção 2: Via API

Envie uma requisição para atualizar o webhook:

```bash
curl -X PUT \
  https://evolution.fullbpo.com/webhook/set/convergy \
  -H 'Content-Type: application/json' \
  -H 'apikey: E6A5A385961A-433C-8A5C-9DD5886403E8' \
  -d '{
  "enabled": true,
  "url": "https://wsyddfdfzfkhkkxmrmxf.supabase.co/functions/v1/enhanced-ai-webhook",
  "events": [
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "SEND_MESSAGE",
    "CONNECTION_UPDATE"
  ]
}'
```

## 🔍 Como Verificar

Após configurar, envie uma mensagem de teste no WhatsApp e verifique os logs:

```bash
# Você deve ver logs com:
event: "messages.upsert"
data.message.conversation: "sua mensagem aqui"
```

## 📊 Estrutura do Evento MESSAGES_UPSERT

Quando configurado corretamente, o webhook receberá:

```json
{
  "event": "messages.upsert",
  "instance": "convergy",
  "data": {
    "key": {
      "remoteJid": "5532XXXXXXXX@s.whatsapp.net",
      "fromMe": false,
      "id": "MESSAGE_ID"
    },
    "message": {
      "conversation": "quero um hambúrguer"
    },
    "messageType": "conversation",
    "messageTimestamp": 1763136000
  }
}
```

## 🐛 Debug Adicional

Se após configurar ainda não funcionar:

1. **Verifique a URL do webhook** está correta:
   ```
   https://wsyddfdfzfkhkkxmrmxf.supabase.co/functions/v1/enhanced-ai-webhook
   ```

2. **Teste o webhook manualmente**:
   ```bash
   curl -X GET 'https://wsyddfdfzfkhkkxmrmxf.supabase.co/functions/v1/enhanced-ai-webhook'
   # Deve retornar: {"status":"Webhook is active"}
   ```

3. **Verifique os logs da Evolution API** para ver se há erros ao enviar o webhook
