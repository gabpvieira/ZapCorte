# 🔔 Sistema de Notificações Web Push Nativo

## Visão Geral

Sistema de notificações push usando **Web Push API + VAPID** (nativo do navegador).

### ✅ Vantagens

- **Gratuito** - Sem custos de terceiros
- **Nativo** - API padrão do navegador
- **Controle Total** - Sem dependências externas
- **Privacidade** - Dados ficam no seu servidor
- **Simples** - Menos complexidade

## Arquitetura

```
Cliente (PWA)
    ↓
Service Worker (/sw.js)
    ↓
Web Push API
    ↓
Servidor Node.js (/server/pushNotifications.js)
    ↓
Supabase (armazena subscriptions)
```

## Componentes

### 1. Frontend

**Service Worker** (`/public/sw.js`)
- Recebe notificações push
- Exibe notificações ao usuário
- Gerencia cliques nas notificações

**Cliente** (`/src/lib/webpush.ts`)
- Solicita permissão
- Cria subscription
- Salva no banco de dados

**Página de Configuração** (`/src/pages/NotificationSettings.tsx`)
- Interface para ativar/desativar
- Botão de teste
- Status visual

### 2. Backend

**Servidor** (`/server/pushNotifications.js`)
- Envia notificações via web-push
- Usa chaves VAPID
- Formata payload

**API** (`/server/api/send-notification.js`)
- Endpoint para enviar notificações
- Busca subscription do banco
- Chama servidor de push

### 3. Banco de Dados

**Tabela: barbershops**
```sql
push_subscription JSONB
```

Armazena o objeto de subscription:
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

## Chaves VAPID

### Public Key (Frontend)
```
BKgmKhuhrgdKq_1htzMDYWUKt4DjAU1EyP5iFGTdjv9HT4L9t_qt9pa_j3J95uE2FKiqO1LKc7dfV8-cYPB5law
```

### Private Key (Backend - NUNCA expor)
```
dlMUU4XLFxaZk7NvJg3zqmcChMrat5FhKdIH2YHqVPs
```

## Fluxo de Uso

### 1. Barbeiro Ativa Notificações

1. Acessa `/dashboard/notifications`
2. Clica em "Ativar Notificações"
3. Navegador solicita permissão
4. Sistema cria subscription
5. Subscription salva no banco

### 2. Cliente Agenda

1. Cliente faz agendamento
2. Sistema chama `/api/send-notification`
3. API busca subscription do barbeiro
4. Envia notificação via web-push
5. Service Worker recebe
6. Notificação aparece no dispositivo

## Instalação

### 1. Instalar Dependências

```bash
cd server
npm install web-push
```

### 2. Executar Migration

```sql
-- No Supabase SQL Editor
ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS push_subscription JSONB;
```

### 3. Deploy

O sistema já está pronto para deploy no Vercel!

## Teste Local

### 1. Iniciar Servidor

```bash
npm run dev
```

### 2. Ativar Notificações

1. Acesse: `http://localhost:5173/dashboard/notifications`
2. Clique em "Ativar Notificações"
3. Permita no navegador

### 3. Testar

Clique em "Testar Notificação" ou faça um agendamento real.

## Compatibilidade

### ✅ Suportado

- Chrome/Edge (Desktop & Mobile)
- Firefox (Desktop & Mobile)
- Safari 16+ (Desktop & Mobile)
- Opera
- Samsung Internet

### ❌ Não Suportado

- Safari < 16
- Internet Explorer
- Navegadores muito antigos

## Troubleshooting

### Notificação não chega

1. **Verificar permissão**
   - Chrome: `chrome://settings/content/notifications`
   - Verificar se site está permitido

2. **Verificar subscription**
   - Deve estar salva na tabela `barbershops`
   - Coluna `push_subscription` não deve ser null

3. **Verificar Service Worker**
   - Chrome DevTools → Application → Service Workers
   - Deve estar "activated and running"

### Service Worker não registra

1. **HTTPS obrigatório**
   - Produção: Vercel já usa HTTPS
   - Local: localhost é permitido

2. **Verificar arquivo**
   - `/public/sw.js` deve existir
   - Deve ser acessível em `/sw.js`

## Segurança

### Chaves VAPID

- **Public Key**: Pode ser exposta (vai para o frontend)
- **Private Key**: NUNCA expor (apenas no servidor)

### Subscription

- Armazenada de forma segura no Supabase
- Apenas o barbeiro pode ver/editar sua própria subscription
- RLS (Row Level Security) protege os dados

## Custos

### Totalmente Gratuito! 🎉

- Sem limites de notificações
- Sem custos de terceiros
- Apenas custos de infraestrutura (Vercel/Supabase)

## Melhorias Futuras

- [ ] Notificações de cancelamento
- [ ] Notificações de reagendamento
- [ ] Personalização de som
- [ ] Agrupamento de notificações
- [ ] Notificações programadas
- [ ] Estatísticas de entrega

## Documentação

- Web Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- web-push library: https://github.com/web-push-libs/web-push
- VAPID: https://tools.ietf.org/html/rfc8292

## Suporte

Para problemas:
1. Verificar console do navegador
2. Verificar logs do servidor
3. Testar em modo incógnito
4. Limpar cache e service workers

## Changelog

### v2.0.0 (2024-11-11)
- ✅ Migrado de OneSignal para Web Push nativo
- ✅ Sistema totalmente gratuito
- ✅ Controle total sobre notificações
- ✅ Sem dependências de terceiros
- ✅ Mais simples e confiável
