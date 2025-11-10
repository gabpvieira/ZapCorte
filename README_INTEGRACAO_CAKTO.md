# 🚀 ZapCorte Pro - Integração Cakto Completa

Sistema completo de agendamento para barbearias com integração de pagamentos Cakto.

## ✅ Status da Integração

**Última atualização:** 10/11/2025  
**Status:** ✅ 100% Funcional e Testado  
**Testes:** 7/7 Passaram com Sucesso

---

## 📋 O Que Foi Implementado

### 🔧 Correções Aplicadas:
- ✅ Servidor Express com webhook Cakto
- ✅ Validação robusta de assinatura
- ✅ Busca de usuário com fallback
- ✅ Atualização automática de planos
- ✅ Histórico completo de pagamentos
- ✅ Sistema de logs de webhook
- ✅ Suporte a múltiplos planos (Starter e Pro)
- ✅ Processamento de reembolsos
- ✅ Cancelamento de assinaturas
- ✅ Reativação após cancelamento

### 📊 Funcionalidades:
- ✅ Pagamento aprovado → Ativa plano automaticamente
- ✅ Reembolso → Volta para plano free
- ✅ Cancelamento → Cancela assinatura
- ✅ Múltiplos planos (Starter R$ 29,90 / Pro R$ 59,90)
- ✅ Logs de auditoria no Supabase
- ✅ Histórico completo de transações

---

## 🚀 Início Rápido

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/zap-corte-pro.git
cd zap-corte-pro
```

### 2. Instalar Dependências

**Frontend:**
```bash
npm install
```

**Backend (Servidor de Webhooks):**
```bash
cd server
npm install
```

### 3. Configurar Variáveis de Ambiente

**Frontend (`.env.local`):**
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key
VITE_CAKTO_CHECKOUT_STARTER=https://pay.cakto.com.br/seu_product_id_starter
VITE_CAKTO_CHECKOUT_PRO=https://pay.cakto.com.br/seu_product_id_pro
```

**Backend (`server/.env`):**
```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
CAKTO_WEBHOOK_SECRET=seu_webhook_secret
CAKTO_PRODUCT_ID_STARTER=seu_product_id_starter
CAKTO_PRODUCT_ID_PRO=seu_product_id_pro
PORT=3001
```

### 4. Iniciar Servidor de Webhooks
```bash
cd server
npm start
```

### 5. Configurar ngrok (Desenvolvimento)
```bash
# Instalar ngrok
# Download: https://ngrok.com/download

# Configurar authtoken
ngrok config add-authtoken SEU_AUTHTOKEN

# Expor servidor
ngrok http 3001
```

### 6. Configurar Webhook na Cakto
1. Acesse: https://cakto.com.br/dashboard
2. Vá em: Configurações > Webhooks
3. Configure:
   - **URL:** `https://sua-url.ngrok.io/api/webhooks/cakto`
   - **Secret:** Seu webhook secret
   - **Eventos:** purchase_approved, refund, subscription_cancelled

---

## 🧪 Testar a Integração

### Teste Local:
```bash
cd server
node test-webhook.js
```

### Teste com URL Pública:
```bash
node test-webhook.js https://sua-url.ngrok.io
```

### Teste Plano Pro:
```bash
node test-webhook.js http://localhost:3001 pro
```

---

## 📚 Documentação Completa

### Guias Principais:
1. **RESUMO_FINAL_CORRECOES.md** - Resumo completo das correções
2. **RELATORIO_TESTES_COMPLETO.md** - Relatório detalhado dos testes
3. **CAKTO_WEBHOOK_FIX.md** - Guia completo de configuração
4. **COMANDOS_RAPIDOS.md** - Comandos úteis
5. **CONFIGURAR_NGROK.md** - Como configurar o ngrok

### Guias Técnicos:
- **CORRECOES_APLICADAS.md** - Detalhes técnicos das correções
- **NOTA_SOBRE_PRECOS.md** - Como configurar preços
- **server/START_SERVER.md** - Guia de inicialização do servidor

---

## 🏗️ Estrutura do Projeto

