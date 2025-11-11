# 🔔 Sistema de Notificações Push - ZapCorte

## Visão Geral

Sistema completo de notificações push usando OneSignal para alertar barbeiros em tempo real quando um cliente agenda um horário.

## Funcionalidades

### ✅ Implementado

1. **Notificações Push em Tempo Real**
   - Alerta instantâneo quando cliente agenda
   - Funciona mesmo com app fechado (PWA)
   - Som de notificação personalizado
   - Logo do ZapCorte na notificação

2. **Página de Configuração**
   - Interface amigável para ativar notificações
   - Botão de teste de notificação
   - Status visual (ativo/inativo)
   - Instruções passo a passo

3. **Integração Automática**
   - Player ID salvo automaticamente no banco
   - Notificação enviada ao criar agendamento
   - Suporte a PWA instalado

## Como Funciona

### Para o Barbeiro

1. **Ativar Notificações**
   - Acessar: Dashboard → Notificações
   - Clicar em "Ativar Notificações"
   - Permitir notificações no navegador
   - Sistema salva automaticamente

2. **Receber Alertas**
   - Quando cliente agenda, notificação chega instantaneamente
   - Título: "🎉 Novo Agendamento!"
   - Mensagem: Nome do cliente, serviço, data e hora
   - Clique abre o painel de agendamentos

3. **Testar Sistema**
   - Botão "Testar Notificação" na página de configurações
   - Envia notificação de teste

### Para o Cliente

- Transparente - cliente não precisa fazer nada
- Ao agendar, sistema envia notificação automaticamente para o barbeiro

## Arquitetura Técnica

### Arquivos Principais

```
src/
├── lib/
│   ├── onesignal.ts          # Serviço OneSignal
│   └── notifications.ts       # Integração notificações + WhatsApp
├── pages/
│   └── NotificationSettings.tsx  # Página de configuração
└── components/
    └── DashboardSidebar.tsx   # Link no menu

public/
└── OneSignalSDKWorker.js      # Service Worker
```

### Fluxo de Notificação

```
Cliente Agenda
    ↓
createAppointment()
    ↓
Busca player_id do barbeiro
    ↓
sendNewAppointmentNotification()
    ↓
OneSignal API
    ↓
Push Notification → Barbeiro
```

## Configuração

### Variáveis de Ambiente

```env
VITE_ONESIGNAL_APP_ID=seu-app-id
VITE_ONESIGNAL_REST_API_KEY=sua-rest-api-key
```

### OneSignal Dashboard

1. Criar conta em https://onesignal.com
2. Criar novo app Web Push
3. Configurar:
   - Site URL: https://zapcorte.com
   - Auto Resubscribe: Enabled
   - Default Notification Icon: Logo ZapCorte

## Banco de Dados

### Tabela: barbershops

```sql
ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS player_id TEXT;

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_barbershops_player_id 
ON barbershops(player_id);
```

## API OneSignal

### Endpoint de Envio

```
POST https://onesignal.com/api/v1/notifications
Authorization: Basic {REST_API_KEY}
```

### Payload

```json
{
  "app_id": "...",
  "include_player_ids": ["player-id"],
  "headings": { "pt": "🎉 Novo Agendamento!" },
  "contents": { "pt": "João agendou Corte para hoje às 14:00" },
  "url": "https://zapcorte.com/appointments",
  "chrome_web_icon": "https://zapcorte.com/logo.png",
  "ios_sound": "notification.wav",
  "android_sound": "notification",
  "priority": 10
}
```

## Testes

### Teste Manual

1. Acesse `/dashboard/notifications`
2. Ative as notificações
3. Clique em "Testar Notificação"
4. Verifique se recebeu

### Teste Real

1. Abra página pública da barbearia
2. Faça um agendamento
3. Barbeiro deve receber notificação instantânea

## Troubleshooting

### Notificação não chega

1. **Verificar permissão do navegador**
   - Chrome: Configurações → Privacidade → Notificações
   - Verificar se site está permitido

2. **Verificar Player ID**
   - Deve estar salvo na tabela `barbershops`
   - Verificar em `/dashboard/notifications`

3. **Verificar variáveis de ambiente**
   - `VITE_ONESIGNAL_APP_ID` configurado
   - `VITE_ONESIGNAL_REST_API_KEY` configurado

4. **Verificar console do navegador**
   - Procurar por erros do OneSignal
   - Verificar se SDK foi carregado

### Service Worker não registra

1. **HTTPS obrigatório**
   - OneSignal só funciona em HTTPS
   - Localhost é permitido para testes

2. **Verificar arquivo**
   - `/public/OneSignalSDKWorker.js` deve existir
   - Deve ser acessível em `/OneSignalSDKWorker.js`

## Melhorias Futuras

- [ ] Notificações de cancelamento
- [ ] Notificações de reagendamento
- [ ] Personalização de som
- [ ] Agrupamento de notificações
- [ ] Estatísticas de entrega
- [ ] Notificações programadas (lembretes)

## Suporte

Para problemas com OneSignal:
- Documentação: https://documentation.onesignal.com/docs/web-push-quickstart
- Dashboard: https://app.onesignal.com

## Changelog

### v1.0.0 (2024-11-11)
- ✅ Sistema de notificações push implementado
- ✅ Página de configuração criada
- ✅ Integração com agendamentos
- ✅ Testes funcionando
- ✅ Documentação completa
