# 🧪 Guia de Teste - Sistema de Confirmação de Email

## 📋 Pré-requisitos

### 1. Configurar Supabase Dashboard

Acesse: https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk/auth/url-configuration

**Site URL:**
```
https://zapcorte.com.br
```

**Redirect URLs (copiar e colar todas):**
```
http://localhost:5173/auth/callback
http://localhost:5173/auth/verify
http://localhost:5173/auth/confirm
http://localhost:5173/dashboard
http://localhost:5173/email-confirmado
https://zapcorte.com.br/auth/callback
https://zapcorte.com.br/auth/verify
https://zapcorte.com.br/auth/confirm
https://zapcorte.com.br/dashboard
https://zapcorte.com.br/email-confirmado
https://www.zapcorte.com.br/auth/callback
https://www.zapcorte.com.br/auth/verify
https://www.zapcorte.com.br/auth/confirm
https://www.zapcorte.com.br/dashboard
https://www.zapcorte.com.br/email-confirmado
```

### 2. Criar Tabela `barbeiros`

Execute o SQL no Supabase SQL Editor:
```bash
# Arquivo: migrations/create_barbeiros_table.sql
```

Ou copie e execute manualmente no SQL Editor do Supabase.

### 3. Habilitar Confirmação de Email

No Supabase Dashboard > Authentication > Providers > Email:
- ✅ Marcar "Enable email confirmations"
- ✅ Salvar

## 🚀 Teste Passo a Passo

### Teste 1: Cadastro Básico

1. **Iniciar servidor:**
```bash
cd zap-corte-pro-main
npm run dev
```

2. **Acessar página de cadastro:**
```
http://localhost:5173/register
```

3. **Preencher formulário:**
- Nome: `João Silva`
- Telefone: `(11) 98765-4321`
- Email: `seu-email-real@gmail.com` (use um email real que você tenha acesso)
- Senha: `senha123`
- Confirmar Senha: `senha123`

4. **Clicar em "Cadastrar"**

5. **Verificar redirecionamento:**
- Deve redirecionar para `/confirmar-email`
- Deve mostrar o email cadastrado
- Deve ter botão "Reenviar email"

6. **Abrir console do navegador (F12):**
```
✅ Deve ver: "📝 Dados salvos no localStorage"
✅ Deve ver: "✅ Usuário criado: seu-email@gmail.com"
```

### Teste 2: Confirmação de Email

1. **Abrir seu email**
- Verificar caixa de entrada
- Verificar pasta de spam/lixo eletrônico

2. **Encontrar email do Supabase:**
- Assunto: "Confirm your signup"
- Remetente: noreply@mail.app.supabase.io

3. **Clicar no link "Confirm your mail"**

4. **Verificar redirecionamento:**
- Deve redirecionar para `/auth/confirm`
- Deve mostrar "Confirmando email..."
- Deve mostrar ícone de loading

5. **Aguardar processamento:**
- Deve mostrar "Sucesso!"
- Deve redirecionar para `/email-confirmado`

6. **Verificar página de sucesso:**
- Deve mostrar checkmark verde animado
- Deve mostrar "Email confirmado!"
- Deve mostrar "Configurando sua conta..."
- Deve ter countdown de 5 segundos
- Deve redirecionar automaticamente para `/login`

7. **Verificar console do navegador:**
```
✅ [AuthConfirm] Parâmetros recebidos: token_hash=true...
✅ [AuthConfirm] Tentativa 1: verifyOtp com token_hash
✅ [AuthConfirm] ✅ Sucesso com verifyOtp + token_hash
✅ Usuário autenticado: seu-email@gmail.com
✅ Barbeiro criado com sucesso
```

### Teste 3: Verificar Banco de Dados

1. **Acessar Supabase Table Editor:**
```
https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk/editor
```

2. **Abrir tabela `barbeiros`:**
- Deve ter 1 registro novo
- Verificar campos:
  - `nome`: João Silva
  - `email`: seu-email@gmail.com
  - `telefone`: (11) 98765-4321
  - `status`: ativo
  - `plano`: freemium
  - `auth_id`: UUID válido

3. **Abrir tabela `auth.users`:**
- Deve ter 1 usuário novo
- Verificar campos:
  - `email`: seu-email@gmail.com
  - `email_confirmed_at`: data/hora atual
  - `user_metadata`: deve conter nome e telefone

### Teste 4: Login

1. **Acessar página de login:**
```
http://localhost:5173/login
```

2. **Fazer login:**
- Email: `seu-email@gmail.com`
- Senha: `senha123`

