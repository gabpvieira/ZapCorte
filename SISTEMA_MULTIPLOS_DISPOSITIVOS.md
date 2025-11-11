# 📱 Sistema de Múltiplos Dispositivos

## 🎯 Objetivo

Permitir que notificações sejam enviadas para todos os dispositivos do usuário (computador, celular, tablet), independente de onde ele ativou as notificações.

## 🏗️ Arquitetura

### Antes (Sistema Antigo)
```
barbershops
├── push_subscription (jsonb) - UMA subscription por barbearia
└── push_enabled (boolean)
```

**Problema:** Apenas o último dispositivo que ativou recebia notificações.

### Depois (Sistema Novo)
```
push_subscriptions (nova tabela)
├── id (uuid)
├── barbershop_id (uuid) - FK para barbershops
├── subscription (jsonb) - Subscription do Web Push API
├── device_info (jsonb) - Informações do dispositivo
├── user_agent (text)
├── is_active (boolean)
├── last_used_at (timestamp)
└── created_at (timestamp)
```

**Solução:** Múltiplas subscriptions por barbearia, uma para cada dispositivo.

## 📊 Estrutura da Tabela

### push_subscriptions

```sql
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id uuid NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  device_info jsonb,
  user_agent text,
  is_active boolean DEFAULT true,
  last_used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### device_info (JSON)

```json
{
  "type": "mobile" | "tablet" | "desktop",
  "browser": "chrome" | "firefox" | "safari" | "edge",
  "platform": "Win32" | "MacIntel" | "Linux" | "iPhone" | "Android",
  "isMobile": true | false,
  "isTablet": true | false
}
```

## 🔄 Fluxo de Funcionamento

### 1. Usuário Ativa Notificações

```typescript
// Frontend detecta o dispositivo
const deviceInfo = {
  type: 'mobile',
  browser: 'chrome',
  platform: 'Android',
  isMobile: true,
  isTablet: false
};

// Salva subscription com info do dispositivo
await supabase.from('push_subscriptions').insert({
  barbershop_id: barbershopId,
  subscription: subscriptionData,
  device_info: deviceInfo,
  user_agent: navigator.userAgent,
  is_active: true
});
```

### 2. Sistema Envia Notificação

```javascript
// Backend busca TODAS as subscriptions ativas
const { data: subscriptions } = await supabase
  .from('push_subscriptions')
  .select('*')
  .eq('barbershop_id', barbershopId)
  .eq('is_active', true);

// Envia para TODOS os dispositivos
for (const sub of subscriptions) {
  await webpush.sendNotification(sub.subscription, payload);
}
```

### 3. Gerenciamento de Dispositivos

- **Atualização Automática:** Se o mesmo dispositivo ativar novamente, atualiza a subscription existente
- **Detecção de Falhas:** Se envio falhar (erro 410), marca como inativo
- **Limpeza Automática:** Remove subscriptions inativas há mais de 30 dias

## 🎨 Interface de Gerenciamento

### Página de Dispositivos (`/dashboard/devices`)

```
┌─────────────────────────────────────┐
│ Dispositivos Conectados             │
├─────────────────────────────────────┤
│ Total: 3 | Ativos: 2 | Inativos: 1 │
├─────────────────────────────────────┤
│ 📱 Mobile - Chrome                  │
│    Último uso: 11/11/2025 18:30    │
│    [Remover]                        │
├─────────────────────────────────────┤
│ 💻 Desktop - Firefox                │
│    Último uso: 11/11/2025 15:20    │
│    [Remover]                        │
└─────────────────────────────────────┘
```

## 🔧 Funções Principais

### Frontend (`webpush.ts`)

```typescript
// Detecta informações do dispositivo
function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  // ...
  return { type, browser, platform, isMobile, isTablet };
}

