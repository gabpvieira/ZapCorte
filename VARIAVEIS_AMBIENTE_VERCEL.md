# 🔐 Variáveis de Ambiente - Vercel

## Configuração Necessária

Para que o sistema funcione corretamente em produção, adicione as seguintes variáveis de ambiente no Vercel:

### 1. Acessar Configurações

1. Acesse: https://vercel.com/seu-projeto
2. Vá em: **Settings** → **Environment Variables**

### 2. Adicionar Variáveis

#### Supabase (Já configurado)
```
VITE_SUPABASE_URL=https://ihwkbflhxvdsewifofdk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlod2tiZmxoeHZkc2V3aWZvZmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4ODk1NTMsImV4cCI6MjA3NzQ2NTU1M30.cN1Xk8dpFXN4XPzm8M167jPWxWv0c-3GG2uYPvolBdQ
```

#### OneSignal (ADICIONAR AGORA) ⚠️
```
VITE_ONESIGNAL_APP_ID=4b3e5d19-c380-453a-b727-ed1cd29e1d8a
VITE_ONESIGNAL_REST_API_KEY=os_v2_org_hg63ke2npjgmxlbmiq6jrbqd3asofgetzgeehkefvj67mivdcxeqe7w2zx7x26pste4d7vhlgp7ib6g4wkgd6jm56mricgwexlq6vwq
```

#### Cakto (Já configurado)
```
VITE_CAKTO_CHECKOUT_STARTER=https://pay.cakto.com.br/3th8tvh
VITE_CAKTO_CHECKOUT_PRO=https://pay.cakto.com.br/9jk3ref
```

### 3. Configurar para Todos os Ambientes

Para cada variável, selecione:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

### 4. Salvar e Redeploy

1. Clique em **Save** para cada variável
2. Vá em **Deployments**
3. Clique no último deployment
4. Clique nos 3 pontos → **Redeploy**
5. Aguarde o deploy finalizar

### 5. Verificar

Após o deploy:

1. Acesse: https://zapcorte.com/dashboard/notifications
2. Não deve aparecer mais o alerta de "OneSignal não configurado"
3. Botão "Ativar Notificações" deve estar habilitado

## Checklist

- [ ] Variáveis do OneSignal adicionadas no Vercel
- [ ] Selecionado Production, Preview e Development
- [ ] Redeploy realizado
- [ ] Página de notificações testada
- [ ] Notificações funcionando

## Comandos Úteis

### Verificar variáveis localmente
```bash
cat .env.local
```

### Testar localmente
```bash
npm run dev
# Acesse: http://localhost:5173/dashboard/notifications
```

### Build de produção
```bash
npm run build
npm run preview
```

## Suporte

Se tiver problemas:
1. Verifique se as variáveis estão corretas no Vercel
2. Faça um novo deploy
3. Limpe o cache do navegador
4. Verifique o console do navegador para erros

## Segurança

⚠️ **IMPORTANTE:**
- Nunca commite o arquivo `.env.local` no Git
- O arquivo `.gitignore` já está configurado para ignorá-lo
- As variáveis no Vercel são seguras e criptografadas