3. **Verificar:**
- Deve fazer login com sucesso
- Deve redirecionar para `/dashboard`
- Deve mostrar dados do barbeiro

## 🔍 Testes de Erro

### Teste 5: Token Expirado

1. **Cadastrar novo usuário**

2. **NÃO clicar no link do email**

3. **Aguardar 24 horas** (ou simular)

4. **Clicar no link expirado**

5. **Verificar:**
- Deve mostrar erro "Token expirado"
- Deve ter botão "Reenviar email"
- Clicar no botão deve reenviar

### Teste 6: Email Já Confirmado

1. **Usar email já confirmado**

2. **Clicar no link de confirmação novamente**

3. **Verificar:**
- Deve mostrar "Email já confirmado!"
- Deve redirecionar para login

### Teste 7: Reenvio de Email

1. **Na página `/confirmar-email`**

2. **Clicar em "Reenviar email"**

3. **Verificar:**
- Deve mostrar toast "Email reenviado!"
- Botão deve ficar desabilitado por 60 segundos
- Deve mostrar countdown "Aguarde Xs"

4. **Verificar email:**
- Deve receber novo email
- Link deve funcionar normalmente

### Teste 8: Cadastro Duplicado

1. **Tentar cadastrar com email já usado**

2. **Verificar:**
- Deve mostrar erro do Supabase
- Não deve criar registro duplicado

## 🐛 Debug

### Teste 9: Página de Debug

1. **Acessar:**
```
http://localhost:5173/auth/verify
```

2. **Verificar informações:**
- URL completa
- Parâmetros de busca
- Parâmetros do hash
- Sessão atual
- Usuário atual
- Log de tentativas

3. **Usar botões de ação:**
- "Tentar /auth/confirm"
- "Tentar /auth/callback"
- "Ir para Login"

### Teste 10: Logs do Console

Abrir console do navegador (F12) e verificar logs:

**Durante cadastro:**
```
📝 Dados salvos no localStorage
✅ Usuário criado: email@exemplo.com
```

**Durante confirmação:**
```
[AuthConfirm] Parâmetros recebidos: token_hash=true, token=false, code=false, type=email
[AuthConfirm] Tentativa 1: verifyOtp com token_hash
[AuthConfirm] ✅ Sucesso com verifyOtp + token_hash
```

**Durante criação do barbeiro:**
```
✅ Usuário autenticado: email@exemplo.com
📋 Dados do usuário: {nome: "João Silva", email: "...", telefone: "..."}
🔄 Tentativa 1 de 3
✅ Barbeiro criado com sucesso: {id: "...", nome: "João Silva", ...}
```

## 📊 Checklist de Teste

- [ ] Configurar URLs no Supabase
- [ ] Criar tabela `barbeiros`
- [ ] Habilitar confirmação de email
- [ ] Teste 1: Cadastro básico ✅
- [ ] Teste 2: Confirmação de email ✅
- [ ] Teste 3: Verificar banco de dados ✅
- [ ] Teste 4: Login ✅
- [ ] Teste 5: Token expirado ✅
- [ ] Teste 6: Email já confirmado ✅
- [ ] Teste 7: Reenvio de email ✅
- [ ] Teste 8: Cadastro duplicado ✅
- [ ] Teste 9: Página de debug ✅
- [ ] Teste 10: Logs do console ✅

## 🚨 Problemas Comuns

### Email não chega
**Solução:**
1. Verificar pasta de spam
2. Verificar configurações SMTP no Supabase
3. Usar email real (não temporário)
4. Aguardar alguns minutos

### Token inválido
**Solução:**
1. Verificar se URLs estão configuradas no Supabase
2. Usar botão "Reenviar email"
3. Verificar se o link não foi modificado

### Barbeiro não é criado
**Solução:**
1. Verificar logs no console
2. Verificar se tabela `barbeiros` existe
3. Verificar RLS policies
4. Sistema tem retry automático (3 tentativas)

### Erro de redirect
**Solução:**
1. Verificar todas as URLs no Supabase Dashboard
2. Limpar cache do navegador
3. Verificar se está usando http ou https correto

## 📱 Teste em Produção

Após testar localmente, repetir testes em produção:

1. **Deploy para Vercel/Netlify**

2. **Atualizar URLs no Supabase:**
- Usar URLs de produção (zapcorte.com.br)

3. **Testar fluxo completo:**
- Cadastro
- Confirmação
- Login

4. **Monitorar:**
- Logs do Vercel/Netlify
- Logs do Supabase
- Taxa de confirmação

---

**Status:** ✅ Pronto para teste
**Última atualização:** 2025-11-13
