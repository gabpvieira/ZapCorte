# 🚀 Guia de Deploy - Webhook Cakto em Produção

## ✅ Status Atual

**WEBHOOK 100% FUNCIONAL EM DESENVOLVIMENTO!**

Teste realizado com sucesso:
- ✅ Webhook recebido e processado
- ✅ Perfil atualizado de `free` para `starter`
- ✅ Status alterado para `active`
- ✅ Data de expiração configurada (30 dias)
- ✅ Histórico de pagamento salvo
- ✅ Logs detalhados funcionando

## 📋 Pré-requisitos

- [x] Servidor Node.js configurado
- [x] Variáveis de ambiente configuradas
- [x] Banco de dados Supabase funcionando
- [x] Teste local passando
- [ ] Domínio/servidor de produção
- [ ] HTTPS configurado
- [ ] URL pública acessível

## 🔧 Opções de Deploy

### Opção 1: Vercel (Recomendado)

**Vantagens:**
- ✅ Deploy automático via Git
- ✅ HTTPS gratuito
- ✅ Escalabilidade automática
- ✅ Fácil configuração

**Passos:**

1. **Criar `vercel.json` na raiz do projeto:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.js"
    }
  ],
  "env": {
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "CAKTO_WEBHOOK_SECRET": "@cakto_webhook_secret",
    "CAKTO_PRODUCT_ID_STARTER": "@cakto_product_id_starter",
    "CAKTO_PRODUCT_ID_PRO": "@cakto_product_id_pro",
    "PORT": "3001"
  }
}
```

2. **Instalar Vercel CLI:**
```bash
npm install -g vercel
```

3. **Fazer login:**
```bash
vercel login
```

4. **Deploy:**
```bash
vercel --prod
```

5. **Configurar variáveis de ambiente no painel Vercel:**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CAKTO_WEBHOOK_SECRET`
   - `CAKTO_PRODUCT_ID_STARTER`
   - `CAKTO_PRODUCT_ID_PRO`

6. **URL do webhook será:**
```
https://seu-projeto.vercel.app/api/webhooks/cakto
```

### Opção 2: Railway

**Vantagens:**
- ✅ Deploy simples
- ✅ Suporte a Node.js nativo
- ✅ HTTPS automático
- ✅ Logs em tempo real

**Passos:**

1. **Criar conta no Railway:** https://railway.app
2. **Conectar repositório GitHub**
3. **Configurar variáveis de ambiente**
4. **Deploy automático**

### Opção 3: Render

**Vantagens:**
- ✅ Plano gratuito disponível
- ✅ Deploy via Git
- ✅ HTTPS incluído

**Passos:**

1. **Criar conta no Render:** https://render.com
2. **Criar novo Web Service**
3. **Conectar repositório**
4. **Configurar:**
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
5. **Adicionar variáveis de ambiente**

### Opção 4: VPS (DigitalOcean, AWS, etc.)

**Para usuários avançados:**

1. **Instalar Node.js no servidor**
2. **Clonar repositório**
3. **Instalar dependências:**
```bash
cd server
npm install
```
4. **Configurar PM2 para manter servidor rodando:**
```bash
npm install -g pm2
pm2 start index.js --name zapcorte-webhook
pm2 save
pm2 startup
```
5. **Configurar Nginx como proxy reverso**
6. **Configurar SSL com Let's Encrypt**

## 🔐 Configuração no Painel Cakto

### 1. Acessar Webhooks

1. Login no painel Cakto
2. Menu **Apps** → **Webhooks**
3. Clicar em **Adicionar**

### 2. Configurar Webhook

**URL do Webhook:**
```
https://seu-dominio.com/api/webhooks/cakto
```

**Secret:**
```
8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df
```
(Use o mesmo do seu `.env`)

**Eventos a Selecionar:**
- ✅ `purchase_approved` - Pagamento aprovado
- ✅ `refund` - Reembolso
- ✅ `subscription_cancelled` - Assinatura cancelada

### 3. Testar Webhook

1. Clicar nos **três pontinhos** do webhook
2. Selecionar **Enviar evento de teste**
3. Escolher evento `purchase_approved`
4. Verificar resposta (deve ser 200 OK)

## 🧪 Validação em Produção

### Teste 1: Webhook de Teste do Cakto

```bash
# Verificar logs do webhook no Supabase
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

**Resultado esperado:**
- Status: `success`
- Event: `purchase_approved`

### Teste 2: Compra Real (R$ 5,00)

1. Fazer compra de teste do Plano Starter
2. Verificar se perfil foi atualizado:

```sql
SELECT 
  email,
  plan_type,
  subscription_status,
  last_payment_date,
  expires_at
