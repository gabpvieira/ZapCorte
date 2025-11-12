# 🔔 Integração com n8n via Webhook

## 📋 Mudança Implementada

**Removido:** Sistema de notificações push nativo  
**Implementado:** Webhook para n8n + WhatsApp API

## 🎯 Como Funciona

### Fluxo de Notificação

```
Cliente Agenda
    ↓
Sistema ZapCorte
    ↓
POST para Webhook n8n
    ↓
n8n processa
    ↓
Envia WhatsApp via API
    ↓
Barbeiro recebe mensagem
```

## 📡 Webhook Endpoint

```
URL: https://n8nwebhook.chatifyz.com/webhook/zapcorte-lembrentes
Method: POST
Content-Type: application/json
```

## 📦 Payload Enviado

```json
{
  // Dados do cliente
  "customerName": "João Silva",
  "customerPhone": "11999999999",
  
  // Dados do agendamento
  "serviceName": "Corte de Cabelo",
  "scheduledDate": "12/11/2025",
  "scheduledTime": "14:30",
  "scheduledDateTime": "2025-11-12T14:30:00.000Z",
  
  // Dados da barbearia
  "barbershopId": "uuid-da-barbearia",
  "barbershopName": "Barbearia do João",
  "barbershopPhone": "11988888888",
  
  // Timestamp
  "timestamp": "2025-11-11T20:00:00.000Z"
}
```

## 🔧 Implementação

### Arquivo: `src/lib/notifications.ts`

```typescript
export async function notificarNovoAgendamento({
  barbershopId,
  customerName,
  scheduledAt,
  customerPhone,
  serviceName,
}) {
  // Busca dados da barbearia
  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('whatsapp_number, name')
    .eq('id', barbershopId)
    .single();

  // Formata data e hora
  const date = new Date(scheduledAt);
  const dataFormatada = format(date, "dd/MM/yyyy");
  const horaFormatada = format(date, "HH:mm");

  // Envia para webhook n8n
  await fetch('https://n8nwebhook.chatifyz.com/webhook/zapcorte-lembrentes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName,
      customerPhone,
      serviceName,
      scheduledDate: dataFormatada,
      scheduledTime: horaFormatada,
      scheduledDateTime: scheduledAt,
      barbershopId,
      barbershopName: barbershop.name,
      barbershopPhone: barbershop.whatsapp_number,
      timestamp: new Date().toISOString(),
    }),
  });
}
```

## 🧪 Como Testar

### 1. Criar um Agendamento
```
1. Acesse a página de booking
2. Preencha os dados
3. Confirme o agendamento
```

### 2. Verificar Logs
```
Console do navegador:
📨 Enviando para webhook n8n: {...}
✅ Webhook n8n enviado com sucesso
```

### 3. Verificar n8n
```
1. Acesse seu workflow n8n
2. Veja o webhook sendo recebido
3. Verifique os dados
```

### 4. Verificar WhatsApp
```
O barbeiro deve receber mensagem no WhatsApp
com os dados do agendamento
```

## 📊 Variáveis Disponíveis no n8n

| Variável | Tipo | Exemplo | Descrição |
|----------|------|---------|-----------|
| `customerName` | string | "João Silva" | Nome do cliente |
| `customerPhone` | string | "11999999999" | Telefone do cliente |
| `serviceName` | string | "Corte de Cabelo" | Nome do serviço |
| `scheduledDate` | string | "12/11/2025" | Data formatada (dd/MM/yyyy) |
| `scheduledTime` | string | "14:30" | Hora formatada (HH:mm) |
| `scheduledDateTime` | string | "2025-11-12T14:30:00.000Z" | Data/hora ISO |
| `barbershopId` | string | "uuid..." | ID da barbearia |
| `barbershopName` | string | "Barbearia do João" | Nome da barbearia |
| `barbershopPhone` | string | "11988888888" | Telefone da barbearia |
| `timestamp` | string | "2025-11-11T20:00:00.000Z" | Timestamp do envio |

## 🎨 Exemplo de Mensagem WhatsApp

```
🎉 Novo Agendamento!

Cliente: João Silva
Telefone: (11) 99999-9999

Serviço: Corte de Cabelo
Data: 12/11/2025
Horário: 14:30

Barbearia: Barbearia do João
```

## 🔄 Workflow n8n Sugerido

```
1. Webhook Trigger
   ↓
2. Set Variables
   ↓
3. Format Message
   ↓
4. WhatsApp API Call
   ↓
5. Log Success/Error
```

## ✅ Vantagens

- ✅ Mais confiável que push nativo
- ✅ Funciona em qualquer dispositivo
- ✅ Não depende de permissões do navegador
- ✅ Mensagem direta no WhatsApp
- ✅ Fácil de customizar no n8n
- ✅ Logs centralizados
- ✅ Retry automático (n8n)

## 🗑️ O Que Foi Removido

- ❌ Página `/dashboard/notifications`
- ❌ Arquivo `src/pages/NotificationSettings.tsx`
- ❌ Arquivo `src/lib/webpush.ts`
- ❌ Arquivo `api/send-notification.js`
- ❌ Arquivo `server/pushNotifications.js`
- ❌ Arquivo `public/sw.js` (Service Worker)
- ❌ Tabela `push_subscriptions` (pode manter ou remover)
- ❌ Tabela `push_notifications` (pode manter ou remover)

## 📝 Próximos Passos

### No n8n:
1. Criar workflow
2. Configurar webhook trigger
3. Adicionar nó de WhatsApp API
4. Testar envio
5. Ativar workflow

### No ZapCorte:
1. ✅ Webhook implementado
2. ✅ Dados sendo enviados
3. ⏳ Aguardar configuração n8n
4. ⏳ Testar integração completa

---

**Status:** ✅ Implementado  
**Data:** 2025-11-11  
**Webhook:** https://n8nwebhook.chatifyz.com/webhook/zapcorte-lembrentes
