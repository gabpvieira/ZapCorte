# 🔧 Configuração: API de Notificações

## ✅ Alterações Realizadas

### 1. Servidor Backend (server/index.js)

Adicionada rota para envio de notificações push:

```javascript
POST /api/send-notification
```

**Funcionalidades:**
- ✅ Busca subscription da barbearia no Supabase
- ✅ Valida se notificações estão habilitadas
- ✅ Envia notificação via Web Push API
- ✅ Registra no histórico (tabela push_notifications)
- ✅ Suporta notificação de teste e de agendamento

**Payload:**
```json
{
  "barbershopId": "uuid",
  "customerName": "string (opcional)",
  "scheduledAt": "ISO date (opcional)",
  "serviceName": "string (opcional)"
}
```

### 2. Push Notifications Service (server/pushNotifications.js)

Convertido para ES modules e adicionadas funções:

- ✅ `sendPushNotification()` - Envia notificação genérica
- ✅ `sendNewAppointmentNotification()` - Notificação de agendamento
- ✅ `sendTestNotification()` - Notificação de teste

### 3. Frontend (src/lib/webpush.ts)

Atualizada função `sendTestNotification()`:
- ✅ Usa variável de ambiente `VITE_API_URL`
- ✅ Aponta para servidor backend correto
- ✅ Tratamento de erros melhorado

### 4. Variáveis de Ambiente

**Frontend (.env.local):**
```env
VITE_API_URL=http://localhost:3001
```

**Backend (server/.env):**
```env
SUPABASE_URL=https://ihwkbflhxvdsewifofdk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
```

## 🚀 Como Usar

### 1. Iniciar Servidor Backend

```bash
cd server
npm run dev
```

O servidor estará disponível em: `http://localhost:3001`

### 2. Iniciar Frontend

```bash
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

### 3. Testar Notificações

1. Acesse `/dashboard/notifications`
2. Clique em "Ativar Notificações"
3. Permita notificações no navegador
4. Clique em "Testar Notificação"
5. Você deve receber uma notificação!

## 📊 Fluxo de Notificação

```
Frontend (webpush.ts)
    ↓
    POST /api/send-notification
    ↓
Backend (index.js)
    ↓
    Busca subscription no Supabase
    ↓
Push Service (pushNotifications.js)
    ↓
    Web Push API
    ↓
Service Worker (sw.js)
    ↓
    Exibe notificação no navegador
```

## 🔍 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/health` | GET | Health check do servidor |
| `/api/plans` | GET | Informações dos planos |
| `/api/send-notification` | POST | Envia notificação push |
| `/api/webhooks/cakto` | POST | Webhook de pagamentos |

## 🧪 Testando a API

### Usando cURL:

```bash
curl -X POST http://localhost:3001/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "barbershopId": "seu-barbershop-id"
  }'
```

### Usando Postman/Insomnia:

```
POST http://localhost:3001/api/send-notification
Content-Type: application/json

{
  "barbershopId": "uuid-da-barbearia"
}
```

## ⚠️ Troubleshooting

### Erro 404 - Not Found
- ✅ Verifique se o servidor backend está rodando
- ✅ Confirme a URL em `VITE_API_URL`
- ✅ Verifique se a porta 3001 está disponível

### Erro 400 - Notificações não habilitadas
- ✅ Ative as notificações primeiro
- ✅ Verifique se `push_enabled = true` no banco
- ✅ Confirme se `push_subscription` existe

### Erro 500 - Erro ao enviar
- ✅ Verifique as chaves VAPID
- ✅ Confirme se o service worker está registrado
- ✅ Veja os logs do servidor para detalhes

## 📝 Logs do Servidor

O servidor exibe logs detalhados:

```
📨 Requisição de notificação recebida: { barbershopId: '...' }
✅ Notificação enviada com sucesso
```

## 🔗 Arquivos Relacionados

- `server/index.js` - Rotas da API
- `server/pushNotifications.js` - Serviço de push
- `src/lib/webpush.ts` - Cliente Web Push
- `public/sw.js` - Service Worker
- `.env.local` - Variáveis do frontend
- `server/.env` - Variáveis do backend

## 📦 Dependências

**Backend:**
- `web-push` - Envio de notificações
- `@supabase/supabase-js` - Cliente Supabase
- `express` - Framework web
- `cors` - CORS middleware

**Frontend:**
- Web Push API (nativo do navegador)
- Service Worker API (nativo do navegador)

---

**Status**: ✅ Configurado e Funcionando  
**Última Atualização**: 2025-11-11
