# 🔔 Configuração do OneSignal

## Passo a Passo

### 1. Criar Conta no OneSignal

1. Acesse: https://onesignal.com
2. Clique em "Get Started Free"
3. Crie sua conta (pode usar Google/GitHub)

### 2. Criar Novo App

1. No dashboard, clique em "New App/Website"
2. Nome do app: **ZapCorte**
3. Selecione: **Web Push**

### 3. Configurar Web Push

#### 3.1 Site Setup

1. **Site Name:** ZapCorte
2. **Site URL:** 
   - Produção: `https://zapcorte.com`
   - Desenvolvimento: `http://localhost:5173`
3. **Auto Resubscribe:** ✅ Enabled
4. **Default Notification Icon:** Upload do logo ZapCorte

#### 3.2 Permission Prompt

1. **Prompt Type:** Slide Prompt (recomendado)
2. **Prompt Timing:** After 10 seconds
3. **Custom Text:**
   - Title: "Receber notificações de agendamentos?"
   - Message: "Seja alertado instantaneamente quando um cliente agendar"
   - Accept: "Sim, ativar"
   - Cancel: "Agora não"

### 4. Obter Credenciais

#### 4.1 App ID

1. No dashboard do OneSignal
2. Settings → Keys & IDs
3. Copie o **OneSignal App ID**

Exemplo: `12345678-1234-1234-1234-123456789012`

#### 4.2 REST API Key

1. Mesma página (Settings → Keys & IDs)
2. Copie o **REST API Key**

Exemplo: `YourRestApiKeyHere123456789`

### 5. Configurar no Vercel

#### 5.1 Adicionar Variáveis de Ambiente

1. Acesse: https://vercel.com/seu-projeto
2. Settings → Environment Variables
3. Adicione:

```
VITE_ONESIGNAL_APP_ID=seu-app-id-aqui
VITE_ONESIGNAL_REST_API_KEY=sua-rest-api-key-aqui
```

4. Selecione: Production, Preview, Development
5. Clique em "Save"

#### 5.2 Redeploy

1. Deployments → Latest Deployment
2. Clique nos 3 pontos → Redeploy
3. Aguarde o deploy finalizar

### 6. Configurar Domínio (Produção)

#### 6.1 Adicionar Domínio no OneSignal

1. Settings → All Browsers
2. Site Setup → Add Another Site
3. Adicione: `https://zapcorte.com`
4. Salve

#### 6.2 Verificar Service Worker

Certifique-se que o arquivo está acessível:
```
https://zapcorte.com/OneSignalSDKWorker.js
```

### 7. Testar Configuração

#### 7.1 Teste Local

1. Execute: `npm run dev`
2. Acesse: `http://localhost:5173/dashboard/notifications`
3. Clique em "Ativar Notificações"
4. Permita notificações no navegador
5. Clique em "Testar Notificação"
6. Verifique se recebeu

#### 7.2 Teste em Produção

1. Acesse: `https://zapcorte.com/dashboard/notifications`
2. Repita os passos acima

### 8. Configurações Avançadas (Opcional)

#### 8.1 Personalizar Ícone

1. Settings → All Browsers
2. Chrome Settings → Notification Icons
3. Upload:
   - **Small Icon:** 192x192px (logo ZapCorte)
   - **Large Icon:** 512x512px (logo ZapCorte)

#### 8.2 Configurar Som

1. Settings → All Browsers
2. Chrome Settings → Notification Sound
3. Upload arquivo `.wav` ou `.mp3`

#### 8.3 Badge

1. Settings → All Browsers
2. Chrome Settings → Badge
3. Upload ícone 96x96px (monocromático)

### 9. Monitoramento

#### 9.1 Dashboard OneSignal

- **Delivery:** Ver notificações enviadas
- **Audience:** Ver usuários inscritos
- **Messages:** Histórico de mensagens

#### 9.2 Métricas Importantes

- **Subscribers:** Número de barbeiros com notificações ativas
- **Delivery Rate:** Taxa de entrega
- **Click Rate:** Taxa de cliques

### 10. Troubleshooting

#### Notificações não chegam

1. **Verificar variáveis de ambiente:**
   ```bash
   # No Vercel
   Settings → Environment Variables
   ```

2. **Verificar permissão do navegador:**
   - Chrome: `chrome://settings/content/notifications`
   - Verificar se site está permitido

3. **Verificar console:**
   ```javascript
   // Deve aparecer:
   [OneSignal] Inicializado com sucesso
   ```

4. **Verificar Player ID:**
   - Deve estar salvo na tabela `barbershops`
   - Coluna: `player_id`

#### Service Worker não registra

1. **Verificar HTTPS:**
   - OneSignal requer HTTPS (exceto localhost)

2. **Verificar arquivo:**
   ```bash
   # Deve existir e ser acessível:
   /public/OneSignalSDKWorker.js
   ```

3. **Limpar cache:**
   - Chrome DevTools → Application → Service Workers
   - Unregister e recarregar

#### Erro "App ID não configurado"

1. **Verificar .env:**
   ```bash
   VITE_ONESIGNAL_APP_ID=seu-app-id
   ```

2. **Reiniciar servidor:**
   ```bash
   npm run dev
   ```

3. **Verificar build:**
   ```bash
   npm run build
   ```

### 11. Limites do Plano Free

- ✅ **10.000 notificações/mês** (suficiente para começar)
- ✅ **Unlimited subscribers**
- ✅ **Basic analytics**
- ❌ **Advanced segmentation** (plano pago)
- ❌ **A/B testing** (plano pago)

### 12. Upgrade para Plano Pago (Futuro)

Quando atingir 10k notificações/mês:

1. **Growth Plan:** $9/mês
   - 30.000 notificações
   - Advanced segmentation
   - A/B testing

2. **Professional Plan:** $99/mês
   - 100.000 notificações
   - Priority support
   - Custom branding

### 13. Suporte

- **Documentação:** https://documentation.onesignal.com
- **Dashboard:** https://app.onesignal.com
- **Suporte:** support@onesignal.com

### 14. Checklist Final

- [ ] Conta OneSignal criada
- [ ] App Web Push configurado
- [ ] App ID copiado
- [ ] REST API Key copiado
- [ ] Variáveis adicionadas no Vercel
- [ ] Deploy realizado
- [ ] Teste local funcionando
- [ ] Teste em produção funcionando
- [ ] Ícones personalizados (opcional)
- [ ] Som personalizado (opcional)

## Pronto! 🎉

Agora o sistema de notificações está configurado e funcionando!

Barbeiros podem ativar em: **Dashboard → Notificações**
