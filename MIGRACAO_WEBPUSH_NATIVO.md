# 🔄 Migração: OneSignal → Web Push Nativo

## ✅ Alterações Realizadas

### 1. Tabela `barbershops`

#### Removido:
- ❌ `player_id` (coluna do OneSignal)

#### Adicionado:
- ✅ `push_subscription` (jsonb) - Objeto de subscription do Web Push API
- ✅ `push_enabled` (boolean) - Flag indicando se push está habilitado (default: false)
- ✅ `push_last_updated` (timestamp) - Data da última atualização da subscription

#### Índices:
- ✅ `idx_barbershops_push_enabled` - Otimiza consultas de barbearias com push habilitado

### 2. Nova Tabela `push_notifications`

Tabela para histórico e rastreamento de notificações enviadas:

```sql
CREATE TABLE push_notifications (
  id uuid PRIMARY KEY,
  barbershop_id uuid NOT NULL,
  appointment_id uuid,
  title text NOT NULL,
  body text NOT NULL,
  icon text,
  badge text,
  data jsonb,
  status varchar(20) DEFAULT 'pending',
  sent_at timestamp,
  clicked_at timestamp,
  error_message text,
  created_at timestamp DEFAULT now()
);
```

#### Status possíveis:
- `pending` - Aguardando envio
- `sent` - Enviada com sucesso
- `failed` - Falha no envio
- `clicked` - Usuário clicou na notificação

#### Índices:
- `idx_push_notifications_barbershop` - Por barbearia
- `idx_push_notifications_appointment` - Por agendamento
- `idx_push_notifications_status` - Por status
- `idx_push_notifications_created_at` - Por data (DESC)

### 3. Políticas RLS

#### `push_notifications`:
- ✅ Barbeiros veem apenas notificações de sua barbearia
- ✅ Sistema pode inserir notificações
- ✅ Sistema pode atualizar notificações

## 📊 Estrutura do `push_subscription`

O campo `push_subscription` armazena o objeto retornado pela Web Push API:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "expirationTime": null,
  "keys": {
    "p256dh": "BNcRd...",
    "auth": "tBHI..."
  }
}
```

## 🔧 Como Usar

### 1. Salvar Subscription

```typescript
// No frontend, após usuário permitir notificações
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY
});

// Salvar no Supabase
await supabase
  .from('barbershops')
  .update({
    push_subscription: subscription.toJSON(),
    push_enabled: true,
    push_last_updated: new Date().toISOString()
  })
  .eq('id', barbershopId);
```

### 2. Enviar Notificação

```typescript
// No backend
import webpush from 'web-push';

// Buscar subscription
const { data: barbershop } = await supabase
  .from('barbershops')
  .select('push_subscription')
  .eq('id', barbershopId)
  .single();

if (barbershop?.push_subscription) {
  // Enviar notificação
  await webpush.sendNotification(
    barbershop.push_subscription,
    JSON.stringify({
      title: 'Novo Agendamento',
      body: 'João agendou um corte para hoje às 14h',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: { appointmentId: '...' }
    })
  );

  // Registrar no histórico
  await supabase
    .from('push_notifications')
    .insert({
      barbershop_id: barbershopId,
      appointment_id: appointmentId,
      title: 'Novo Agendamento',
      body: 'João agendou um corte para hoje às 14h',
      status: 'sent',
      sent_at: new Date().toISOString()
    });
}
```

### 3. Consultar Histórico

```typescript
// Buscar notificações enviadas
const { data: notifications } = await supabase
  .from('push_notifications')
  .select('*')
  .eq('barbershop_id', barbershopId)
  .order('created_at', { ascending: false })
  .limit(50);
```

## 🎯 Benefícios

1. **Sem Dependências Externas**: Não depende mais do OneSignal
2. **Controle Total**: Gerenciamento completo das notificações
3. **Histórico Completo**: Rastreamento de todas as notificações
4. **Performance**: Índices otimizados para consultas rápidas
5. **Segurança**: RLS configurado corretamente
6. **Custo Zero**: Sem custos de serviços terceiros

## 📝 Próximos Passos

1. ✅ Migração do banco de dados concluída
2. ⏳ Atualizar código frontend para usar Web Push API
3. ⏳ Atualizar código backend para enviar notificações
4. ⏳ Implementar service worker
5. ⏳ Testar em produção

## 🔗 Arquivos Relacionados

- `migrations/migration_webpush_nativo.sql` - Script de migração
- `SISTEMA_WEBPUSH_NATIVO.md` - Documentação completa do sistema
- `server/pushNotifications.js` - Implementação do backend (a atualizar)

## ⚠️ Notas Importantes

- A coluna `player_id` foi removida permanentemente
- Dados antigos do OneSignal não foram migrados (não são compatíveis)
- Usuários precisarão permitir notificações novamente
- Subscriptions podem expirar e precisam ser renovadas