// Salva subscription (cria ou atualiza)
export async function saveSubscriptionToDatabase(
  barbershopId: string,
  subscription: PushSubscription
): Promise<boolean> {
  // Verifica se já existe pelo endpoint
  // Se existe: atualiza
  // Se não: cria nova
}
```

### Backend (`index.js`)

```javascript
// Envia para todos os dispositivos
app.post('/api/send-notification', async (req, res) => {
  // Busca todas subscriptions ativas
  const subscriptions = await getActiveSubscriptions(barbershopId);
  
  // Envia para cada uma
  for (const sub of subscriptions) {
    const result = await sendNotification(sub);
    
    if (result.success) {
      // Atualiza last_used_at
    } else if (result.error === '410') {
      // Marca como inativa
    }
  }
});
```

## 📈 Estatísticas e Monitoramento

### Métricas Importantes

1. **Taxa de Entrega por Dispositivo**
   ```sql
   SELECT 
     device_info->>'type' as device_type,
     COUNT(*) as total,
     SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active
   FROM push_subscriptions
   GROUP BY device_info->>'type';
   ```

2. **Dispositivos Inativos**
   ```sql
   SELECT COUNT(*) 
   FROM push_subscriptions 
   WHERE is_active = false;
   ```

3. **Último Uso por Dispositivo**
   ```sql
   SELECT 
     device_info->>'type' as device,
     MAX(last_used_at) as last_used
   FROM push_subscriptions
   WHERE is_active = true
   GROUP BY device_info->>'type';
   ```

## 🧹 Limpeza Automática

### Script de Limpeza (`cleanupSubscriptions.js`)

```javascript
// Remove subscriptions inativas há mais de 30 dias
await cleanupInactiveSubscriptions();

// Remove subscriptions não usadas há mais de 90 dias
await cleanupOldSubscriptions();
```

### Agendar Limpeza (Cron)

```javascript
// Executar diariamente às 3h da manhã
import cron from 'node-cron';

cron.schedule('0 3 * * *', async () => {
  await runCleanup();
});
```

## 🔒 Segurança

### Políticas RLS

```sql
-- Barbeiro vê apenas seus dispositivos
CREATE POLICY "Barbeiro vê subscriptions de sua barbearia"
ON push_subscriptions FOR SELECT
USING (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  )
);

-- Barbeiro pode remover seus dispositivos
CREATE POLICY "Barbeiro gerencia subscriptions"
ON push_subscriptions FOR ALL
USING (
  barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  )
);
```

## 🎯 Casos de Uso

### 1. Barbeiro com Celular e Computador

```
Cenário: Barbeiro ativa notificações no celular e no computador

Resultado:
- Novo agendamento → Notificação enviada para AMBOS
- Celular: Recebe notificação mesmo com app fechado
- Computador: Recebe notificação no navegador
```

### 2. Troca de Dispositivo

```
Cenário: Barbeiro troca de celular

Ação:
1. Ativa notificações no novo celular
2. Remove dispositivo antigo na página de gerenciamento

Resultado:
- Novo celular recebe notificações
- Celular antigo não recebe mais
```

### 3. Subscription Expirada

```
Cenário: Subscription do celular expira

Automático:
1. Sistema tenta enviar notificação
2. Recebe erro 410 (Gone)
3. Marca subscription como inativa
4. Continua enviando para outros dispositivos

Usuário:
- Precisa reativar notificações no celular
```

## 📊 Benefícios

1. **Cobertura Total:** Notificações chegam em todos os dispositivos
2. **Redundância:** Se um dispositivo falhar, outros ainda recebem
3. **Flexibilidade:** Usuário escolhe quais dispositivos quer usar
4. **Gerenciamento:** Interface para ver e remover dispositivos
5. **Limpeza Automática:** Remove subscriptions antigas automaticamente

## 🔗 Arquivos Relacionados

### Frontend
- `src/lib/webpush.ts` - Lógica de subscription
- `src/pages/DeviceManager.tsx` - Interface de gerenciamento
- `src/pages/NotificationSettings.tsx` - Ativação de notificações

### Backend
- `server/index.js` - Rota de envio
- `server/pushNotifications.js` - Lógica de push
- `server/cleanupSubscriptions.js` - Limpeza automática

### Banco de Dados
- `migrations/add_push_subscriptions_table.sql` - Criação da tabela

---

**Implementado em:** 2025-11-11  
**Status:** ✅ Funcional  
**Suporte:** Todos os navegadores modernos