```
zap-corte-pro-main/
├── server/                      # Servidor de webhooks
│   ├── index.js                # Servidor Express
│   ├── caktoService.js         # Lógica do Cakto
│   ├── test-webhook.js         # Script de teste
│   ├── .env.example            # Exemplo de variáveis
│   └── package.json            # Dependências
├── src/                        # Frontend React
│   ├── components/             # Componentes
│   ├── hooks/                  # Hooks customizados
│   ├── lib/                    # Bibliotecas
│   └── pages/                  # Páginas
├── migrations/                 # Migrations do Supabase
└── docs/                       # Documentação
```

---

## 🔧 Tecnologias Utilizadas

### Frontend:
- React + TypeScript
- Vite
- TailwindCSS
- Shadcn/ui
- React Router

### Backend:
- Node.js + Express
- Supabase (PostgreSQL)
- Cakto (Pagamentos)

### Infraestrutura:
- ngrok (Desenvolvimento)
- Railway/Vercel (Produção)

---

## 📊 Banco de Dados

### Tabelas Principais:

**profiles:**
- Informações do usuário
- Tipo de plano (free, starter, pro)
- Status da assinatura
- Data de expiração

**payment_history:**
- Histórico completo de transações
- Transaction IDs
- Valores e status
- Dados do webhook

**webhook_logs:**
- Logs de auditoria
- Eventos recebidos
- Status de processamento

---

## 🎯 Fluxos Implementados

### Pagamento Aprovado:
```
1. Cakto envia webhook → purchase_approved
2. Servidor valida assinatura
3. Busca usuário por email
4. Atualiza plano para starter/pro
5. Salva histórico de pagamento
6. Registra log de webhook
7. Retorna sucesso
```

### Reembolso:
```
1. Cakto envia webhook → refund
2. Servidor valida assinatura
3. Busca usuário
4. Volta plano para free
5. Cancela assinatura
6. Registra reembolso (valor negativo)
7. Retorna sucesso
```

### Cancelamento:
```
1. Cakto envia webhook → subscription_cancelled
2. Servidor valida assinatura
3. Busca usuário
4. Cancela assinatura
5. Volta para plano free
6. Registra cancelamento
7. Retorna sucesso
```

---

## 🧪 Testes Realizados

✅ **7 Testes Executados - 100% de Sucesso:**

1. Health Check - ✅ PASSOU
2. Webhook Starter (R$ 29,90) - ✅ PASSOU
3. Webhook Pro (R$ 59,90) - ✅ PASSOU
4. Reembolso - ✅ PASSOU
5. Reativação - ✅ PASSOU
6. Cancelamento - ✅ PASSOU
7. Logs e Histórico - ✅ PASSOU

**Relatório completo:** Ver `RELATORIO_TESTES_COMPLETO.md`

---

## 🚀 Deploy em Produção

### Opção 1: Railway (Recomendado)
1. Criar conta: https://railway.app
2. Conectar GitHub
3. Deploy automático
4. Configurar variáveis de ambiente
5. Obter URL pública
6. Configurar na Cakto

### Opção 2: Vercel
1. Instalar CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Configurar variáveis de ambiente
4. Obter URL pública
5. Configurar na Cakto

---

## 🆘 Suporte e Troubleshooting

### Problemas Comuns:

**Erro: "Assinatura inválida"**
- Verificar CAKTO_WEBHOOK_SECRET no .env
- Confirmar secret na Cakto

**Erro: "Usuário não encontrado"**
- Verificar se o email existe no banco
- Verificar tabela profiles

**Erro: "Erro ao atualizar perfil"**
- Código agora detecta automaticamente (corrigido ✅)

**Servidor não inicia:**
```bash
cd server
npm install
npm start
```

### Logs Úteis:
```bash
# Ver logs do servidor
cd server
npm start

# Testar webhook
node test-webhook.js

# Verificar porta
netstat -ano | findstr :3001
```

---

## 📞 Links Úteis

- **Cakto Dashboard:** https://cakto.com.br/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **ngrok Dashboard:** https://dashboard.ngrok.com
- **Railway:** https://railway.app
- **Documentação Cakto:** https://docs.cakto.com.br

---

## 📄 Licença

MIT License - Veja LICENSE para mais detalhes.

---

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor:
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

## 🎉 Agradecimentos

- Equipe Cakto pelo suporte
- Comunidade Supabase
- Todos os contribuidores

---

**🚀 Projeto pronto para produção!**

**📅 Última atualização:** 10/11/2025  
**✅ Status:** Totalmente funcional e testado