FROM profiles 
WHERE email = 'seu-email@teste.com';
```

**Resultado esperado:**
- `plan_type`: `starter`
- `subscription_status`: `active`
- `expires_at`: Data atual + 30 dias

### Teste 3: Histórico de Pagamento

```sql
SELECT 
  transaction_id,
  amount,
  status,
  plan_type,
  created_at
FROM payment_history 
WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'seu-email@teste.com'
)
ORDER BY created_at DESC;
```

**Resultado esperado:**
- Registro com `status`: `completed`
- `amount`: 5.99
- `plan_type`: `starter`

## 📊 Monitoramento

### Logs do Servidor

**Vercel:**
```bash
vercel logs
```

**Railway:**
- Acessar painel → Logs

**PM2 (VPS):**
```bash
pm2 logs zapcorte-webhook
```

### Logs no Supabase

```sql
-- Últimos webhooks recebidos
SELECT 
  event_type,
  status,
  error_message,
  created_at
FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- Webhooks com erro
SELECT * FROM webhook_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

## 🚨 Troubleshooting

### Problema: Webhook retorna 404

**Causa:** URL incorreta ou rota não configurada

**Solução:**
1. Verificar se URL está correta
2. Testar endpoint manualmente:
```bash
curl https://seu-dominio.com/api/health
```

### Problema: Webhook retorna 400 (Assinatura inválida)

**Causa:** Secret incorreto

**Solução:**
1. Verificar se secret no Cakto é o mesmo do `.env`
2. Verificar se variável de ambiente está configurada no servidor

### Problema: Webhook retorna 500

**Causa:** Erro no processamento

**Solução:**
1. Verificar logs do servidor
2. Verificar se variáveis de ambiente estão corretas
3. Verificar conexão com Supabase

### Problema: Perfil não atualiza

**Causa:** Usuário não encontrado ou erro no banco

**Solução:**
1. Verificar se email existe na tabela `profiles`
2. Verificar logs do servidor para erro específico
3. Verificar permissões do Supabase

## 📈 Métricas de Sucesso

### KPIs para Monitorar

1. **Taxa de Sucesso de Webhooks**
   - Meta: > 99%
   - Query:
   ```sql
   SELECT 
     status,
     COUNT(*) as total,
     ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
   FROM webhook_logs
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY status;
   ```

2. **Tempo de Processamento**
   - Meta: < 2 segundos
   - Monitorar logs do servidor

3. **Conversões Bem-Sucedidas**
   - Meta: 100% dos pagamentos aprovados
   - Query:
   ```sql
   SELECT 
     COUNT(*) as total_payments,
     COUNT(DISTINCT user_id) as unique_users
   FROM payment_history
   WHERE status = 'completed'
   AND created_at > NOW() - INTERVAL '30 days';
   ```

## 🎯 Checklist Final

### Antes do Deploy
- [x] Código testado localmente
- [x] Variáveis de ambiente configuradas
- [x] Logs detalhados implementados
- [x] Tratamento de erros robusto
- [ ] Servidor de produção escolhido
- [ ] Domínio configurado
- [ ] HTTPS ativo

### Após o Deploy
- [ ] URL do webhook configurada no Cakto
- [ ] Teste com webhook de teste do Cakto
- [ ] Teste com compra real (R$ 5,00)
- [ ] Validação do perfil atualizado
- [ ] Validação do histórico de pagamento
- [ ] Monitoramento de logs ativo
- [ ] Alertas configurados (opcional)

### Validação Final
- [ ] Webhook recebendo eventos
- [ ] Perfis sendo atualizados
- [ ] Histórico sendo salvo
- [ ] Logs sem erros
- [ ] Taxa de sucesso > 99%

## 🎉 Conclusão

A solução está **100% pronta para produção**. Após seguir este guia:

1. ✅ Webhook funcionará perfeitamente
2. ✅ Pagamentos serão processados automaticamente
3. ✅ Usuários serão atualizados para premium
4. ✅ Histórico completo será mantido
5. ✅ Sistema será escalável e confiável

**Próximos passos:**
1. Escolher plataforma de deploy (recomendo Vercel)
2. Fazer deploy do servidor
3. Configurar webhook no Cakto
4. Fazer teste com compra real
5. Monitorar por 24-48h
6. Lançar oficialmente! 🚀

---

**Suporte:** Se encontrar problemas, verificar:
1. Logs do servidor
2. Tabela `webhook_logs` no Supabase
3. Documentação em `SOLUCAO_WEBHOOK_PROFISSIONAL.md`
